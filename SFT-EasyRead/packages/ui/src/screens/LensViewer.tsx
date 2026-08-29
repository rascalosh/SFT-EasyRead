"use client"

import { useState, useRef } from "react"
import { cx } from "../components/ui"

type Rect = { x: number; y: number; w: number; h: number }

const DEMO_OCR =
  "Pada tahun 1945, bangsa Indonesia memproklamasikan kemerdekaannya setelah bertahun-tahun berjuang melawan penjajahan. Peristiwa bersejarah ini terjadi pada tanggal 17 Agustus, dipimpin oleh Ir. Soekarno dan Drs. Mohammad Hatta sebagai Presiden dan Wakil Presiden pertama Republik Indonesia."

const DEMO_SUMMARY =
  "Indonesia merdeka pada 17 Agustus 1945. Soekarno dan Hatta memimpin proklamasi setelah perjuangan panjang. Mereka menjadi presiden dan wakil presiden pertama RI."

export default function LensViewer({
  imageFile,
  onConfirm,
  onCancel,
}: {
  imageFile: File
  onConfirm: () => void
  onCancel: () => void
}) {
  const [imageUrl] = useState(() => URL.createObjectURL(imageFile))
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const [selection, setSelection] = useState<Rect | null>(null)
  const [dragging, setDragging] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [mode, setMode] = useState<"dyslexic" | "summary">("dyslexic")
  const containerRef = useRef<HTMLDivElement>(null)

  function relPos(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    }
  }

  function onStart(clientX: number, clientY: number) {
    if (scanned) return
    const p = relPos(clientX, clientY)
    setAnchor(p)
    setSelection(null)
    setDragging(true)
  }

  function onMove(clientX: number, clientY: number) {
    if (!dragging || !anchor) return
    const p = relPos(clientX, clientY)
    setSelection({
      x: Math.min(anchor.x, p.x),
      y: Math.min(anchor.y, p.y),
      w: Math.abs(p.x - anchor.x),
      h: Math.abs(p.y - anchor.y),
    })
  }

  function onEnd() {
    setDragging(false)
  }

  const hasSelection = !!(selection && selection.w > 3 && selection.h > 3)

  const handles = selection
    ? [
        { top: `${selection.y}%`,              left: `${selection.x}%` },
        { top: `${selection.y}%`,              left: `${selection.x + selection.w}%` },
        { top: `${selection.y + selection.h}%`, left: `${selection.x}%` },
        { top: `${selection.y + selection.h}%`, left: `${selection.x + selection.w}%` },
      ]
    : []

  return (
    <div className="animate-[fade-in_200ms_ease-out_both]">

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {scanned ? "Hasil Pindaian" : "Pilih Area Teks"}
          </p>
          <p className="text-xs text-ink-mute">
            {scanned
              ? "Teks ditampilkan dalam format ramah disleksia"
              : "Seret di atas foto untuk memilih area teks"}
          </p>
        </div>
        {scanned && (
          <button
            onClick={() => { setScanned(false); setSelection(null) }}
            className="text-xs font-semibold text-brand hover:text-brand-strong transition-colors"
          >
            Pilih Ulang
          </button>
        )}
      </div>

      {/* Image + selection canvas */}
      <div
        ref={containerRef}
        className={cx(
          "relative w-full overflow-hidden rounded-xl border border-line select-none",
          !scanned && "cursor-crosshair",
        )}
        style={{ maxHeight: "44vh" }}
        onMouseDown={(e) => onStart(e.clientX, e.clientY)}
        onMouseMove={(e) => onMove(e.clientX, e.clientY)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          if (touch) onStart(touch.clientX, touch.clientY)
        }}
        onTouchMove={(e) => {
          e.preventDefault()
          const touch = e.touches[0]
          if (touch) onMove(touch.clientX, touch.clientY)
        }}
        onTouchEnd={onEnd}
      >
        <img
          src={imageUrl}
          alt="Foto pindaian"
          draggable={false}
          className="w-full object-contain pointer-events-none"
          style={{ maxHeight: "44vh" }}
        />

        {/* Dim overlay */}
        {!scanned && (
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        )}

        {/* Selection */}
        {selection && (
          <>
            {/* Cut-out clear window */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${selection.x}%`,
                top: `${selection.y}%`,
                width: `${selection.w}%`,
                height: `${selection.h}%`,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                borderRadius: "3px",
              }}
            />
            {/* Border */}
            <div
              className="absolute border-2 border-brand pointer-events-none"
              style={{
                left: `${selection.x}%`,
                top: `${selection.y}%`,
                width: `${selection.w}%`,
                height: `${selection.h}%`,
                borderRadius: "3px",
              }}
            />
            {/* Corner handles */}
            {handles.map((style, i) => (
              <div
                key={i}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface-raised)] bg-brand pointer-events-none"
                style={style}
              />
            ))}
          </>
        )}

        {/* Hint */}
        {!hasSelection && !scanned && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
            <span className="rounded-lg bg-black/60 px-4 py-1.5 text-xs text-white">
              Seret untuk memilih area teks
            </span>
          </div>
        )}
      </div>

      {/* Scan button */}
      {hasSelection && !scanned && (
        <button
          onClick={() => setScanned(true)}
          className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-[var(--color-brand-ink)] shadow-[var(--shadow-brand)] hover:bg-brand-strong transition-all"
        >
          Pindai Teks di Area Ini
        </button>
      )}

      {/* OCR Result */}
      {scanned && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-5 animate-[fade-in_250ms_ease-out_both]">

          {/* Mode tabs */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMode("dyslexic")}
              className={cx(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === "dyslexic"
                  ? "bg-brand text-[var(--color-brand-ink)]"
                  : "text-ink-soft hover:text-ink hover:bg-[var(--color-line-soft)]",
              )}
            >
              Font Dysleksia
            </button>
            <button
              onClick={() => setMode("summary")}
              className={cx(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === "summary"
                  ? "bg-brand text-[var(--color-brand-ink)]"
                  : "text-ink-soft hover:text-ink hover:bg-[var(--color-line-soft)]",
              )}
            >
              Ringkasan AI
            </button>
          </div>

          {mode === "dyslexic" ? (
            <div
              className="rounded-xl px-5 py-4 text-ink"
              style={{
                background: "var(--color-overlay-cream)",
                fontFamily: "var(--font-reading)",
                fontSize: "1rem",
                lineHeight: "2.1",
                letterSpacing: "0.04em",
                wordSpacing: "0.2em",
              }}
            >
              {DEMO_OCR}
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--color-brand-softer)] px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">
                Ringkasan AI
              </p>
              <p
                className="text-sm text-ink-soft leading-relaxed"
                style={{ fontFamily: "var(--font-reading)", lineHeight: "1.9" }}
              >
                {DEMO_SUMMARY}
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-ink)] hover:bg-brand-strong shadow-[var(--shadow-brand)] transition-all"
            >
              Simpan Materi
            </button>
          </div>
        </div>
      )}

      {/* Cancel when not yet scanned */}
      {!scanned && (
        <button
          onClick={onCancel}
          className="mt-3 w-full rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] transition-colors"
        >
          Batal
        </button>
      )}
    </div>
  )
}
