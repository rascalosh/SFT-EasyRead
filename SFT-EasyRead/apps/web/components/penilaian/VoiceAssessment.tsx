"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Button, ScoreMeter } from "@/components/shared/ui"
import { IconMic, IconSpeaker, IconCheck, IconTarget, IconSparkle } from "@/components/shared/icons"
import { demoTitle, demoParagraphs, readingScores } from "@/lib/mock"
import { getActiveMaterial, loadSettings, defaultSettings, logActivity, type ActiveMaterial } from "@/lib/session"

type Phase = "idle" | "recording" | "done"

function calcScores(seconds: number) {
  const base = Math.min(seconds * 2, 60)
  return readingScores.map((s) => ({
    ...s,
    score: Math.min(100, Math.round(s.score * 0.5 + base * 0.5 + Math.random() * 5)),
  }))
}

export default function VoiceAssessment() {
  const settingsRef = useRef(defaultSettings)
  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [seconds, setSeconds] = useState(0)
  const [scores, setScores] = useState(readingScores)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    settingsRef.current = loadSettings()
    setMaterial(getActiveMaterial())
  }, [])

  useEffect(() => {
    if (phase === "recording") {
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    }
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [phase])

  const title = material?.title ?? demoTitle
  const paragraphs =
    material?.paragraphs?.length
      ? material.paragraphs
      : material?.originalText?.trim()
        ? [material.originalText]
        : demoParagraphs

  const speak = () => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(paragraphs.join(" "))
    u.lang = settingsRef.current.language
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  const start = () => { setPhase("recording"); setSeconds(0) }

  const finish = () => {
    setPhase("done")
    if ("speechSynthesis" in window) window.speechSynthesis.cancel()
    const computed = calcScores(seconds)
    setScores(computed)
    const avg = Math.round(computed.reduce((acc, s) => acc + s.score, 0) / computed.length)
    logActivity({
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      activity: "Penilaian Suara",
      materialTitle: title,
      result: `${avg}%`,
      status: avg >= 70 ? "Paham" : "Belum Paham",
    })
  }

  const reset = () => { setPhase("idle"); setSeconds(0) }

  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  const avgScore = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-2 text-sm font-semibold text-ink-mute">Teks Bacaan · {title}</div>
          <p className="font-dyslexic leading-relaxed">{paragraphs.join(" ")}</p>
          <Button variant="soft" size="sm" className="mt-4" onClick={speak}>
            <IconSpeaker width={15} height={15} /> Dengarkan Contoh
          </Button>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <div className="text-sm font-semibold text-ink-mute">Rekam Suara</div>
          <button
            onClick={phase === "recording" ? finish : start}
            disabled={phase === "done"}
            className={[
              "relative mt-5 grid h-28 w-28 place-items-center rounded-full text-white transition-all",
              phase === "recording"
                ? "bg-[var(--color-warn)]"
                : phase === "done"
                ? "bg-[var(--color-good)]"
                : "bg-brand hover:bg-brand-strong",
            ].join(" ")}
          >
            {phase === "recording" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-warn)] opacity-40" />
            )}
            {phase === "done" ? <IconCheck width={34} height={34} /> : <IconMic width={34} height={34} />}
          </button>

          {phase === "recording" && (
            <div className="mt-5 flex h-8 items-end gap-1">
              {Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-brand"
                  style={{
                    height: `${20 + Math.abs(Math.sin(i + seconds)) * 22}px`,
                    animation: "pulse 1s ease-in-out infinite",
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-4 tabular-nums text-lg font-semibold text-ink">{fmt}</div>
          <div className="mt-4 flex gap-2">
            {phase === "idle" && (
              <Button onClick={start}><IconMic width={15} height={15} /> Mulai Membaca</Button>
            )}
            {phase === "recording" && (
              <Button variant="soft" onClick={finish}><IconCheck width={15} height={15} /> Selesai</Button>
            )}
            {phase === "done" && (
              <Button variant="outline" onClick={reset}>Rekam Ulang</Button>
            )}
          </div>
        </Card>

        <Card className={phase === "done" ? "border-brand" : ""}>
          <div className="flex items-center gap-2 font-semibold text-ink">
            <IconSparkle width={17} height={17} className="text-brand" /> Analisis Membaca
          </div>
          {phase === "done" ? (
            <div className="mt-4 space-y-4">
              <div className="text-center rounded-xl bg-canvas p-3 mb-2">
                <div className="text-2xl font-bold text-ink">{avgScore}%</div>
                <div className="text-xs text-ink-mute mt-0.5">Skor Rata-rata</div>
              </div>
              {scores.map((s) => (
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
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-brand-strong">
              <IconSparkle width={16} height={16} /> Feedback Personal
            </div>
            <p className="text-sm text-ink-soft">
              {avgScore >= 80
                ? "Bagus! Kamu membaca dengan lancar dan akurat. Pertahankan ritme membacamu."
                : avgScore >= 60
                ? "Cukup baik! Perhatikan jeda pada tanda baca agar lebih jelas dan tidak terburu-buru."
                : "Terus berlatih! Coba baca lebih perlahan dan ucapkan setiap suku kata dengan jelas."}
            </p>
          </Card>
          <Card className="bg-[var(--color-good-soft)]">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--color-good)]">
              <IconTarget width={16} height={16} /> Fokus Latihan Disarankan
            </div>
            <p className="text-sm text-ink-soft">
              {avgScore >= 80
                ? "Latih kecepatan membaca dengan teks yang lebih panjang dan kompleks."
                : "Latih pengendalian jeda dengan mengambil napas pada tanda titik dan koma."}
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
