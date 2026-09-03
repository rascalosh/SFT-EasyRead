"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Button, ScoreMeter, cx } from "@/components/shared/ui"
import { IconMic, IconSpeaker, IconCheck, IconTarget, IconSparkle } from "@/components/shared/icons"
import { demoTitle, demoParagraphs, readingScores } from "@/lib/mock"

type Phase = "idle" | "recording" | "done"

export default function VoiceAssessment() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [seconds, setSeconds] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (phase === "recording") {
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    }
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [phase])

  const start = () => { setPhase("recording"); setSeconds(0) }
  const finish = () => setPhase("done")
  const reset = () => { setPhase("idle"); setSeconds(0) }

  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-2 text-sm font-semibold text-ink-mute">Teks Bacaan · {demoTitle}</div>
          <p className="font-dyslexic">{demoParagraphs.join(" ")}</p>
          <Button variant="soft" size="sm" className="mt-4">
            <IconSpeaker width={15} height={15} /> Dengarkan Contoh
          </Button>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <div className="text-sm font-semibold text-ink-mute">Rekam Suara</div>
          <button
            onClick={phase === "recording" ? finish : start}
            disabled={phase === "done"}
            className={cx(
              "relative mt-5 grid h-28 w-28 place-items-center rounded-full text-white transition-all",
              phase === "recording" ? "bg-[var(--color-warn)]" : phase === "done" ? "bg-[var(--color-good)]" : "bg-brand hover:bg-brand-strong",
            )}
          >
            {phase === "recording" && <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-warn)] opacity-40" />}
            {phase === "done" ? <IconCheck width={34} height={34} /> : <IconMic width={34} height={34} />}
          </button>

          {phase === "recording" && (
            <div className="mt-5 flex h-8 items-end gap-1">
              {Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-brand"
                  style={{ height: `${20 + Math.abs(Math.sin(i + seconds)) * 22}px`, animation: "pulse 1s ease-in-out infinite", animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          )}

          <div className="mt-4 tabular-nums text-lg font-semibold text-ink">{fmt}</div>
          <div className="mt-4 flex gap-2">
            {phase === "idle" && <Button onClick={start}><IconMic width={15} height={15} /> Mulai Membaca</Button>}
            {phase === "recording" && <Button variant="soft" onClick={finish}><IconCheck width={15} height={15} /> Selesai</Button>}
            {phase === "done" && <Button variant="outline" onClick={reset}>Rekam Ulang</Button>}
          </div>
        </Card>

        <Card className={phase === "done" ? "border-brand" : ""}>
          <div className="flex items-center gap-2 font-semibold text-ink">
            <IconSparkle width={17} height={17} className="text-brand" /> Analisis Membaca
          </div>
          {phase === "done" ? (
            <div className="mt-4 space-y-4">
              {readingScores.map((s) => (
                <ScoreMeter key={s.label} label={s.label} score={s.score} note={s.note} />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid min-h-52 place-items-center text-center text-sm text-ink-mute">
              Hasil analisis suara akan muncul di sini setelah kamu selesai membaca.
            </div>
          )}
        </Card>
      </div>

      {phase === "done" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-brand-soft">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-brand-strong"><IconSparkle width={16} height={16} /> Feedback Personal</div>
            <p className="text-sm text-ink-soft">Bagus! Kamu membaca dengan lancar dan akurat. Perhatikan kecepatanmu — coba beri jeda pada tanda koma agar lebih jelas dan tidak terburu-buru.</p>
          </Card>
          <Card className="bg-[var(--color-good-soft)]">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--color-good)]"><IconTarget width={16} height={16} /> Fokus Latihan Disarankan</div>
            <p className="text-sm text-ink-soft">Latih pengendalian jeda dengan mengambil napas pada tanda baca titik dan koma. Baca kalimat panjang dengan ritme yang tenang.</p>
          </Card>
        </div>
      )}
    </div>
  )
}
