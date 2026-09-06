"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Button, cx } from "@/components/shared/ui"
import { IconPlay, IconPause, IconWave, IconSpeaker } from "@/components/shared/icons"
import { demoTitle, demoParagraphs } from "@/lib/mock"
import { getActiveMaterial, loadSettings, defaultSettings, type ActiveMaterial } from "@/lib/session"

const speeds = [
  { label: "Lambat (0.7x)", value: 1100, rate: 0.7 },
  { label: "Normal (1.0x)", value: 750,  rate: 1.0 },
  { label: "Cepat (1.3x)",  value: 520,  rate: 1.3 },
]

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export default function AudioVisualTracking() {
  const settingsRef = useRef(defaultSettings)
  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(1)
  const timer = useRef<number | null>(null)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    settingsRef.current = loadSettings()
    setMaterial(getActiveMaterial())
  }, [])

  const speed = speeds[speedIdx]!
  const title = material?.title ?? demoTitle
  const words = (
    material?.paragraphs?.length
      ? material.paragraphs
      : material?.originalText?.trim()
        ? [material.originalText]
        : demoParagraphs
  ).join(" ").split(" ").filter(Boolean)

  useEffect(() => {
    if (!playing) return
    timer.current = window.setInterval(() => {
      setActive((a) => {
        if (a >= words.length - 1) {
          setPlaying(false)
          return a
        }
        return a + 1
      })
    }, speed.value)
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [playing, speed.value, words.length])

  // Sinkronkan TTS dengan sorotan kata
  const speakToggle = () => {
    if (playing) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(words.slice(active).join(" "))
      u.lang = settingsRef.current.language
      u.rate = speed.rate
      u.onend = () => setPlaying(false)
      utterRef.current = u
      window.speechSynthesis.speak(u)
    }
    setPlaying(true)
  }

  const handleSpeedChange = (idx: number) => {
    const wasPlaying = playing
    if (wasPlaying && "speechSynthesis" in window) window.speechSynthesis.cancel()
    setSpeedIdx(idx)
    setPlaying(false)
    // restart after brief delay so useEffect picks up new speed
    if (wasPlaying) setTimeout(() => setPlaying(true), 50)
  }

  const progress = Math.round(((active + 1) / words.length) * 100)
  const totalMs = words.length * speed.value

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <IconWave className="text-brand" /> Multisensory Audio-Visual Tracking
        </h1>
        <p className="text-sm text-ink-soft">
          Dengarkan narasi dan ikuti sorotan kata secara real-time.
        </p>
      </div>

      <Card variant="reading">
        <div className="mb-3 text-sm font-semibold opacity-70">Teks Bacaan · {title}</div>
        <p className="font-dyslexic max-w-3xl">
          {words.map((w, i) => (
            <span
              key={i}
              onClick={() => setActive(i)}
              className={cx(
                "cursor-pointer rounded px-0.5 transition-colors",
                i === active && "bg-brand font-bold text-[var(--color-brand-ink)]",
                i < active && "opacity-45",
              )}
            >
              {w}{" "}
            </span>
          ))}
        </p>
      </Card>

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Button
            variant={playing ? "soft" : "primary"}
            onClick={speakToggle}
            className="w-32"
          >
            {playing
              ? <><IconPause width={16} height={16} /> Jeda</>
              : <><IconPlay width={16} height={16} /> Putar</>}
          </Button>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <IconSpeaker width={16} height={16} className="text-brand" />
            Kecepatan
            <select
              value={speedIdx}
              onChange={(e) => handleSpeedChange(+e.target.value)}
              className="rounded-lg border border-line bg-canvas px-2 py-1.5 text-sm text-ink"
            >
              {speeds.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
            </select>
          </label>

          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-ink-mute">
              <span>Progress Pembacaan</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line-soft)]">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-right text-xs tabular-nums text-ink-mute">
              {fmt((active + 1) * speed.value)} / {fmt(totalMs)}
            </div>
          </div>
        </div>
      </Card>

      <p className="text-center text-sm text-ink-mute">
        Ketuk kata mana pun untuk memulai dari sana. Fitur ini membantu menghubungkan bunyi kata dengan bentuk visualnya.
      </p>
    </div>
  )
}
