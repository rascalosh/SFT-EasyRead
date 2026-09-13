"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Button, ScoreMeter } from "@/components/shared/ui"
import { IconMic, IconSpeaker, IconCheck, IconTarget, IconSparkle } from "@/components/shared/icons"
import { loadSettings, defaultSettings, logActivity, type ActiveMaterial } from "@/lib/session"
import { assessSpeech, isOk, type ApiScore } from "@/lib/api"

type Phase = "idle" | "recording" | "analyzing" | "done"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Jeda antar ucapan yang dianggap "jeda panjang". */
const LONG_PAUSE_MS = 1500

const BAR_COUNT = 22

// Web Speech API belum ada di lib.dom bawaan TypeScript.
type SpeechRecognitionAlternativeLike = { transcript: string }
type SpeechRecognitionResultLike = {
    isFinal: boolean
    0: SpeechRecognitionAlternativeLike
}
type SpeechRecognitionEventLike = {
    resultIndex: number
    results: { length: number; [index: number]: SpeechRecognitionResultLike }
}
type SpeechRecognitionLike = {
    lang: string
    continuous: boolean
    interimResults: boolean
    start: () => void
    stop: () => void
    onresult: ((event: SpeechRecognitionEventLike) => void) | null
    onerror: ((event: { error?: string }) => void) | null
    onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
    if (typeof window === "undefined") return null

    const scope = window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor
        webkitSpeechRecognition?: SpeechRecognitionCtor
    }

    return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export default function VoiceAssessment({ material }: { material: ActiveMaterial }) {
    const settingsRef = useRef(defaultSettings)
    const [phase, setPhase] = useState<Phase>("idle")
    const [seconds, setSeconds] = useState(0)
    const [scores, setScores] = useState<ApiScore[]>([])
    const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(6))
    const [micError, setMicError] = useState<string | null>(null)

    const timer = useRef<number | null>(null)
    const recognition = useRef<SpeechRecognitionLike | null>(null)
    const stream = useRef<MediaStream | null>(null)
    const audioContext = useRef<AudioContext | null>(null)
    const frame = useRef<number | null>(null)
    const transcript = useRef("")
    const longPauses = useRef(0)
    const lastResultAt = useRef(0)

    useEffect(() => {
        settingsRef.current = loadSettings()
    }, [])

    useEffect(() => {
        if (phase === "recording") {
            timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
        }
        return () => { if (timer.current) window.clearInterval(timer.current) }
    }, [phase])

    /** Lepaskan mikrofon, pengenal suara, dan audio graph. */
    const teardown = () => {
        if (frame.current) {
            cancelAnimationFrame(frame.current)
            frame.current = null
        }

        try {
            recognition.current?.stop()
        } catch {
            // sudah berhenti
        }
        recognition.current = null

        stream.current?.getTracks().forEach((track) => track.stop())
        stream.current = null

        void audioContext.current?.close().catch(() => {})
        audioContext.current = null
    }

    // Pastikan mikrofon dilepas kalau pengguna berpindah halaman saat merekam.
    useEffect(() => teardown, [])

    const title = material.title
    const paragraphs =
        material.paragraphs?.length
            ? material.paragraphs
            : material.originalText?.trim()
                ? [material.originalText]
                : []

    const referenceText = paragraphs.join(" ").trim()
    const documentId = material?.id && UUID.test(material.id) ? material.id : null

    const speak = () => {
        if (!("speechSynthesis" in window)) return
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(referenceText)
        u.lang = settingsRef.current.language
        u.rate = 0.85
        window.speechSynthesis.speak(u)
    }

    /** Gambar batang dari amplitudo nyata, bukan gelombang sinus hiasan. */
    const startMeter = (source: MediaStream) => {
        const context = new AudioContext()
        audioContext.current = context

        const analyser = context.createAnalyser()
        analyser.fftSize = 256

        context.createMediaStreamSource(source).connect(analyser)

        const buffer = new Uint8Array(analyser.frequencyBinCount)
        const step = Math.floor(buffer.length / BAR_COUNT) || 1
        let lastPaint = 0

        const tick = (now: number) => {
            frame.current = requestAnimationFrame(tick)

            // ~15 fps sudah cukup; lebih dari itu hanya membebani render.
            if (now - lastPaint < 66) return
            lastPaint = now

            analyser.getByteFrequencyData(buffer)

            setLevels(
                Array.from({ length: BAR_COUNT }, (_, i) => {
                    const value = buffer[i * step] ?? 0
                    return 6 + (value / 255) * 34
                }),
            )
        }

        frame.current = requestAnimationFrame(tick)
    }

    const start = async () => {
        setMicError(null)

        if (!referenceText) {
            setMicError("Materi ini belum punya teks bacaan. Pilih materi lain.")
            return
        }

        if (!documentId) {
            setMicError("Materi ini belum tersimpan di akun, jadi hasil tidak bisa dinilai.")
            return
        }

        const Recognition = getRecognitionCtor()

        if (!Recognition) {
            setMicError(
                "Browser ini belum mendukung pengenalan suara. Coba buka lewat Google Chrome atau Microsoft Edge.",
            )
            return
        }

        let media: MediaStream

        try {
            media = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch {
            setMicError(
                "Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser, lalu coba lagi.",
            )
            return
        }

        stream.current = media
        transcript.current = ""
        longPauses.current = 0
        lastResultAt.current = Date.now()

        try {
            startMeter(media)
        } catch {
            // Visualisasi gagal bukan alasan membatalkan perekaman.
        }

        const engine = new Recognition()
        engine.lang = settingsRef.current.language || "id-ID"
        engine.continuous = true
        engine.interimResults = true

        engine.onresult = (event) => {
            const now = Date.now()
            if (now - lastResultAt.current > LONG_PAUSE_MS) longPauses.current += 1
            lastResultAt.current = now

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result?.isFinal) transcript.current += `${result[0].transcript} `
            }
        }

        engine.onerror = (event) => {
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                setMicError("Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser.")
                teardown()
                setPhase("idle")
            }
        }

        recognition.current = engine

        try {
            engine.start()
        } catch {
            setMicError("Pengenalan suara gagal dimulai. Coba muat ulang halaman.")
            teardown()
            return
        }

        setSeconds(0)
        setPhase("recording")
    }

    const finish = async () => {
        const elapsed = seconds

        if ("speechSynthesis" in window) window.speechSynthesis.cancel()

        teardown()
        setLevels(new Array(BAR_COUNT).fill(6))
        setPhase("analyzing")

        // Beri jeda singkat agar hasil final terakhir sempat masuk.
        await new Promise((resolve) => setTimeout(resolve, 350))

        const response = await assessSpeech({
            documentId,
            referenceText,
            transcript: transcript.current.trim(),
            // Tabel membatasi durasi maksimal 2 menit.
            durationSeconds: Math.min(120, elapsed),
            longPauses: longPauses.current,
        })

        if (!isOk(response)) {
            setMicError("Gagal menganalisis bacaan. Periksa koneksi lalu coba rekam ulang.")
            setPhase("idle")
            return
        }

        setScores(response.data.scores)
        setPhase("done")

        logActivity({
            date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
            activity: "Penilaian Suara",
            materialTitle: title,
            result: `${response.data.averageScore}%`,
            status: response.data.averageScore >= 70 ? "Paham" : "Belum Paham",
        })
    }

    const reset = () => {
        teardown()
        setPhase("idle")
        setSeconds(0)
        setMicError(null)
        setLevels(new Array(BAR_COUNT).fill(6))
    }

    const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
    const avgScore = scores.length
        ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)
        : 0

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <div className="mb-2 text-sm font-semibold text-ink-mute">Teks Bacaan · {title}</div>
                    <p className="font-dyslexic leading-relaxed">
                        {referenceText || "Teks bacaan belum tersedia untuk materi ini."}
                    </p>
                    <Button variant="soft" size="sm" className="mt-4" onClick={speak} disabled={!referenceText}>
                        <IconSpeaker width={15} height={15} /> Dengarkan Contoh
                    </Button>
                </Card>

                <Card className="flex flex-col items-center justify-center text-center">
                    <div className="text-sm font-semibold text-ink-mute">Rekam Suara</div>
                    <button
                        onClick={phase === "recording" ? () => void finish() : () => void start()}
                        disabled={phase === "done" || phase === "analyzing" || !referenceText}
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
                            {levels.map((height, i) => (
                                <span
                                    key={i}
                                    className="w-1 rounded-full bg-brand transition-[height] duration-75"
                                    style={{ height: `${height}px` }}
                                />
                            ))}
                        </div>
                    )}

                    <div className="mt-4 tabular-nums text-lg font-semibold text-ink">{fmt}</div>

                    {micError && (
                        <p className="mt-3 rounded-xl border border-[var(--color-warn)] bg-[var(--color-warn-soft)] px-3 py-2 text-xs text-ink-soft">
                            {micError}
                        </p>
                    )}

                    <div className="mt-4 flex gap-2">
                        {phase === "idle" && (
                            <Button onClick={() => void start()} disabled={!referenceText}><IconMic width={15} height={15} /> Mulai Membaca</Button>
                        )}
                        {phase === "recording" && (
                            <Button variant="soft" onClick={() => void finish()}><IconCheck width={15} height={15} /> Selesai</Button>
                        )}
                        {phase === "analyzing" && (
                            <Button variant="soft" disabled>Menganalisis…</Button>
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
                            {phase === "analyzing"
                                ? "Menganalisis bacaanmu…"
                                : "Hasil analisis suara akan muncul di sini setelah kamu selesai membaca."}
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
