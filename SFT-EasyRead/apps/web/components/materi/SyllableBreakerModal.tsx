"use client"

import { useState } from "react"
import { X, Volume2, BookA } from "lucide-react"
import { syllabify } from "../../lib/syllable"

function tokenize(text: string) {
  return text.match(/[A-Za-zÀ-ÿ']+|[^A-Za-zÀ-ÿ']+/g) || []
}
function isWord(t: string) {
  return /[A-Za-zÀ-ÿ']/.test(t)
}

export function SyllableBreakerModal({
  open,
  onClose,
  text,
}: {
  open: boolean
  onClose: () => void
  text: string
}) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!open) return null

  const clean = (w: string) => w.replace(/[^A-Za-zÀ-ÿ']/g, "")

  function speak(word: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang = "id-ID"
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  const syllables = selected ? syllabify(selected) : []

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <BookA className="mt-0.5 h-6 w-6 text-brand-500" strokeWidth={1.8} />
            <div>
              <h3 className="text-lg font-bold text-ink">Syllable Breaker</h3>
              <p className="text-xs text-ink-soft">Ketuk kata untuk melihat pemecahan suku kata</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Teks yang bisa diklik */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="leading-loose text-ink">
            {tokenize(text).map((tok, i) =>
              isWord(tok) ? (
                <span
                  key={i}
                  onClick={() => setSelected(clean(tok))}
                  className={[
                    "cursor-pointer rounded px-1 transition",
                    selected === clean(tok)
                      ? "bg-brand-500 font-semibold text-white"
                      : "text-brand-600 hover:bg-brand-50",
                  ].join(" ")}
                >
                  {tok}
                </span>
              ) : (
                <span key={i}>{tok}</span>
              )
            )}
          </p>
          <p className="mt-3 text-sm text-ink-soft">💡 Kata berwarna biru bisa diklik</p>
        </div>

        {/* Hasil pemecahan */}
        {selected && (
          <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Pemecahan Suku Kata</p>
            <p className="mt-2 text-3xl font-extrabold tracking-wide text-brand-700">
              {syllables.join(" - ")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => speak(selected)}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <Volume2 className="h-4 w-4" /> Dengarkan
              </button>
              <span className="text-ink-soft">/{selected}/</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-slate-100">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}