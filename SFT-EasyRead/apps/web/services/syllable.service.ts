import { breakdownOf } from "@repo/web/lib/syllabify"
import * as simplificationRepository from "@repo/db/repositories/simplification"

/** Bentuk yang dirender LatihanKataPage — jangan diubah. */
export type SyllableView = {
    word: string
    breakdown: string
    meaning: string
    checkedAgo: string
}

const FALLBACK_MEANING = "Lihat kamus untuk arti."

/**
 * Arti kata diambil dari glossary yang SUDAH dibuat Gemini saat menyederhanakan
 * dokumen (`difficultWords` di hasil simplify), bukan dari request baru —
 * persis seperti yang diminta PLAN.md.
 */
async function loadGlossary(documentId: string | null) {
    const glossary = new Map<string, string>()
    if (!documentId) return glossary

    const row = await simplificationRepository.findLatestSimplification(documentId, "simplify")
    const result = (row?.result ?? null) as { difficultWords?: unknown } | null
    const entries = Array.isArray(result?.difficultWords) ? result.difficultWords : []

    for (const entry of entries) {
        const item = entry as { word?: unknown; explanation?: unknown }
        if (typeof item.word === "string" && typeof item.explanation === "string") {
            glossary.set(item.word.toLowerCase(), item.explanation)
        }
    }

    return glossary
}

export async function syllabifyWords(
    words: string[],
    documentId: string | null,
): Promise<SyllableView[]> {
    const glossary = await loadGlossary(documentId)

    const seen = new Set<string>()
    const results: SyllableView[] = []

    for (const raw of words) {
        const word = raw.toLowerCase().replace(/[^a-z]/g, "")
        if (!word || seen.has(word)) continue
        seen.add(word)

        results.push({
            word,
            breakdown: breakdownOf(word),
            meaning: glossary.get(word) ?? FALLBACK_MEANING,
            checkedAgo: "Baru saja",
        })
    }

    return results
}
