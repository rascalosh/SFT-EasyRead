import { breakdownOf } from "@repo/web/lib/syllabify"
import { generateStructured } from "@repo/web/lib/gemini"
import { buildWordMeaningPrompt } from "@repo/web/lib/prompts/word-meaning.prompt"
import { wordMeaningSchema } from "@repo/schemas/word-meaning"
import * as simplificationRepository from "@repo/db/repositories/simplification"

/** Bentuk yang dirender LatihanKataPage — jangan diubah. */
export type SyllableView = {
    word: string
    breakdown: string
    meaning: string
    checkedAgo: string
}

const FALLBACK_MEANING = "Arti kata ini belum tersedia. Coba lagi sebentar."

/** Timeout pendek — ini layanan pihak ketiga (hobby project, bukan SLA),
 *  jangan sampai satu ketukan kata menggantung lama kalau sedang lambat/down. */
const KBBI_TIMEOUT_MS = 2500

type KbbiEntry = {
    definitions?: Array<{ definition?: string }>
}

type KbbiResponse = {
    entries?: KbbiEntry[]
}

/**
 * Kamus Besar Bahasa Indonesia lewat mirror API tidak resmi (kbbi.raf555.dev)
 * — bukan layanan resmi Badan Bahasa, jadi diperlakukan sebagai best-effort:
 * kalau lambat, down, atau kata tidak ditemukan, diamkan dan lanjut ke
 * fallback AI. Data KBBI dilarang dipakai untuk keperluan komersial
 * (UU Hak Cipta No. 28/2014) — hanya pantas dipakai selama EasyRead AI
 * nonkomersial.
 */
async function lookupKbbi(word: string): Promise<string | null> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), KBBI_TIMEOUT_MS)

    try {
        const response = await fetch(
            `https://kbbi.raf555.dev/api/v1/entry/${encodeURIComponent(word)}`,
            { signal: controller.signal },
        )
        if (!response.ok) return null

        const data = (await response.json()) as KbbiResponse
        const definition = data.entries?.[0]?.definitions?.[0]?.definition?.trim()
        return definition || null
    } catch {
        return null
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Kata yang tidak ada di glosarium Simplify diartikan lewat KBBI dulu, lalu
 * Gemini kalau KBBI tidak punya entrinya atau sedang tidak bisa diakses —
 * bukan ditinggal dengan placeholder "lihat kamus". Dipicu satu kata per
 * ketukan pengguna di Syllable Breaker (lihat handleWordClick di
 * LatihanKataPage), jadi tidak dipanggil massal untuk semua kata sekaligus.
 */
async function defineWordSimple(word: string): Promise<string> {
    const kbbi = await lookupKbbi(word)
    if (kbbi) return kbbi

    try {
        const result = await generateStructured(wordMeaningSchema, buildWordMeaningPrompt(word))
        return result.meaning.trim() || FALLBACK_MEANING
    } catch {
        return FALLBACK_MEANING
    }
}

/**
 * Arti kata diambil dari glossary yang SUDAH dibuat Gemini saat menyederhanakan
 * dokumen (`difficultWords` di hasil simplify), bukan dari request baru —
 * persis seperti yang diminta PLAN.md.
 */
function collectDifficultWords(result: unknown): Array<{ word: string; explanation: string }> {
    if (!result || typeof result !== "object") return []
    const root = result as { difficultWords?: unknown; paragraphs?: unknown }
    const nested = Array.isArray(root.paragraphs)
        ? root.paragraphs.flatMap((paragraph) => {
            const item = paragraph as { difficultWords?: unknown }
            return Array.isArray(item.difficultWords) ? item.difficultWords : []
        })
        : []
    const entries = [
        ...(Array.isArray(root.difficultWords) ? root.difficultWords : []),
        ...nested,
    ]

    const words: Array<{ word: string; explanation: string }> = []
    for (const entry of entries) {
        const item = entry as { word?: unknown; explanation?: unknown }
        if (typeof item.word === "string" && typeof item.explanation === "string") {
            words.push({ word: item.word, explanation: item.explanation })
        }
    }
    return words
}

async function loadGlossary(documentId: string | null) {
    const glossary = new Map<string, string>()
    if (!documentId) return glossary

    // Hanya versi paragraf ("v1") yang membawa difficultWords; versi
    // terstruktur berisi Markdown utuh tanpa glosarium.
    const row = await simplificationRepository.findLatestSimplification(documentId, "simplify", "v1")
    for (const entry of collectDifficultWords(row?.result)) {
        glossary.set(entry.word.toLowerCase().replace(/[^a-z]/g, ""), entry.explanation)
    }

    return glossary
}

export async function syllabifyWords(
    words: string[],
    documentId: string | null,
): Promise<SyllableView[]> {
    const glossary = await loadGlossary(documentId)

    const seen = new Set<string>()
    const unique: string[] = []

    for (const raw of words) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, "")
        if (!word || seen.has(word)) continue
        seen.add(word)
        unique.push(word)
    }

    const results = await Promise.all(
        unique.map(async (word) => ({
            word,
            breakdown: breakdownOf(word),
            meaning: glossary.get(word) ?? (await defineWordSimple(word)),
            checkedAgo: "Baru saja",
        })),
    )

    return results
}
