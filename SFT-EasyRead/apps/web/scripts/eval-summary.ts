/**
 * Evaluasi ringkasan: prompt LAMA (v1) vs pipeline BARU (v2) berdampingan,
 * supaya perbaikannya terbukti, bukan diasumsikan.
 *
 *   cd apps/web
 *   node --experimental-strip-types --env-file=.env.local scripts/eval-summary.ts
 *
 * Korpus: scripts/fixtures/eval-corpus.json. Sengaja tidak ikut git karena
 * isinya dokumen pengguna. Tarik ulang dari Supabase (project
 * eeanqxzcupfreughknnd); duplikat identik dibuang lewat md5:
 *
 *   select id, title, md5(original_text) as md5, original_text as text
 *   from (
 *     select distinct on (md5(original_text)) *
 *     from documents
 *     where original_text is not null
 *       and length(original_text) between 400 and 20000
 *     order by md5(original_text), created_at desc
 *   ) unique_docs
 *   order by created_at desc;
 *
 * Simpan sebagai array [{ label, id, title, md5, text }]; `label` bebas.
 *
 * Jeda 5 detik antar panggilan (rate limit free tier: tanpa jeda, 2 dari 8
 * dokumen kena 429), dihitung DI LUAR latensi. Hasil lengkap disimpan ke
 * scripts/eval-results/ (juga tidak ikut git).
 */

import crypto from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"

import { activeModel, generateStructured } from "@repo/web/lib/gemini"
import { DEFAULT_TARGET_LEVEL } from "@repo/web/lib/prompts/summary.prompt"
import { measureDifficulty, type Difficulty } from "@repo/web/lib/readability"
import { inventedNumbers, readingSurface, summarizeText } from "@repo/web/lib/summarize"
import { storedSummarySchema, summarySchema, type SummaryResult } from "@repo/schemas/summary"

const GAP_MS = 5000

/** Ambang mentor: FK-id di bawah 7 baru nyaman untuk pembaca disleksia. */
const FK_THRESHOLD = 7

const CORPUS_URL = new URL("./fixtures/eval-corpus.json", import.meta.url)
const RESULTS_URL = new URL("./eval-results/", import.meta.url)

type CorpusDoc = { label?: string; id: string; title: string; md5?: string; text: string }

type Pipeline = "v1" | "v2"

type Retention = { kept: number; total: number; lost: string[] }

type Run =
    | {
          ok: true
          result: SummaryResult
          difficulty: Difficulty
          latencyMs: number
          /** Panggilan Gemini yang terlihat (tanpa retry internal generateStructured). */
          calls: number
          invented: string[]
          retained: Retention
          schemaValid: boolean
          mode?: string
      }
    | { ok: false; error: string }

type Row = { label: string; title: string; source: Difficulty; v1: Run; v2: Run }

/** Prompt v1 disalin apa adanya dari sebelum pipeline v2, sebagai pembanding. */
function buildSummaryPromptV1(text: string) {
    return `
Kamu adalah AI EasyRead.

Buat ringkasan teks Bahasa Indonesia agar mudah dipahami oleh pembaca dengan kesulitan membaca seperti disleksia.

Aturan:
- Ringkasan maksimal 120 kata.
- Gunakan Bahasa Indonesia sederhana.
- Pertahankan fakta, nama orang, tempat, tanggal, dan angka.
- Fokus hanya pada ide utama.

Kembalikan JSON dengan format yang diminta.

Teks:
${text}
`
}

const NUMBER = /\b\d[\d.,]*\b/g

/** Angka di teks. Nomor butir/bagian di awal baris ("8. Dampak", "1. OCR") bukan fakta. */
function factNumbers(text: string) {
    const withoutNumbering = text.replace(/^\s*\d+\.(?=\s)/gm, "")
    return (withoutNumbering.match(NUMBER) ?? []).map((n) => n.replace(/[.,]+$/, ""))
}

/**
 * Angka sumber (distinct) yang masih muncul di ringkasan.
 *
 * `inventedNumbers` hanya menangkap angka yang DITAMBAHKAN. Fakta yang
 * DIBUANG tidak terlihat di sana, padahal ringkasan bisa jadi lebih mudah
 * dibaca justru karena membuang tanggal dan angka penting — pada korpus ini
 * v2 konsisten membuang "7 Mei 2021" dan "3-2-1" dari Mitigasi.
 */
function retainedNumbers(sourceText: string, result: SummaryResult): Retention {
    const surface = new Set(factNumbers(readingSurface(result)))
    const wanted = [...new Set(factNumbers(sourceText))]
    const forms = (n: string) => [n, n.replace(/[.,]/g, ""), n.split(/[.,]/)[0] ?? ""]
    const lost = wanted.filter((n) => !forms(n).some((form) => form && surface.has(form)))
    return { kept: wanted.length - lost.length, total: wanted.length, lost }
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function md5(text: string) {
    return crypto.createHash("md5").update(text, "utf8").digest("hex")
}

function errorMessage(error: unknown) {
    return (error instanceof Error ? error.message : String(error)).slice(0, 300)
}

let callsStarted = 0

/** Jeda sebelum tiap panggilan kecuali yang pertama; jedanya tidak ikut diukur. */
async function timed<T>(run: () => Promise<T>) {
    if (callsStarted > 0) await wait(GAP_MS)
    callsStarted += 1

    const startedAt = performance.now()
    const value = await run()
    return { value, latencyMs: Math.round(performance.now() - startedAt) }
}

async function runV1(text: string): Promise<Run> {
    try {
        const { value, latencyMs } = await timed(() =>
            generateStructured(summarySchema, buildSummaryPromptV1(text)),
        )
        return {
            ok: true,
            result: value,
            difficulty: measureDifficulty(readingSurface(value)),
            latencyMs,
            calls: 1,
            invented: inventedNumbers(text, value),
            retained: retainedNumbers(text, value),
            schemaValid: summarySchema.safeParse(value).success,
        }
    } catch (error) {
        return { ok: false, error: errorMessage(error) }
    }
}

async function runV2(text: string): Promise<Run> {
    try {
        const { value, latencyMs } = await timed(() => summarizeText(text))
        return {
            ok: true,
            result: value,
            // Diukur ulang dengan fungsi yang sama seperti v1 supaya adil.
            difficulty: measureDifficulty(readingSurface(value)),
            latencyMs,
            calls: 1 + value.revisionRounds,
            invented: inventedNumbers(text, value),
            retained: retainedNumbers(text, value),
            schemaValid: storedSummarySchema.safeParse(value).success,
            mode: value.mode,
        }
    } catch (error) {
        return { ok: false, error: errorMessage(error) }
    }
}

function mean(values: number[]) {
    return values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : Number.NaN
}

function median(values: number[]) {
    if (!values.length) return Number.NaN
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

function aggregate(rows: Row[], pipeline: Pipeline) {
    const done = rows.flatMap((row) => {
        const run = row[pipeline]
        return run.ok ? [{ row, run }] : []
    })

    return {
        succeeded: done.length,
        total: rows.length,
        finalLevel: mean(done.map(({ run }) => run.difficulty.level)),
        levelDrop: mean(done.map(({ row, run }) => row.source.level - run.difficulty.level)),
        reachedTarget: done.filter(({ run }) => run.difficulty.level <= DEFAULT_TARGET_LEVEL).length,
        belowFkThreshold: done.filter(({ run }) => run.difficulty.fkId < FK_THRESHOLD).length,
        worse: done.filter(({ row, run }) => run.difficulty.level > row.source.level).map(({ row }) => row.label),
        fkId: mean(done.map(({ run }) => run.difficulty.fkId)),
        wordsPerSentence: mean(done.map(({ run }) => run.difficulty.wordsPerSentence)),
        longWordDrop: mean(done.map(({ row, run }) => row.source.longWordRatio - run.difficulty.longWordRatio)),
        calls: mean(done.map(({ run }) => run.calls)),
        invented: done.flatMap(({ row, run }) => run.invented.map((n) => `${row.label}:${n}`)),
        numbersKept: done.reduce((sum, { run }) => sum + run.retained.kept, 0),
        numbersTotal: done.reduce((sum, { run }) => sum + run.retained.total, 0),
        numbersLost: done.flatMap(({ row, run }) =>
            run.retained.lost.length ? [`${row.label}:${run.retained.lost.join("/")}`] : [],
        ),
        schemaValid: done.filter(({ run }) => run.schemaValid).length,
        medianLatencyMs: median(done.map(({ run }) => run.latencyMs)),
    }
}

function fixed(value: number, digits = 2) {
    return Number.isNaN(value) ? "-" : value.toFixed(digits)
}

function levelCell(difficulty: Difficulty) {
    return `L${difficulty.level} · FK ${fixed(difficulty.fkId, 1)}`
}

function cell(run: Run) {
    return run.ok ? levelCell(run.difficulty) : "GAGAL"
}

function loadCorpus(): CorpusDoc[] {
    if (!existsSync(CORPUS_URL)) {
        console.error(
            "Korpus tidak ditemukan: scripts/fixtures/eval-corpus.json\n" +
                "Tarik ulang dari Supabase dengan query di kepala file ini.",
        )
        process.exit(1)
    }

    const corpus = JSON.parse(readFileSync(CORPUS_URL, "utf8")) as CorpusDoc[]

    for (const doc of corpus) {
        if (doc.md5 && md5(doc.text) !== doc.md5) {
            console.warn(`! ${doc.label ?? doc.id}: md5 tidak cocok — teks berbeda dari salinan database`)
        }
    }

    return corpus
}

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY kosong. Jalankan dengan --env-file=.env.local")
        process.exit(1)
    }

    const corpus = loadCorpus()
    const startedAt = new Date()

    console.log(
        `Model ${activeModel()} · ${corpus.length} dokumen · target level <= ${DEFAULT_TARGET_LEVEL} ` +
            `(FK-id < ${FK_THRESHOLD}) · jeda ${GAP_MS / 1000} dtk\n`,
    )

    const rows: Row[] = []

    for (const [index, doc] of corpus.entries()) {
        const label = doc.label ?? doc.title
        const source = measureDifficulty(doc.text)

        const v1 = await runV1(doc.text)
        const v2 = await runV2(doc.text)
        rows.push({ label, title: doc.title, source, v1, v2 })

        const detail = (run: Run) =>
            run.ok
                ? `${cell(run)}, ${fixed(run.difficulty.wordsPerSentence, 1)} k/k, ${run.calls} pgl, ${run.latencyMs} ms` +
                  `, angka ${run.retained.kept}/${run.retained.total}` +
                  (run.invented.length ? `, ANGKA DIKARANG ${run.invented.join(",")}` : "")
                : `GAGAL (${run.error})`

        console.log(`[${index + 1}/${corpus.length}] ${label}  sumber ${levelCell(source)}`)
        console.log(`    v1: ${detail(v1)}`)
        console.log(`    v2: ${detail(v2)}${v2.ok ? ` · mode ${v2.mode}` : ""}`)
    }

    const summaryByPipeline = { v1: aggregate(rows, "v1"), v2: aggregate(rows, "v2") }

    console.log("\n| dokumen | mode v2 | sumber | v1 (lama) | v2 (baru) |")
    console.log("| --- | --- | --- | --- | --- |")
    for (const row of rows) {
        const mode = row.v2.ok ? row.v2.mode : "-"
        console.log(`| ${row.label} | ${mode} | ${levelCell(row.source)} | ${cell(row.v1)} | ${cell(row.v2)} |`)
    }

    console.log(
        `\n| | berhasil | level akhir | turun | level <= ${DEFAULT_TARGET_LEVEL} | FK-id < ${FK_THRESHOLD} | FK-id | kata/kalimat | kata panjang turun | panggilan | angka dikarang | angka sumber bertahan | median ms |`,
    )
    console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |")
    for (const pipeline of ["v1", "v2"] as const) {
        const s = summaryByPipeline[pipeline]
        console.log(
            `| ${pipeline === "v1" ? "v1 (lama)" : "v2 (baru)"} | ${s.succeeded}/${s.total} | ${fixed(s.finalLevel)} | ${fixed(s.levelDrop)} | ` +
                `${s.reachedTarget}/${s.succeeded} | ${s.belowFkThreshold}/${s.succeeded} | ${fixed(s.fkId)} | ${fixed(s.wordsPerSentence, 1)} | ` +
                `${fixed(s.longWordDrop, 3)} | ${fixed(s.calls, 1)} | ${s.invented.length} | ${s.numbersKept}/${s.numbersTotal} | ` +
                `${fixed(s.medianLatencyMs, 0)} |`,
        )
    }

    for (const pipeline of ["v1", "v2"] as const) {
        const s = summaryByPipeline[pipeline]
        if (s.worse.length) console.log(`\n${pipeline}: level NAIK dibanding sumber pada ${s.worse.join(", ")}`)
        if (s.invented.length) console.log(`${pipeline}: angka tanpa padanan di sumber: ${s.invented.join(", ")}`)
        if (s.numbersLost.length) console.log(`${pipeline}: angka sumber yang hilang: ${s.numbersLost.join(", ")}`)
        if (s.schemaValid < s.succeeded) console.log(`${pipeline}: ${s.succeeded - s.schemaValid} keluaran tidak lolos skema`)
    }

    mkdirSync(RESULTS_URL, { recursive: true })
    const outFile = new URL(`${startedAt.toISOString().replace(/[:.]/g, "-")}.json`, RESULTS_URL)
    writeFileSync(
        outFile,
        JSON.stringify(
            { model: activeModel(), startedAt, targetLevel: DEFAULT_TARGET_LEVEL, fkThreshold: FK_THRESHOLD, summary: summaryByPipeline, rows },
            null,
            2,
        ),
    )
    console.log(`\nHasil lengkap: ${outFile.pathname}`)
}

await main()
