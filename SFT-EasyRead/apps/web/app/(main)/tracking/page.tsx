"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Button, cx } from "@/components/shared/ui"
import { IconPlay, IconPause, IconWave, IconSpeaker } from "@/components/shared/icons"
import { demoTitle, demoParagraphs } from "@/lib/mock"

const words = demoParagraphs.join(" ").split(" ")

const speeds = [
  { label: "Lambat (0.7x)", value: 1100 },
  { label: "Normal (1.0x)", value: 750 },
  { label: "Cepat (1.3x)", value: 520 },
]

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export default function AudioVisualTracking() {
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(0)
  const [speed, setSpeed] = useState(speeds[1]!.value)
  const timer = useRef<number | null>(null)

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
    }, speed)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [playing, speed])

  // TTS nyata jika tersedia (best-effort, tidak sinkron kata-per-kata).
  const speakToggle = () => {
    if (!playing && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(words.slice(active).join(" "))
      u.lang = "id-ID"
      u.rate = speed < 600 ? 1.3 : speed > 1000 ? 0.7 : 1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setPlaying((p) => !p)
  }

  const progress = Math.round(((active + 1) / words.length) * 100)
  const totalMs = words.length * speed

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <IconWave className="text-brand" /> Multisensory Audio-Visual Tracking
        </h1>
        <p className="text-sm text-ink-soft">Dengarkan narasi AI dan ikuti sorotan kata secara real-time.</p>
      </div>

      <Card className="bg-[var(--color-overlay-cream)]">
        <div className="mb-3 text-sm font-semibold text-ink-mute">Teks Bacaan · {demoTitle}</div>
        <p className="font-dyslexic max-w-3xl">
          {words.map((w, i) => (
            <span
              key={i}
              onClick={() => setActive(i)}
              className={cx(
                "cursor-pointer rounded px-0.5 transition-colors",
                i === active && "bg-brand text-[var(--color-brand-ink)]",
                i < active && "text-ink-mute",
              )}
            >
              {w}{" "}
            </span>
          ))}
        </p>
      </Card>

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Button variant={playing ? "soft" : "primary"} onClick={speakToggle} className="w-32">
            {playing ? <><IconPause width={16} height={16} /> Jeda</> : <><IconPlay width={16} height={16} /> Putar</>}
          </Button>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <IconSpeaker width={16} height={16} className="text-brand" />
            Kecepatan
            <select value={speed} onChange={(e) => setSpeed(+e.target.value)} className="rounded-lg border border-line bg-canvas px-2 py-1.5 text-sm text-ink">
              {speeds.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>

          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-ink-mute">
              <span>Progress Pembacaan</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line-soft)]">
              <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 text-right text-xs tabular-nums text-ink-mute">
              {fmt((active + 1) * speed)} / {fmt(totalMs)}
            </div>
          </div>
        </div>
      </Card>

      <p className="text-center text-sm text-ink-mute">Fitur ini membantu menghubungkan bunyi kata dengan bentuk visualnya.</p>
    </div>
  )
}
