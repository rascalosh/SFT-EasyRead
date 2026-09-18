/** Pecah teks jadi token kata (tanpa spasi) untuk sorotan TTS. */
export function tokenizeWords(text: string): string[] {
  return text.match(/\S+/g) ?? []
}

/**
 * Indeks kata dari `charIndex` event `onboundary`.
 * `charIndex` dihitung dari string ucapan: `words.slice(fromIndex).join(" ")`.
 */
export function wordIndexFromCharIndex(
  words: string[],
  fromIndex: number,
  charIndex: number,
): number {
  if (words.length === 0) return 0
  const start = Math.min(Math.max(0, fromIndex), words.length - 1)
  const slice = words.slice(start)
  const safeChar = Math.max(0, charIndex)

  let pos = 0
  for (let i = 0; i < slice.length; i++) {
    const end = pos + slice[i]!.length
    if (safeChar <= end) return start + i
    pos = end + 1
  }

  return start + slice.length - 1
}

export function utteranceTextFrom(words: string[], fromIndex: number) {
  return words.slice(fromIndex).join(" ")
}

type SpeechSettings = {
  language: string
  ttsSpeed: number
}

/**
 * Voice harus di-set dulu: banyak engine Windows mereset `rate` jika
 * `u.voice` diubah setelah `u.rate`.
 */
export function applySpeechSettings(
  u: SpeechSynthesisUtterance,
  settings: SpeechSettings,
  rate = settings.ttsSpeed,
) {
  u.lang = settings.language || "id-ID"
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    u.rate = rate
    return
  }

  const prefix = u.lang.slice(0, 2).toLowerCase()
  const voices = window.speechSynthesis.getVoices()
  const match =
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix) && v.localService) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  if (match) u.voice = match
  u.rate = rate
}

export function speakWithSettings(
  text: string,
  settings: SpeechSettings,
  extra?: { onend?: () => void },
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  applySpeechSettings(u, settings)
  if (extra?.onend) u.onend = extra.onend
  window.speechSynthesis.speak(u)
}
