"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  getRecognitionCtor,
  isRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition"
import type { ReadingSettings } from "@/lib/session"

const noopSubscribe = () => () => {}

/**
 * Dikte singkat untuk mengisi jawaban lewat suara. Mengetik sering jadi
 * hambatan bagi pembaca disleksia, jadi jawaban boleh diucapkan.
 */
export function useDictation(
  settingsRef: { current: ReadingSettings },
  onText: (text: string) => void,
) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Server selalu "tidak didukung" agar markup awal cocok saat hidrasi.
  const supported = useSyncExternalStore(noopSubscribe, isRecognitionSupported, () => false)
  const engine = useRef<SpeechRecognitionLike | null>(null)
  const onTextRef = useRef(onText)

  useEffect(() => {
    onTextRef.current = onText
  }, [onText])

  const stop = useCallback(() => {
    const current = engine.current
    engine.current = null
    if (current) {
      current.onresult = null
      current.onerror = null
      current.onend = null
      try {
        current.stop()
      } catch {
        // sudah berhenti
      }
    }
    setListening(false)
  }, [])

  const start = useCallback(() => {
    setError(null)
    const Recognition = getRecognitionCtor()
    if (!Recognition) {
      setError("Browser ini belum mendukung jawaban lewat suara. Ketik jawabanmu saja.")
      return
    }

    stop()

    const recognizer = new Recognition()
    recognizer.lang = settingsRef.current.language || "id-ID"
    recognizer.continuous = true
    recognizer.interimResults = false

    recognizer.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result?.isFinal) continue
        const text = result[0].transcript.trim()
        if (text) onTextRef.current(text)
      }
    }

    recognizer.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser.")
      } else if (event.error === "no-speech") {
        setError("Belum ada suara yang terdengar. Coba ucapkan lagi lebih dekat ke mikrofon.")
      } else if (event.error && event.error !== "aborted") {
        setError("Pengenalan suara terhenti. Coba lagi.")
      }
      engine.current = null
      setListening(false)
    }

    recognizer.onend = () => {
      if (engine.current === recognizer) engine.current = null
      setListening(false)
    }

    engine.current = recognizer

    try {
      recognizer.start()
      setListening(true)
    } catch {
      engine.current = null
      setError("Pengenalan suara gagal dimulai. Coba muat ulang halaman.")
    }
  }, [settingsRef, stop])

  useEffect(() => stop, [stop])

  const clearError = useCallback(() => setError(null), [])

  return { supported, listening, error, start, stop, clearError }
}
