/**
 * Pipeline ringkasan v2: satu panggilan Gemini, lalu revisi terarah bila
 * ringkasan masih di atas level target atau mengarang angka.
 *
 * Sengaja murni (tanpa Supabase) supaya bisa diuji dan dievaluasi tanpa
 * kredensial database.
 */

import { generateStructured } from "@repo/web/lib/gemini"
import {
    buildSummaryPrompt,
    buildSummaryRevisionPrompt,
    DEFAULT_TARGET_LEVEL,
    MAX_WORDS_PER_SENTENCE,
    type SummaryMode,
} from "@repo/web/lib/prompts/summary.prompt"
import {
    hardWords,
    isAlreadyTerse,
    measureDifficulty,
    offendingSentences,
    type Difficulty,
} from "@repo/web/lib/readability"
import { summarySchema, type StoredSummary, type SummaryResult } from "@repo/schemas/summary"

/** PLAN.md membatasi dua retry; putaran revisi memakai anggaran yang sama. */
export const MAX_REVISION_ROUNDS = 2

export type SummaryOptions = { targetLevel?: number; maxRevisionRounds?: number }

export type SummaryAttempt = {
    result: SummaryResult
    difficulty: Difficulty
    /** Memuat angka yang tidak ada padanannya di sumber. */
    invents: boolean
}

/**
 * Urutan kandidat: kesetiaan dulu, baru kemudahan. Ringkasan yang lebih mudah
 * dibaca tapi mengarang angka lebih buruk daripada ringkasan yang agak sulit
 * tapi benar.
 */
function isBetter(candidate: SummaryAttempt, current: SummaryAttempt) {
    if (candidate.invents !== current.invents) return !candidate.invents
    return candidate.difficulty.level < current.difficulty.level
}

/** Permukaan baca yang dilihat pengguna: ringkasan DAN butir-butir. */
export function readingSurface(result: SummaryResult) {
    return [result.summary, ...result.bulletPoints].join("\n")
}

const NUMBER = /\b\d[\d.,]*\b/g

function rawNumbers(text: string) {
    return (text.match(NUMBER) ?? []).map((n) => n.replace(/[.,]+$/, ""))
}

/**
 * Semua bentuk sah sebuah angka sumber.
 *
 * Menyederhanakan teks sering menulis ulang format angka tanpa mengubah
 * faktanya: "pukul 10.00" jadi "jam 10", "Rp 5.000" jadi "5000". Pembandingan
 * mentah menandai itu sebagai halusinasi — persis yang terjadi saat penjagaan
 * ini pertama diuji.
 */
function knownNumbers(sourceText: string) {
    const known = new Set<string>()
    for (const value of rawNumbers(sourceText)) {
        known.add(value)
        known.add(value.replace(/[.,]/g, ""))
        const leading = value.split(/[.,]/)[0]
        if (leading) known.add(leading)
    }
    return known
}

export function inventedNumbers(sourceText: string, candidate: SummaryResult) {
    const known = knownNumbers(sourceText)
    return rawNumbers(readingSurface(candidate)).filter((value) => !known.has(value))
}

export function inventsNumbers(sourceText: string, candidate: SummaryResult) {
    return inventedNumbers(sourceText, candidate).length > 0
}

export async function summarizeText(
    originalText: string,
    options: SummaryOptions = {},
): Promise<StoredSummary> {
    const targetLevel = options.targetLevel ?? DEFAULT_TARGET_LEVEL
    const maxRounds = options.maxRevisionRounds ?? MAX_REVISION_ROUNDS

    const sourceDifficulty = measureDifficulty(originalText)
    const mode: SummaryMode = isAlreadyTerse(originalText) ? "terse" : "prose"

    const first = await generateStructured(
        summarySchema,
        buildSummaryPrompt(originalText, {
            mode, targetLevel, sourceLevel: sourceDifficulty.level,
        }),
    )

    let best: SummaryAttempt = {
        result: first,
        difficulty: measureDifficulty(readingSurface(first)),
        invents: inventsNumbers(originalText, first),
    }
    let rounds = 0

    for (let round = 1; round <= maxRounds; round += 1) {
        // Revisi dijalankan bukan hanya saat masih terlalu sulit, tapi juga saat
        // kandidat terbaik mengarang angka — hasil pertama pun tidak kebal.
        if (best.difficulty.level <= targetLevel && !best.invents) break

        const surface = readingSurface(best.result)
        let candidate: SummaryResult

        try {
            candidate = await generateStructured(
                summarySchema,
                buildSummaryRevisionPrompt({
                    sourceText: originalText,
                    previousSummary: best.result.summary,
                    previousBullets: best.result.bulletPoints,
                    currentLevel: best.difficulty.level,
                    targetLevel,
                    longSentences: offendingSentences(surface, MAX_WORDS_PER_SENTENCE),
                    hardWords: hardWords(surface),
                    mode,
                    inventedNumbers: inventedNumbers(originalText, best.result),
                }),
            )
        } catch (error) {
            // Revisi hanya jaring pengaman. Kalau gagal (mis. 429 di free tier
            // setelah retry habis), pakai hasil terbaik yang sudah ada daripada
            // membuang ringkasan yang sah dan menggagalkan seluruh permintaan.
            console.warn("Summary revision failed; keeping best attempt", error)
            break
        }

        rounds = round

        const attempt: SummaryAttempt = {
            result: candidate,
            difficulty: measureDifficulty(readingSurface(candidate)),
            invents: inventsNumbers(originalText, candidate),
        }

        if (isBetter(attempt, best)) best = attempt
    }

    return {
        ...best.result,
        difficulty: best.difficulty,
        sourceDifficulty,
        revisionRounds: rounds,
        mode,
        targetLevel,
    }
}
