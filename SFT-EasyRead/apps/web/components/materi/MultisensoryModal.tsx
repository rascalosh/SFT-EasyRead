"use client"

import { useEffect, useRef, useState } from "react"
import { X, Play, Pause, Headphones } from "lucide-react"

export function MultisensoryModal({
  open,
  onClose,
  text,
}: {
  open: boolean
  onClose: () => void
  text: string
}) {
  const [playing, setPlaying] = useState(false)
  const [wordIndex, setWordIndex] = useState(-1)
  const [rate, setRate] = useState(1)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Pecah teks jadi daftar kata + catat posisi huruf tiap kata (buat sinkron highlight).
  const words = text.split(/\s+/).filter(Boolean)

  function stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setPlaying(false)
    setWordIndex(-1)
  }

  function play() {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const u = new SpeechSynthesisUtterance(text)
    u.lang = "id-ID"
    u.rate = rate

    // Saat TTS pindah kata, hitung kata ke berapa dari posisi huruf.
    u.onboundary = (e) => {
      if (e.name === "word" || e.charIndex != null) {
        const upto = text.slice(0, e.charIndex)
        const idx = upto.split(/\s+/).filter(Boolean).length
        setWordIndex(idx)
      }
    }
    u.onend = () => { setPlaying(false); setWordIndex(-1) }
    u.onerror = () => { setPlaying(false); setWordIndex(-1) }

    utterRef.current = u
    window.speechSynthesis.speak(u)
    setPlaying(true)
  }

  function toggle() {
    if (playing) stop()
    else play()
  }

  // Kalau modal ditutup, hentikan suara.
  useEffect(() => {
    if (!open) stop()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Kalau kecepatan diubah saat sedang jalan, mulai ulang dengan kecepatan baru.
  useEffect(() => {
    if (playing) play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <Headphones className="mt-0.5 h-6 w-6 text-brand-500" strokeWidth={1.8} />
            <div>
              <h3 className="text-lg font-bold text-ink">Multisensory Audio-Visual Tracking</h3>
              <p className="text-xs text-ink-soft">Ikuti sorotan kata secara real-time</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Teks dengan sorotan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-lg leading-loose text-ink">
          {words.map((w, i) => (
            <span
              key={i}
              className={[
                "rounded px-1 transition-colors",
                i === wordIndex ? "bg-brand-500 font-semibold text-white" : "",
              ].join(" ")}
            >
              {w}{" "}
            </span>
          ))}
        </div>

        {/* Kontrol */}
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={toggle}
            className="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-md hover:bg-brand-600"
            aria-label={playing ? "Jeda" : "Putar"}
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 pl-0.5" />}
          </button>

          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink outline-none"
          >
            <option value={0.25}>Sangat lambat (0.25x)</option>
            <option value={0.4}>Lambat sekali (0.4x)</option>
            <option value={0.5}>Lambat (0.5x)</option>
            <option value={0.75}>Agak lambat (0.75x)</option>
            <option value={1}>Normal (1.0x)</option>
            <option value={1.25}>Agak cepat (1.25x)</option>
            <option value={1.5}>Cepat (1.5x)</option>
          </select>
        </div>
      </div>
    </div>
  )
}