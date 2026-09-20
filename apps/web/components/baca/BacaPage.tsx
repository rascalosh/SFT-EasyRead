"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { hrefFor } from "@/lib/nav"
import { Card, Button, SegmentedControl } from "@/components/shared/ui"
import { IconSparkle, IconSpeaker } from "@/components/shared/icons"
import { FocusRulerSentences } from "@/components/shared/FocusRulerSentences"
import { MaterialNotFound } from "@/components/material/MaterialNotFound"
import { useActiveDocument } from "@/lib/use-active-document"
import { ReadingToolbar } from "@/components/baca/ReadingToolbar"
import {
  loadSettings,
  syncSettingsFromServer,
  saveSettingsEverywhere,
  applyFontPreferences,
  defaultSettings,
  getContrastOption,
  SETTINGS_EVENT,
  type ReadingContrastId,
  type ReadingFontId,
  type ReadingSettings,
  type FocusRulerMode,
} from "@/lib/session"
import { speakWithSettings } from "@/lib/tts-sync"

export default function ReadingInterface({ documentId, }: { documentId: string | null}) {
  const router = useRouter()
  const { material, loading } = useActiveDocument({ documentId })
  const settingsRef = useRef(defaultSettings)

  // Gunakan defaultSettings sebagai initial value agar SSR & client match
  const [readingFont, setReadingFont] = useState<ReadingFontId>(defaultSettings.readingFont)
  const [size, setSize] = useState(defaultSettings.fontSize)
  const [spacing, setSpacing] = useState(defaultSettings.letterSpacing)
  const [contrastId, setContrastId] = useState<ReadingContrastId>(defaultSettings.contrastId)
  const [focusRuler, setFocusRuler] = useState(defaultSettings.focusRuler)
  const [focusRulerMode, setFocusRulerMode] = useState<FocusRulerMode>(defaultSettings.focusRulerMode)
  const [autoTts, setAutoTts] = useState(defaultSettings.autoTts)
  const [ttsActive, setTtsActive] = useState(false)

  // Setelah mount: baca localStorage & session (aman dari SSR)
  useEffect(() => {
    const sync = () => {
      const s = loadSettings()
      settingsRef.current = s
      setReadingFont(s.readingFont)
      setSize(s.fontSize)
      setSpacing(s.letterSpacing)
      setContrastId(s.contrastId)
      setFocusRuler(s.focusRuler)
      setFocusRulerMode(s.focusRulerMode)
      setAutoTts(s.autoTts)
    }
    sync()
    // Preferensi milik akun menimpa setelan perangkat; hasilnya memicu
    // SETTINGS_EVENT sehingga `sync` di atas berjalan lagi dengan nilai baru.
    void syncSettingsFromServer()
    window.addEventListener(SETTINGS_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(SETTINGS_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  useEffect(() => {
    if (!material) return
    if (!autoTts) return
    const text = (
      material.paragraphs?.length
        ? material.paragraphs
        : material.originalText?.trim()
          ? [material.originalText]
          : []
    )
      .join(" ")
      .trim()
    if (!text) return
    speakWithSettings(text, settingsRef.current, {
      onend: () => setTtsActive(false),
    })
    setTtsActive(true)
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel()
      setTtsActive(false)
    }
  }, [material?.id, autoTts])

  const contrast = getContrastOption(contrastId)

  function persist(partial: Partial<ReadingSettings>) {
    const next = { ...settingsRef.current, ...partial }
    settingsRef.current = next
    saveSettingsEverywhere(next)
    applyFontPreferences(next)
    if (partial.readingFont !== undefined) setReadingFont(partial.readingFont)
    if (partial.fontSize !== undefined) setSize(partial.fontSize)
    if (partial.letterSpacing !== undefined) setSpacing(partial.letterSpacing)
    if (partial.contrastId !== undefined) setContrastId(partial.contrastId)
  }

  const title = material?.title ?? "Materi"
  const lines =
    material?.paragraphs?.length
      ? material.paragraphs
      : material?.originalText?.trim()
        ? [material.originalText]
        : []

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return
    speakWithSettings(text, settingsRef.current, {
      onend: () => setTtsActive(false),
    })
    setTtsActive(true)
  }

  const stopSpeak = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel()
    setTtsActive(false)
  }

  const toggleTts = () => {
    if (ttsActive) {
      stopSpeak()
    } else {
      speak(lines.join(" "))
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-soft">Memuat materi…</p>
  }

  if (!material || lines.length === 0) {
    return <MaterialNotFound />
  }

  return (
    <div className="space-y-6 pb-36">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="text-sm text-ink-soft">
            {focusRuler
              ? focusRulerMode === "line"
                ? "Ketuk satu baris, atau panah atas/bawah, untuk memindah sorotan."
                : "Ketuk kalimat, atau panah atas/bawah, untuk memindah sorotan."
              : "Tampilan ramah disleksia."}
          </p>
          {focusRuler && (
            <div className="mt-3 max-w-md">
              <SegmentedControl
                fullWidth
                value={focusRulerMode}
                onChange={(mode) => {
                  setFocusRulerMode(mode)
                  persist({ focusRulerMode: mode })
                }}
                options={[
                  { value: "sentence", label: "Per kalimat" },
                  { value: "line", label: "Satu baris" },
                ]}
              />
            </div>
          )}
        </div>
        <Button onClick={() => router.push(hrefFor("simplify", material?.id))}>
          <IconSparkle width={17} height={17} /> Simplify
        </Button>
      </div>

      <div
        className="rounded-[var(--radius-card)] border border-line p-6 sm:p-10"
        style={{ backgroundColor: contrast.background, color: contrast.text }}
      >
        <div
          className="reading-area mx-auto !max-w-2xl !bg-transparent !p-0 text-left"
          style={{ color: contrast.text }}
        >
          <FocusRulerSentences
            blocks={lines}
            enabled={focusRuler}
            mode={focusRulerMode}
            layoutKey={`${size}-${spacing}-${readingFont}-${contrastId}`}
          />
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant={ttsActive ? "soft" : "outline"} onClick={toggleTts}>
            <IconSpeaker width={17} height={17} />
            {ttsActive ? "Hentikan Narasi" : "Text-to-Speech"}
          </Button>
          <span className="text-sm text-ink-mute">
            Dengarkan teks sambil kata disorot saat dibacakan.
          </span>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => router.push(hrefFor("tracking", material?.id))}
          >
            Multisensory Tracking
          </Button>
        </div>
      </Card>

      <ReadingToolbar />
    </div>
  )
}
