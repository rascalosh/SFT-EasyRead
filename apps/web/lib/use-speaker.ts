"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { applySpeechSettings } from "@/lib/tts-sync"
import type { ReadingSettings } from "@/lib/session"

function hasSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

const noopSubscribe = () => () => {}

/**
 * Text-to-speech dengan status "sedang bicara" yang bisa dipakai tombol
 * putar/berhenti. Ucapan otomatis dihentikan saat komponen dilepas.
 */
export function useSpeaker(settingsRef: { current: ReadingSettings }) {
  const [speaking, setSpeaking] = useState(false)
  const [speakingKey, setSpeakingKey] = useState<string | null>(null)
  const generation = useRef(0)
  // Server selalu "tidak didukung" agar markup awal cocok saat hidrasi.
  const supported = useSyncExternalStore(noopSubscribe, hasSpeech, () => false)

  const stop = useCallback(() => {
    generation.current += 1
    if (hasSpeech()) window.speechSynthesis.cancel()
    setSpeaking(false)
    setSpeakingKey(null)
  }, [])

  const speak = useCallback(
    (text: string, key = "default") => {
      if (!hasSpeech()) return
      const clean = text.trim()
      if (!clean) return

      window.speechSynthesis.cancel()
      generation.current += 1
      const gen = generation.current

      const utterance = new SpeechSynthesisUtterance(clean)
      applySpeechSettings(utterance, settingsRef.current)

      const finish = () => {
        if (gen !== generation.current) return
        setSpeaking(false)
        setSpeakingKey(null)
      }
      utterance.onend = finish
      utterance.onerror = finish

      setSpeaking(true)
      setSpeakingKey(key)
      window.speechSynthesis.speak(utterance)
    },
    [settingsRef],
  )

  /** Putar jika diam, hentikan jika sedang memutar teks dengan kunci yang sama. */
  const toggle = useCallback(
    (text: string, key = "default") => {
      if (speaking && speakingKey === key) {
        stop()
        return
      }
      speak(text, key)
    },
    [speak, speaking, speakingKey, stop],
  )

  useEffect(() => stop, [stop])

  return { speaking, speakingKey, speak, stop, toggle, supported }
}
