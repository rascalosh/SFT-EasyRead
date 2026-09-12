import { splitSentences } from "@/lib/readability"

/** Pecah teks bacaan per kalimat (sampai titik), tanpa membuang kalimat pendek. */
export function splitFocusSentences(text: string): string[] {
  const parts = splitSentences(text, { minWords: 0 })
  if (parts.length) return parts
  const trimmed = text.trim()
  return trimmed ? [trimmed] : []
}

export function flattenFocusSentences(blocks: string[]): string[] {
  return blocks.flatMap((block) => splitFocusSentences(block))
}
