"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { hrefFor } from "@/lib/nav"
import { Card, Button, cx } from "@/components/shared/ui"
import { IconSparkle, IconSpeaker, IconTextSize, IconBook } from "@/components/shared/icons"
import { demoTitle, demoParagraphs } from "@/lib/mock"
import { getActiveMaterial, loadSettings, defaultSettings, type ActiveMaterial } from "@/lib/session"

const overlays = [
  { id: "cream",  label: "Krem",   value: "var(--color-overlay-cream)" },
  { id: "peach",  label: "Persik", value: "var(--color-overlay-peach)" },
  { id: "mint",   label: "Mint",   value: "var(--color-overlay-mint)" },
  { id: "blue",   label: "Biru",   value: "var(--color-overlay-blue)" },
  { id: "lilac",  label: "Lila",   value: "var(--color-overlay-lilac)" },
]

export default function ReadingInterface() {
  const router = useRouter()
  const settingsRef = useRef(defaultSettings)

  // Gunakan defaultSettings sebagai initial value agar SSR & client match
  const [material,  setMaterial]  = useState<ActiveMaterial | null>(null)
  const [dyslexic,  setDyslexic]  = useState(defaultSettings.dyslexicFont)
  const [size,      setSize]      = useState(defaultSettings.fontSize)
  const [spacing,   setSpacing]   = useState(defaultSettings.letterSpacing)
  const [overlay,   setOverlay]   = useState(defaultSettings.overlay)
  const [ruler,     setRuler]     = useState<number | null>(null)
  const [ttsActive, setTtsActive] = useState(false)

  // Setelah mount: baca localStorage & session (aman dari SSR)
  useEffect(() => {
    const s = loadSettings()
    settingsRef.current = s
    setDyslexic(s.dyslexicFont)
    setSize(s.fontSize)
    setSpacing(s.letterSpacing)
    setOverlay(s.overlay)
    setMaterial(getActiveMaterial())
  }, [])

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
    if (ttsActive) { stopSpeak() } else { speak(lines.join(" ")) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="text-sm text-ink-soft">
            Tampilan ramah disleksia · ketuk baris untuk mengaktifkan penggaris fokus.
          </p>
        </div>
        <Button onClick={() => router.push(hrefFor("simplify"))}>
          <IconSparkle width={17} height={17} /> Simplify Text
        </Button>
      </div>

      <div
        className="rounded-[var(--radius-card)] border border-line p-6 sm:p-10 transition-colors"
        style={{ backgroundColor: overlay }}
      >
        <div
          className={cx("mx-auto max-w-2xl text-left", dyslexic && "font-dyslexic")}
          style={{ fontSize: size, lineHeight: 1.9, letterSpacing: `${spacing}em` }}
        >
          {lines.map((line, i) => (
            <p
              key={i}
              onClick={() => setRuler(ruler === i ? null : i)}
              className={cx(
                "-mx-3 cursor-pointer rounded-lg px-3 py-1.5 transition-colors",
                ruler === i
                  ? "bg-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] shadow-[inset_0_-2px_0_var(--color-brand)]"
                  : "hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]",
              )}
            >
              {line}
            </p>
          ))}
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
                onClick={() => setDyslexic(true)}
                className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", dyslexic ? "bg-brand text-[var(--color-brand-ink)]" : "text-ink-soft")}
              >Ramah Disleksia</button>
              <button
                onClick={() => setDyslexic(false)}
                className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", !dyslexic ? "bg-brand text-[var(--color-brand-ink)]" : "text-ink-soft")}
              >Standar</button>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <IconTextSize width={16} height={16} className="text-brand" /> Ukuran Teks · {size}px
            </label>
            <input
              type="range" min={16} max={30} value={size}
              onChange={(e) => setSize(+e.target.value)}
              className="w-full accent-[var(--color-brand)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Jarak Huruf</label>
            <input
              type="range" min={0} max={0.16} step={0.01} value={spacing}
              onChange={(e) => setSpacing(+e.target.value)}
              className="w-full accent-[var(--color-brand)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Overlay Warna</label>
            <div className="flex flex-wrap gap-2">
              {overlays.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOverlay(o.value)}
                  aria-label={o.label}
                  aria-pressed={overlay === o.value}
                  className={cx("h-8 w-8 rounded-full border-2 transition-transform", overlay === o.value ? "scale-110 border-brand" : "border-line")}
                  style={{ backgroundColor: o.value }}
                />
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
