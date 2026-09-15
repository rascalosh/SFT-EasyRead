import { splitFocusSentences } from "@/lib/focus-sentences"
import { tokenizeWords } from "@/lib/tts-sync"

/**
 * Penilaian suara dibatasi 2 menit (kolom speech_assessments.duration_seconds).
 * Dengan kecepatan nyaman ±100 kata/menit, bagian yang dibaca dijaga sekitar
 * 150 kata supaya pembaca sempat menyelesaikannya tanpa terburu-buru.
 */
export const EXCERPT_MAX_WORDS = 150

export type ReadingExcerpt = {
  /** Paragraf yang dipakai untuk dibaca; batas paragraf asli dipertahankan. */
  paragraphs: string[]
  words: number
  /** true jika teks asli lebih panjang daripada bagian yang ditampilkan. */
  truncated: boolean
}

/**
 * Ambil kalimat-kalimat awal sampai mendekati batas kata. Selalu memotong di
 * akhir kalimat dan selalu menyertakan minimal satu kalimat.
 */
export function selectReadingExcerpt(blocks: string[], maxWords = EXCERPT_MAX_WORDS): ReadingExcerpt {
  const out: string[] = []
  let words = 0
  let truncated = false

  outer: for (const block of blocks) {
    const sentences = splitFocusSentences(block)
    const kept: string[] = []

    for (const sentence of sentences) {
      const count = tokenizeWords(sentence).length
      const hasSomething = words > 0
      if (hasSomething && words + count > maxWords) {
        truncated = true
        if (kept.length) out.push(kept.join(" "))
        break outer
      }
      kept.push(sentence)
      words += count
    }

    if (kept.length) out.push(kept.join(" "))
  }

  return { paragraphs: out, words, truncated }
}

/** Paragraf bacaan dari ringkasan: prosa dulu, lalu tiap butir. */
export function blocksFromSummary(summary: string, bulletPoints: string[]) {
  return [summary, ...bulletPoints].map((part) => part.trim()).filter(Boolean)
}
