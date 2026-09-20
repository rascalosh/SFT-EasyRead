// Web Speech API (pengenalan suara) belum ada di lib.dom bawaan TypeScript,
// jadi bentuknya dideklarasikan seperlunya di sini dan dipakai bersama.

export type SpeechRecognitionAlternativeLike = { transcript: string }

export type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
}

export type SpeechRecognitionEventLike = {
  resultIndex: number
  results: { length: number; [index: number]: SpeechRecognitionResultLike }
}

export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort?: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike

/** Konstruktor pengenalan suara milik browser, atau null jika tidak tersedia. */
export function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null

  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function isRecognitionSupported() {
  return getRecognitionCtor() !== null
}
