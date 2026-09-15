"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, Button, ScoreMeter, ProgressBar, ProgressRing, StepIndicator, Alert, cx, type Tone } from "@/components/shared/ui"
import {
    IconMic,
    IconSpeaker,
    IconSpeakerOff,
    IconCheck,
    IconTarget,
    IconSparkle,
    IconClipboard,
    IconRefresh,
    IconLetters,
    IconClose,
    IconInfo,
} from "@/components/shared/icons"
import { logActivity, type ActiveMaterial } from "@/lib/session"
import { useReadingSettings } from "@/lib/use-reading-settings"
import { useSpeaker } from "@/lib/use-speaker"
import { getRecognitionCtor, type SpeechRecognitionLike } from "@/lib/speech-recognition"
import { assessSpeech, fetchCachedSummary, isOk, type ApiSpeechResult } from "@/lib/api"
import { hrefFor } from "@/lib/nav"
import { parseSummaryPayload } from "@/lib/ai-result"
import { blocksFromSummary, selectReadingExcerpt, type ReadingExcerpt } from "@/lib/reading-excerpt"
import { ReadingPassage } from "./ReadingPassage"

type Phase = "idle" | "recording" | "analyzing" | "done"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Jeda antar ucapan yang dianggap "jeda panjang". */
const LONG_PAUSE_MS = 1500

/** Tabel speech_assessments membatasi durasi 0–120 detik. */
const MAX_SECONDS = 120

const BAR_COUNT = 22

const STEPS = ["Siap-siap", "Baca Nyaring", "Hasil"]

function formatClock(totalSeconds: number) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
    const s = String(totalSeconds % 60).padStart(2, "0")
    return `${m}:${s}`
}

/** Bahasa sederhana untuk skor keseluruhan — tanpa istilah teknis. */
function describeScore(score: number): { label: string; tone: Tone; message: string; practice: string } {
    if (score >= 85) {
        return {
            label: "Sangat lancar",
            tone: "good",
            message: "Kamu membaca dengan lancar dan jelas. Pertahankan ritme seperti ini.",
            practice: "Coba teks yang lebih panjang, atau baca sedikit lebih cepat sambil tetap jelas.",
        }
    }
    if (score >= 70) {
        return {
            label: "Lancar",
            tone: "good",
            message: "Bacaanmu sudah baik. Beberapa bagian bisa dibuat lebih rapi lagi.",
            practice: "Ambil napas di tanda titik dan koma supaya jeda terasa alami.",
        }
    }
    if (score >= 55) {
        return {
            label: "Cukup lancar",
            tone: "brand",
            message: "Kamu sudah berusaha dengan baik. Pelan-pelan saja, tidak perlu terburu-buru.",
            practice: "Latih kata yang panjang di Latihan Kata, lalu baca ulang teks ini.",
        }
    }
    return {
        label: "Terus berlatih",
        tone: "warn",
        message: "Tidak apa-apa, setiap latihan membuatmu lebih baik. Coba lagi dengan tenang.",
        practice: "Dengarkan contoh dulu, lalu baca satu kalimat demi satu kalimat.",
    }
}

/** Nama sumbu dari server diterjemahkan ke kalimat pendek yang mudah dipahami. */
const METRIC_HELP: Record<string, string> = {
    "Kelancaran Membaca": "Seberapa mengalir bacaanmu tanpa tersendat.",
    "Kecepatan Membaca": "Kecepatan yang nyaman: tidak terlalu cepat, tidak terlalu lambat.",
    "Jeda": "Berhenti di tempat yang pas, misalnya di tanda titik.",
    "Pengulangan Kata": "Semakin sedikit kata yang diulang, semakin baik.",
    "Akurasi Pengucapan": "Berapa banyak kata yang terucap sama dengan teks.",
}

export default function VoiceAssessment({
    material,
    onBusyChange,
    onContinueToQuiz,
}: {
    material: ActiveMaterial
    /** Dipanggil saat rekaman berjalan/diproses agar induk mengunci navigasi. */
    onBusyChange?: (busy: boolean) => void
    onContinueToQuiz?: () => void
}) {
    const router = useRouter()
    const { settingsRef } = useReadingSettings()
    const speaker = useSpeaker(settingsRef)

    const [phase, setPhase] = useState<Phase>("idle")
    const [seconds, setSeconds] = useState(0)
    const [result, setResult] = useState<ApiSpeechResult | null>(null)
    const [micError, setMicError] = useState<string | null>(null)
    const [heardSomething, setHeardSomething] = useState(false)
    const [durationUsed, setDurationUsed] = useState(0)

    const timer = useRef<number | null>(null)
    const recognition = useRef<SpeechRecognitionLike | null>(null)
    const stream = useRef<MediaStream | null>(null)
    const audioContext = useRef<AudioContext | null>(null)
    const frame = useRef<number | null>(null)
    const meterRef = useRef<HTMLDivElement>(null)
    const transcript = useRef("")
    const longPauses = useRef(0)
    const lastResultAt = useRef(0)
    const secondsRef = useRef(0)
    const finishRef = useRef<(auto?: boolean) => Promise<void>>(async () => {})

    const title = material.title
    const originalExcerpt = useMemo(() => {
        const blocks =
            material.paragraphs?.length
                ? material.paragraphs
                : material.originalText?.trim()
                    ? [material.originalText]
                    : []
        return selectReadingExcerpt(blocks)
    }, [material.paragraphs, material.originalText])
    const documentId = material?.id && UUID.test(material.id) ? material.id : null
    const [summaryExcerpt, setSummaryExcerpt] = useState<ReadingExcerpt | null>(null)
    const [passageReady, setPassageReady] = useState(!documentId)

    useEffect(() => {
        if (!documentId) {
            setSummaryExcerpt(null)
            setPassageReady(true)
            return
        }

        let alive = true
        setPassageReady(false)
        setSummaryExcerpt(null)

        void fetchCachedSummary(documentId).then((cached) => {
            if (!alive) return

            if (isOk(cached)) {
                const view = parseSummaryPayload(cached.data)
                const blocks = blocksFromSummary(view.summary, view.points)
                if (blocks.length) {
                    setSummaryExcerpt(selectReadingExcerpt(blocks))
                    setPassageReady(true)
                    return
                }
            }

            setSummaryExcerpt(null)
            setPassageReady(true)
        })

        return () => {
            alive = false
        }
    }, [documentId])

    const excerpt = summaryExcerpt ?? originalExcerpt
    const fromSummary = summaryExcerpt !== null
    const paragraphs = excerpt.paragraphs
    const referenceText = paragraphs.join(" ").trim()
    const wordCount = excerpt.words

    const busy = phase === "recording" || phase === "analyzing"

    useEffect(() => {
        onBusyChange?.(busy)
        return () => onBusyChange?.(false)
    }, [busy, onBusyChange])

    useEffect(() => {
        if (phase === "recording") {
            timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
        }
        return () => {
            if (timer.current) window.clearInterval(timer.current)
        }
    }, [phase])

    useEffect(() => {
        secondsRef.current = seconds
    }, [seconds])

    // Berhenti otomatis di batas 2 menit; server memang tidak menerima lebih.
    useEffect(() => {
        if (phase !== "recording" || seconds < MAX_SECONDS) return
        void finishRef.current(true)
    }, [phase, seconds])

    /** Lepaskan mikrofon, pengenal suara, dan audio graph. */
    const teardown = useCallback(() => {
        if (frame.current) {
            cancelAnimationFrame(frame.current)
            frame.current = null
        }

        const engine = recognition.current
        recognition.current = null
        if (engine) {
            engine.onresult = null
            engine.onerror = null
            engine.onend = null
            try {
                engine.stop()
            } catch {
                // sudah berhenti
            }
        }

        stream.current?.getTracks().forEach((track) => track.stop())
        stream.current = null

        void audioContext.current?.close().catch(() => {})
        audioContext.current = null
    }, [])

    // Pastikan mikrofon dilepas kalau pengguna berpindah halaman saat merekam.
    useEffect(() => teardown, [teardown])

    /**
     * Meter suara dilukis ke DOM, bukan lewat React state, supaya kartu
     * rekaman dan teks bacaan tidak ikut re-render (dan melonjak) tiap frame.
     */
    useEffect(() => {
        if (phase !== "recording") return

        const media = stream.current
        const meter = meterRef.current
        if (!media || !meter) return

        const context = audioContext.current ?? new AudioContext()
        audioContext.current = context
        void context.resume()

        const analyser = context.createAnalyser()
        analyser.fftSize = 256
        const source = context.createMediaStreamSource(media)
        source.connect(analyser)

        const buffer = new Uint8Array(analyser.frequencyBinCount)
        const step = Math.floor(buffer.length / BAR_COUNT) || 1
        const smoothed = new Array<number>(BAR_COUNT).fill(8)
        const bars = meter.querySelectorAll<HTMLElement>("[data-meter-bar]")
        const maxH = 40
        const minH = 8

        const tick = () => {
            frame.current = requestAnimationFrame(tick)
            analyser.getByteFrequencyData(buffer)

            for (let i = 0; i < BAR_COUNT; i++) {
                const value = buffer[i * step] ?? 0
                const target = minH + (value / 255) * (maxH - minH)
                smoothed[i] += (target - smoothed[i]) * 0.28
                const bar = bars[i]
                if (bar) bar.style.height = `${smoothed[i].toFixed(1)}px`
            }
        }

        frame.current = requestAnimationFrame(tick)

        return () => {
            if (frame.current) {
                cancelAnimationFrame(frame.current)
                frame.current = null
            }
            try {
                source.disconnect()
                analyser.disconnect()
            } catch {
                // graph sudah ditutup di teardown
            }
        }
    }, [phase])

    const start = async () => {
        setMicError(null)
        speaker.stop()

        if (!referenceText) {
            setMicError("Materi ini belum punya teks bacaan. Pilih materi lain.")
            return
        }

        if (!passageReady) {
            setMicError("Teks bacaan masih disiapkan. Tunggu sebentar, lalu coba lagi.")
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
            setMicError("Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser, lalu coba lagi.")
            return
        }

        stream.current = media
        transcript.current = ""
        longPauses.current = 0
        lastResultAt.current = Date.now()
        setHeardSomething(false)

        try {
            audioContext.current = new AudioContext()
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
            setHeardSomething(true)

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const item = event.results[i]
                if (item?.isFinal) transcript.current += `${item[0].transcript} `
            }
        }

        engine.onerror = (event) => {
            const fatal: Record<string, string> = {
                "not-allowed": "Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser.",
                "service-not-allowed": "Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser.",
                "audio-capture": "Mikrofon tidak ditemukan. Pasang atau pilih mikrofon, lalu coba lagi.",
                network: "Pengenalan suara butuh koneksi internet. Periksa jaringan, lalu coba lagi.",
            }
            const message = event.error ? fatal[event.error] : undefined
            if (!message) return
            setMicError(message)
            teardown()
            setPhase("idle")
            setSeconds(0)
        }

        // Chrome menghentikan pengenalan setelah hening lama; nyalakan lagi
        // selama pengguna masih merekam supaya kata berikutnya tetap tertangkap.
        engine.onend = () => {
            if (recognition.current !== engine) return
            try {
                engine.start()
            } catch {
                // dibiarkan; tombol Selesai tetap berfungsi
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

    const finish = async (auto = false) => {
        const elapsed = Math.min(MAX_SECONDS, secondsRef.current)

        speaker.stop()
        teardown()
        setPhase("analyzing")

        // Beri jeda singkat agar hasil final terakhir sempat masuk.
        await new Promise((resolve) => setTimeout(resolve, 350))

        const spoken = transcript.current.trim()

        // Tanpa suara yang tertangkap, skor 0 hanya akan membuat kecil hati —
        // padahal penyebabnya biasanya mikrofon. Beri tahu dan biarkan coba lagi.
        if (!spoken) {
            setMicError(
                "Kami belum mendengar suaramu. Dekatkan mikrofon, pastikan tidak dibisukan, lalu coba rekam lagi.",
            )
            setPhase("idle")
            setSeconds(0)
            return
        }

        const response = await assessSpeech({
            documentId,
            referenceText,
            transcript: spoken,
            durationSeconds: elapsed,
            longPauses: longPauses.current,
        })

        if (!isOk(response)) {
            setMicError("Gagal menghitung hasil. Periksa koneksi internet, lalu coba rekam ulang.")
            setPhase("idle")
            return
        }

        setResult(response.data)
        setDurationUsed(elapsed)
        setPhase("done")
        if (auto) setMicError(null)

        logActivity({
            date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
            activity: "Penilaian Suara",
            materialTitle: title,
            result: `${response.data.averageScore}%`,
            status: response.data.averageScore >= 70 ? "Paham" : "Belum Paham",
        })
    }

    useEffect(() => {
        finishRef.current = finish
    })

    const cancelRecording = () => {
        teardown()
        setPhase("idle")
        setSeconds(0)
    }

    const reset = () => {
        teardown()
        speaker.stop()
        setPhase("idle")
        setSeconds(0)
        setMicError(null)
        setResult(null)
    }

    const stepIndex = phase === "idle" ? 0 : phase === "done" ? 2 : 1
    const summary = result ? describeScore(result.averageScore) : null
    const feedbackText = summary
        ? `Skor kamu ${result?.averageScore} dari 100. ${summary.label}. ${summary.message} Saran latihan: ${summary.practice}`
        : ""

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <StepIndicator steps={STEPS} current={stepIndex} />
                {phase === "idle" && (
                    <span className="text-xs text-ink-mute">
                        Suaramu diproses di perangkatmu sendiri, tidak diunggah.
                    </span>
                )}
            </div>

            {micError && (
                <Alert tone="warn" title="Belum bisa mulai" onClose={() => setMicError(null)}>
                    {micError}
                </Alert>
            )}

            {/* ── Langkah 1: siap-siap ─────────────────────────────────────── */}
            {phase === "idle" && (
                <>
                    <Card className="animate-fade-in">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <h2 className="text-heading-3 text-ink">Baca teks di bawah dengan suara nyaring</h2>
                                <ol className="mt-3 space-y-2 text-sm text-ink-soft">
                                    <li className="flex items-start gap-2.5">
                                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">1</span>
                                        <span>Kalau mau, tekan <strong>Dengarkan contoh</strong> untuk tahu cara membacanya.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">2</span>
                                        <span>Tekan <strong>Mulai Membaca</strong>, lalu baca pelan dan jelas. Tidak perlu terburu-buru.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">3</span>
                                        <span>Selesai membaca? Tekan <strong>Selesai</strong>. Hasilnya langsung muncul.</span>
                                    </li>
                                </ol>
                            </div>
                            <div className="flex shrink-0 flex-col items-stretch gap-2 md:w-60">
                                <Button
                                    size="lg"
                                    onClick={() => void start()}
                                    disabled={!referenceText || !passageReady}
                                    className="w-full"
                                >
                                    <IconMic width={18} height={18} /> Mulai Membaca
                                </Button>
                                <p className="text-center text-xs text-ink-mute">
                                    {passageReady
                                        ? `${wordCount} kata · maksimal ${MAX_SECONDS / 60} menit`
                                        : "Menyiapkan teks bacaan…"}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {passageReady ? (
                    <ReadingPassage
                        title={title}
                        paragraphs={paragraphs}
                        label={fromSummary ? "Ringkasan yang dibaca" : excerpt.truncated ? "Bagian yang dibaca" : "Teks Bacaan"}
                        note={
                            fromSummary
                                ? "Ini ringkasan materi. Kalimatnya lebih pendek supaya lebih mudah dibaca nyaring."
                                : excerpt.truncated
                                    ? "Cukup baca bagian ini saja. Teks dipendekkan supaya selesai dalam 2 menit."
                                    : undefined
                        }
                        speaking={speaker.speaking && speaker.speakingKey === "passage"}
                        onToggleListen={speaker.supported ? () => speaker.toggle(referenceText, "passage") : undefined}
                    />
                    ) : (
                    <Card>
                        <p className="py-6 text-center text-sm text-ink-mute">Menyiapkan teks bacaan…</p>
                    </Card>
                    )}
                </>
            )}

            {/* ── Langkah 2: merekam ───────────────────────────────────────── */}
            {phase === "recording" && (
                <>
                    <Card className="sticky top-16 z-[var(--z-raised)] overflow-hidden border-brand/40 shadow-[var(--shadow-md)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-error)] text-[var(--color-error-ink)]">
                                    <span className="absolute inset-0 animate-pulse rounded-full bg-[var(--color-error)] opacity-40" aria-hidden />
                                    <IconMic width={22} height={22} className="relative" />
                                </span>
                                <div className="min-w-0">
                                    <p className="font-semibold text-ink">Sedang merekam</p>
                                    <p className="h-4 truncate text-xs text-ink-mute" role="status">
                                        {heardSomething ? "Suaramu terdengar. Lanjutkan membaca." : "Mulailah membaca kalimat pertama."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:px-2">
                                <div
                                    ref={meterRef}
                                    className="flex h-10 items-end gap-[3px]"
                                    aria-hidden
                                >
                                    {Array.from({ length: BAR_COUNT }, (_, i) => (
                                        <span
                                            key={i}
                                            data-meter-bar
                                            className="w-1.5 shrink-0 rounded-full bg-brand"
                                            style={{ height: 8 }}
                                        />
                                    ))}
                                </div>
                                <div className="flex h-7 items-center gap-3">
                                    <span className="w-[4.5rem] shrink-0 font-mono text-lg font-semibold tabular-nums text-ink" aria-live="off">
                                        {formatClock(seconds)}
                                    </span>
                                    <ProgressBar value={(seconds / MAX_SECONDS) * 100} size="xs" className="flex-1" />
                                    <span className="w-10 shrink-0 text-right text-xs text-ink-mute tabular-nums">{formatClock(MAX_SECONDS)}</span>
                                </div>
                            </div>

                            <div className="flex shrink-0 gap-2">
                                <Button variant="ghost" onClick={cancelRecording}>
                                    <IconClose width={15} height={15} /> Batal
                                </Button>
                                <Button size="lg" onClick={() => void finish()} className="min-w-36">
                                    <IconCheck width={18} height={18} /> Selesai
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <ReadingPassage
                        title={title}
                        paragraphs={paragraphs}
                        label="Bacalah teks ini"
                        note={
                            fromSummary
                                ? "Baca ringkasan ini sampai selesai, lalu tekan Selesai."
                                : excerpt.truncated
                                    ? "Berhenti di kalimat terakhir yang tampil, lalu tekan Selesai."
                                    : undefined
                        }
                    />
                </>
            )}

            {/* ── Menghitung ───────────────────────────────────────────────── */}
            {phase === "analyzing" && (
                <Card className="animate-fade-in">
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                        <span className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-brand border-t-transparent" aria-hidden />
                        <div>
                            <p className="font-semibold text-ink">Menghitung hasil bacaanmu…</p>
                            <p className="mt-1 text-sm text-ink-mute">Sebentar saja, tidak lebih dari beberapa detik.</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── Langkah 3: hasil ─────────────────────────────────────────── */}
            {phase === "done" && result && summary && (
                <>
                    <Card className={cx("animate-fade-in", summary.tone === "good" ? "border-[var(--color-good)]/50" : "border-brand/40")}>
                        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
                            <div className="relative shrink-0">
                                <ProgressRing value={result.averageScore} size={136} tone={summary.tone} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono text-3xl font-bold tabular-nums text-ink">{result.averageScore}</span>
                                    <span className="text-[11px] font-medium uppercase tracking-wide text-ink-mute">dari 100</span>
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 text-center md:text-left">
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Hasil membaca</p>
                                <h2 className="mt-1 text-heading-2 text-ink">{summary.label}</h2>
                                <p className="mt-2 font-dyslexic">{summary.message}</p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                                    <Button
                                        variant={speaker.speaking && speaker.speakingKey === "feedback" ? "primary" : "soft"}
                                        size="sm"
                                        onClick={() => speaker.toggle(feedbackText, "feedback")}
                                        aria-pressed={speaker.speaking && speaker.speakingKey === "feedback"}
                                    >
                                        {speaker.speaking && speaker.speakingKey === "feedback" ? (
                                            <><IconSpeakerOff width={15} height={15} /> Berhenti</>
                                        ) : (
                                            <><IconSpeaker width={15} height={15} /> Dengarkan hasil</>
                                        )}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={reset}>
                                        <IconRefresh width={15} height={15} /> Rekam ulang
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
                            <Stat label="Kata tepat" value={`${result.correctWords}`} hint={`dari ${wordCount} kata`} />
                            <Stat label="Ketepatan" value={`${Math.round(result.wordAccuracy * 100)}%`} hint="kata sama dengan teks" />
                            <Stat label="Kecepatan" value={`${result.wordsPerMinute}`} hint="kata per menit" />
                            <Stat label="Waktu baca" value={formatClock(durationUsed)} hint={`${result.longPauses} jeda panjang`} />
                        </dl>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-5">
                        <Card className="animate-fade-in lg:col-span-3">
                            <div className="flex items-center gap-2 font-semibold text-ink">
                                <IconSparkle width={17} height={17} className="text-brand" /> Rincian penilaian
                            </div>
                            <p className="mt-1 text-xs text-ink-mute">Semakin panjang batangnya, semakin baik.</p>
                            <div className="mt-5 space-y-5">
                                {result.scores.map((s) => (
                                    <ScoreMeter
                                        key={s.label}
                                        label={s.label}
                                        score={s.score}
                                        note={`${s.note} · ${METRIC_HELP[s.label] ?? ""}`.replace(/ · $/, "")}
                                    />
                                ))}
                            </div>
                        </Card>

                        <div className="space-y-6 lg:col-span-2">
                            <Card className="animate-fade-in bg-[var(--color-good-soft)] border-[var(--color-good)]/30">
                                <div className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--color-good-strong)]">
                                    <IconTarget width={16} height={16} /> Latihan yang disarankan
                                </div>
                                <p className="font-dyslexic">{summary.practice}</p>
                            </Card>

                            <Card className="animate-fade-in">
                                <div className="mb-3 flex items-center gap-1.5 font-semibold text-ink">
                                    <IconInfo width={16} height={16} className="text-brand" /> Langkah berikutnya
                                </div>
                                <div className="flex flex-col gap-2">
                                    {onContinueToQuiz && (
                                        <Button onClick={onContinueToQuiz} className="justify-start">
                                            <IconClipboard width={16} height={16} /> Lanjut ke Kuis Pemahaman
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => router.push(hrefFor("syllable", documentId ?? undefined))}
                                    >
                                        <IconLetters width={16} height={16} /> Latih kata yang sulit
                                    </Button>
                                    <Button variant="ghost" className="justify-start" onClick={reset}>
                                        <IconRefresh width={16} height={16} /> Baca lagi teks ini
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className="rounded-xl bg-canvas px-3 py-3 text-center">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{label}</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{value}</dd>
            <dd className="text-xs text-ink-mute">{hint}</dd>
        </div>
    )
}
