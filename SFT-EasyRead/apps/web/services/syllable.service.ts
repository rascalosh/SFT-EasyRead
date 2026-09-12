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

    const row = await simplificationRepository.findLatestSimplification(documentId, "simplify")
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
