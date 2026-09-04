"use client"

import { useState } from "react"
import { X, FileText, BookOpen } from "lucide-react"

export function PasteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  if (!open) return null

  function close() {
    setValue(""); setError(null); setSaving(false); setDone(false)
    onClose()
  }

  async function handleSave() {
    if (!value.trim()) { setError("Teks masih kosong."); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Teks Tempelan",
          sourceType: "text",
          originalText: value,
        }),
      })
      if (!res.ok) throw new Error("gagal")
      setDone(true)
    } catch {
      setError("Gagal menyimpan teks. Coba lagi.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={close} />

      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-6 w-6 text-emerald-500" strokeWidth={1.8} />
            <div>
              <h3 className="text-lg font-bold text-ink">Tempel Teks dari Papan Klip</h3>
              <p className="text-xs text-ink-soft">Salin teks dari sumber lain, lalu tempel di sini.</p>
            </div>
          </div>
          <button onClick={close} aria-label="Tutup" className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-2 font-semibold text-ink">Berhasil! Teks sudah tersimpan.</p>
            <button onClick={close} className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Selesai
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={8}
              placeholder="Tempel teksmu di sini (Ctrl/Cmd + V)…"
              className="w-full resize-none rounded-xl border border-slate-200 p-4 text-base leading-normal text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={close} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-slate-100">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                <BookOpen className="h-4 w-4" /> {saving ? "Menyimpan..." : "Mulai Membaca"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}