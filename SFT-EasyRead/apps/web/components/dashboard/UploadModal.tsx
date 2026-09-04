"use client"

import { useRef, useState } from "react"
import { UploadCloud, FolderOpen, BookOpen, X, FileText } from "lucide-react"

const ALLOWED = [".txt", ".docx", ".pdf", ".pptx"]

function getExt(name: string) {
  const i = name.lastIndexOf(".")
  return i >= 0 ? name.slice(i).toLowerCase() : ""
}

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  function close() {
    setError(null); setFileName(null); setContent(""); setDone(false); setDragging(false); setSaving(false)
    onClose()
  }

  async function handleFile(file?: File | null) {
    if (!file) return
    setError(null); setDone(false)
    const ext = getExt(file.name)
    if (!ALLOWED.includes(ext)) {
      setError(`Format ${ext || "ini"} tidak didukung. Pakai .txt, .docx, .pdf, atau .pptx.`)
      setFileName(null); setContent("")
      return
    }
    setFileName(file.name)
    if (ext === ".txt") {
      setContent(await file.text())
    } else {
      setContent("")
    }
  }

  async function handleStart() {
    if (!fileName) { setError("Pilih file dulu ya."); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fileName.replace(/\.[^.]+$/, ""),
          sourceType: "upload",
          originalText: content,
        }),
      })
      if (!res.ok) throw new Error("gagal")
      setDone(true)
    } catch {
      setError("Gagal menyimpan dokumen. Coba lagi.")
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
            <UploadCloud className="mt-0.5 h-6 w-6 text-brand-500" strokeWidth={1.8} />
            <div>
              <h3 className="text-lg font-bold text-ink">Upload Teks / Dokumen</h3>
              <p className="text-xs text-ink-soft">Format yang didukung: .txt, .docx, .pdf, .pptx</p>
            </div>
          </div>
          <button onClick={close} aria-label="Tutup" className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-2 font-semibold text-ink">Berhasil! &quot;{fileName}&quot; sudah tersimpan.</p>
            <button onClick={close} className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Selesai
            </button>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]) }}
              onClick={() => inputRef.current?.click()}
              className={[
                "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition",
                dragging ? "border-brand-400 bg-brand-50" : "border-slate-300 bg-slate-50",
              ].join(" ")}
            >
              <UploadCloud className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
              <p className="mt-3 font-semibold text-ink">Seret &amp; lepas file di sini</p>
              <p className="text-sm text-ink-soft">atau klik untuk memilih file</p>
              <div className="mt-3 flex gap-2">
                {ALLOWED.map((e) => (
                  <span key={e} className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">{e}</span>
                ))}
              </div>
            </div>

            <input ref={inputRef} type="file" accept=".txt,.docx,.pdf,.pptx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-100"
            >
              <FolderOpen className="h-4 w-4" /> Pilih File dari Perangkat
            </button>

            {fileName && !error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-ink">
                <FileText className="h-4 w-4 text-brand-500" /> {fileName}
              </div>
            )}
            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={close} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-slate-100">
                Batal
              </button>
              <button
                onClick={handleStart}
                disabled={!fileName || saving}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
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