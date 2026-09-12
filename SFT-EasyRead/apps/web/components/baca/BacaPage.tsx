"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { hrefFor } from "@/lib/nav"
import { Card, Button, SegmentedControl, cx } from "@/components/shared/ui"
import { IconSparkle, IconSpeaker, IconTextSize, IconBook } from "@/components/shared/icons"
import { FocusRulerSentences } from "@/components/shared/FocusRulerSentences"
import { demoTitle, demoParagraphs } from "@/lib/mock"
import {
  getActiveMaterial,
  loadSettings,
  syncSettingsFromServer,
  saveSettings,
  applyFontPreferences,
  defaultSettings,
  wordSpacingFromLetter,
  getContrastOption,
  READING_CONTRAST_OPTIONS,
  SETTINGS_EVENT,
  type ActiveMaterial,
  type ReadingContrastId,
  type ReadingSettings,
  type FocusRulerMode,
} from "@/lib/session"

export default function ReadingInterface() {
  const router = useRouter()
  const settingsRef = useRef(defaultSettings)

  // Gunakan defaultSettings sebagai initial value agar SSR & client match
  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [dyslexic, setDyslexic] = useState(defaultSettings.dyslexicFont)
  const [size, setSize] = useState(defaultSettings.fontSize)
  const [spacing, setSpacing] = useState(defaultSettings.letterSpacing)
  const [contrastId, setContrastId] = useState<ReadingContrastId>(defaultSettings.contrastId)
  const [focusRuler, setFocusRuler] = useState(defaultSettings.focusRuler)
  const [focusRulerMode, setFocusRulerMode] = useState<FocusRulerMode>(defaultSettings.focusRulerMode)
  const [ttsActive, setTtsActive] = useState(false)

  // Setelah mount: baca localStorage & session (aman dari SSR)
  useEffect(() => {
    const sync = () => {
      const s = loadSettings()
      settingsRef.current = s
      setDyslexic(s.dyslexicFont)
      setSize(s.fontSize)
      setSpacing(s.letterSpacing)
      setContrastId(s.contrastId)
      setFocusRuler(s.focusRuler)
      setFocusRulerMode(s.focusRulerMode)
    }
    sync()
    setMaterial(getActiveMaterial())
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

  const contrast = getContrastOption(contrastId)

  function persist(partial: Partial<ReadingSettings>) {
    const next = { ...settingsRef.current, ...partial }
    settingsRef.current = next
    saveSettings(next)
    applyFontPreferences(next)
  }

  const title = material?.title ?? demoTitle
  const lines =
    material?.paragraphs?.length
      ? material.paragraphs
      : material?.originalText?.trim()
        ? [material.originalText]
        : demoParagraphs

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = settingsRef.current.language
    u.rate = settingsRef.current.ttsSpeed
    u.onend = () => setTtsActive(false)
    window.speechSynthesis.speak(u)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="text-sm text-ink-soft">
            {focusRuler
              ? focusRulerMode === "line"
                ? "Ketuk satu baris untuk menyorot baris itu saja."
                : "Ketuk kalimat (sampai titik) untuk menyorot."
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
        <Button onClick={() => router.push(hrefFor("simplify"))}>
          <IconSparkle width={17} height={17} /> Simplify Text
        </Button>
      </div>

      <div
        className="rounded-[var(--radius-card)] border border-line p-6 sm:p-10 transition-colors"
        style={{ backgroundColor: contrast.background, color: contrast.text }}
      >
        <div
          className={cx("mx-auto max-w-2xl text-left", dyslexic && "font-dyslexic")}
          style={
            dyslexic
              ? { color: contrast.text }
              : {
                  fontSize: size,
                  lineHeight: 1.5,
                  letterSpacing: `${spacing}em`,
                  wordSpacing: `${wordSpacingFromLetter(spacing)}em`,
                  color: contrast.text,
                }
          }
        >
          <FocusRulerSentences
            blocks={lines}
            enabled={focusRuler}
            mode={focusRulerMode}
            layoutKey={`${size}-${spacing}-${dyslexic}-${contrastId}`}
          />
        </div>
      </div>

      <Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <IconBook width={16} height={16} className="text-brand" /> Font
            </label>
            <div className="inline-flex rounded-xl border border-line bg-canvas p-1">
              <button
                onClick={() => {
                  setDyslexic(true)
                  persist({ dyslexicFont: true })
                }}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  dyslexic ? "bg-brand text-[var(--color-brand-ink)]" : "text-ink-soft",
                )}
              >
                Ramah Disleksia
              </button>
              <button
                onClick={() => {
                  setDyslexic(false)
                  persist({ dyslexicFont: false })
                }}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  !dyslexic ? "bg-brand text-[var(--color-brand-ink)]" : "text-ink-soft",
                )}
              >
                Standar
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <IconTextSize width={16} height={16} className="text-brand" /> Ukuran Teks · {size}px
            </label>
            <input
              type="range"
              min={16}
              max={30}
              value={size}
              onChange={(e) => {
                const fontSize = +e.target.value
                setSize(fontSize)
                persist({ fontSize })
              }}
              className="w-full accent-[var(--color-brand)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">
              Jarak Huruf · {spacing.toFixed(2)}em
            </label>
            <input
              type="range"
              min={0.05}
              max={0.35}
              step={0.01}
              value={spacing}
              onChange={(e) => {
                const letterSpacing = +e.target.value
                setSpacing(letterSpacing)
                persist({ letterSpacing })
              }}
              className="w-full accent-[var(--color-brand)]"
            />
            <p className="mt-1 text-xs text-ink-mute">
              Jarak kata {wordSpacingFromLetter(spacing).toFixed(2)}em (3.5×)
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Kontras warna</label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kontras teks dan latar">
              {READING_CONTRAST_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-label={option.label}
                  aria-checked={contrastId === option.id}
                  onClick={() => {
                    setContrastId(option.id)
                    persist({ contrastId: option.id })
                  }}
                  className={cx(
                    "grid h-8 w-8 place-items-center rounded-full border-2 text-[10px] font-bold transition-transform",
                    contrastId === option.id ? "scale-110 border-brand" : "border-line",
                  )}
                  style={{ backgroundColor: option.background, color: option.text }}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Button variant={ttsActive ? "soft" : "outline"} onClick={toggleTts}>
            <IconSpeaker width={17} height={17} />
            {ttsActive ? "Hentikan Narasi" : "Text-to-Speech"}
          </Button>
          <span className="text-sm text-ink-mute">
            Dengarkan teks sambil kata disorot secara real-time.
          </span>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => router.push(hrefFor("tracking"))}
          >
            Buka Multisensory Tracking
          </Button>
        </div>
      </Card>
    </div>
  )
}
