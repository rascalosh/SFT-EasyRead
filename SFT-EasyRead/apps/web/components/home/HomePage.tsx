"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { hrefFor } from "@/lib/nav"
import { createUserDocument } from "@/lib/documents"
import { saveSessionMaterial } from "@/lib/mock"
import { setActiveMaterial } from "@/lib/session"
import { cx } from "@/components/shared/ui"
import { IconUpload, IconCamera, IconPaste, IconArrow, IconClose } from "@/components/shared/icons"
import LensViewer from "./LensViewer"

type Stage = "idle" | "options" | "paste-input" | "lens" | "loading" | "title"
type LoadMethod = "upload" | "paste"

const loadMeta: Record<LoadMethod, { label: string }> = {
  upload: { label: "Upload Dokumen" },
  paste:  { label: "Tempel Teks" },
}

export default function HomeDashboard() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>("idle")
  const [loadMethod, setLoadMethod] = useState<LoadMethod>("upload")
  const [lensFile, setLensFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState("")
  // Teks & jenis sumber yang benar-benar akan disimpan. Dipisah dari pasteText
  // karena isinya bisa datang dari OCR atau dari berkas .txt.
  const [pendingText, setPendingText] = useState("")
  const [pendingSource, setPendingSource] = useState<"text" | "image" | "pdf">("text")
  const [titleValue, setTitleValue] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const docInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  function startLoading(method: LoadMethod) {
    setLoadMethod(method)
    setStage("loading")
    setTimeout(() => setStage("title"), 2000)
  }

  async function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const name = file.name.toLowerCase()

    // Berkas teks bisa dibaca langsung di browser. PDF/DOCX belum bisa diurai
    // di sini, jadi materinya dibuat kosong dan teksnya ditempel menyusul.
    if (name.endsWith(".txt")) {
      const text = await file.text().catch(() => "")
      setPendingText(text.trim())
      setPendingSource("text")
    } else {
      setPendingText("")
      setPendingSource(name.endsWith(".pdf") ? "pdf" : "text")
    }

    startLoading("upload")
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLensFile(file)
      setStage("lens")
    }
    e.target.value = ""
  }

  function handlePasteConfirm() {
    if (!pasteText.trim()) return
    setPendingText(pasteText.trim())
    setPendingSource("text")
    startLoading("paste")
  }

  async function handleTitleSubmit() {
    if (!titleValue.trim() || submitting) return
    setSubmitError(null)
    setSubmitting(true)

    try {
      const result = await createUserDocument({
        title: titleValue.trim(),
        originalText: pendingText,
        // CHECK documents.source_type hanya menerima text | image | pdf.
        sourceType: pendingSource,
      })

      if ("unauthorized" in result) {
        router.push("/login")
        return
      }

      if ("document" in result) {
        const text = pendingText
        const material = {
          id: result.document.id,
          title: result.document.title ?? titleValue.trim(),
          meta: "Baru saja ditambahkan",
          progress: 0,
          pages: 0,
        }
        saveSessionMaterial(material)
        setActiveMaterial({
          id: material.id,
          title: material.title,
          originalText: text,
          paragraphs: text ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [],
        })
        router.push(hrefFor("material", material.id))
        return
      }

      setSubmitError("Materi gagal disimpan. Silakan coba lagi.")
    } catch {
      setSubmitError("Materi gagal disimpan. Periksa koneksi lalu coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStage("idle")
    setTitleValue("")
    setLensFile(null)
    setPasteText("")
    setPendingText("")
    setPendingSource("text")
    setSubmitError(null)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 py-12">

      {/* Hidden file inputs */}
      <input ref={docInputRef}    type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleDocChange} />
      <input ref={photoInputRef}  type="file" accept="image/*"         className="hidden" onChange={handleImageChange} />
      <input ref={cameraInputRef} type="file" accept="image/*"         className="hidden" onChange={handleImageChange} />

      {stage === "idle" && (
        <div className="mb-10 text-center animate-[fade-in_350ms_ease-out_both]">
          <h1 className="text-heading-1 text-ink">Tambah Materi Baru</h1>
          <p className="mt-2 text-body text-ink-soft">
            Pilih cara memasukkan teks untuk mulai membaca dengan nyaman.
          </p>
        </div>
      )}

      <div className="w-full max-w-lg">

        {/* ── IDLE ── */}
        {stage === "idle" && (
          <button
            onClick={() => setStage("options")}
            className={cx(
              "flex w-full flex-col items-center gap-4 rounded-2xl",
              "border-2 border-dashed border-line py-14 text-center",
              "transition-all duration-200 hover:border-brand hover:bg-brand-softer",
            )}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <IconUpload width={26} height={26} />
            </span>
            <div>
              <p className="text-base font-semibold text-ink">Ketuk untuk memilih sumber teks</p>
              <p className="mt-1 text-sm text-ink-mute">Upload · Foto · Kamera · Tempel</p>
            </div>
          </button>
        )}

        {/* ── OPTIONS ── */}
        {stage === "options" && (
          <div className="animate-[slide-down_200ms_ease-out_both]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-ink">Pilih cara memasukkan teks</p>
                <p className="text-sm text-ink-mute">4 cara tersedia untuk memulai</p>
              </div>
              <button
                onClick={reset}
                aria-label="Kembali"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute hover:bg-[var(--color-line-soft)] hover:text-ink"
              >
                <IconClose width={16} height={16} />
              </button>
            </div>
            <div className="grid gap-3">

              {/* Upload Dokumen */}
              <button
                onClick={() => docInputRef.current?.click()}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[var(--shadow-md)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <IconUpload width={22} height={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Upload Dokumen</p>
                  <p className="text-xs text-ink-mute mt-0.5">Unggah file .txt, .docx, atau .pdf</p>
                </div>
                <span className="shrink-0 text-ink-mute"><IconArrow width={16} height={16} /></span>
              </button>

              {/* Upload Foto */}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[var(--shadow-md)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-lavender-soft)] text-[var(--color-lavender)]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Upload Foto</p>
                  <p className="text-xs text-ink-mute mt-0.5">Pilih foto dari galeri untuk dipindai</p>
                </div>
                <span className="shrink-0 text-ink-mute"><IconArrow width={16} height={16} /></span>
              </button>

              {/* Pindai dari Kamera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[var(--shadow-md)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <IconCamera width={22} height={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Pindai dari Kamera</p>
                  <p className="text-xs text-ink-mute mt-0.5">Foto teks dari buku atau catatan</p>
                </div>
                <span className="shrink-0 text-ink-mute"><IconArrow width={16} height={16} /></span>
              </button>

              {/* Tempel Teks */}
              <button
                onClick={() => setStage("paste-input")}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[var(--shadow-md)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-amber-soft)] text-[var(--color-amber)]">
                  <IconPaste width={22} height={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Tempel Teks</p>
                  <p className="text-xs text-ink-mute mt-0.5">Salin dan tempel dari sumber lain</p>
                </div>
                <span className="shrink-0 text-ink-mute"><IconArrow width={16} height={16} /></span>
              </button>

            </div>
          </div>
        )}

        {/* ── LENS (Google Lens–style) ── */}
        {stage === "lens" && lensFile && (
          <LensViewer
            imageFile={lensFile}
            onConfirm={(text) => {
              setPendingText(text)
              setPendingSource("image")
              setStage("title")
            }}
            onCancel={reset}
          />
        )}

        {/* ── PASTE INPUT ── */}
        {stage === "paste-input" && (
          <div className="rounded-2xl border border-line bg-surface p-6 animate-[fade-in_200ms_ease-out_both]">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-amber-soft)] text-[var(--color-amber)]">
                <IconPaste width={22} height={22} />
              </span>
              <div>
                <p className="text-base font-semibold text-ink">Tempel Teks</p>
                <p className="text-sm text-ink-soft">Salin teks dari sumber lain lalu tempel di sini</p>
              </div>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Tempel teks kamu di sini…"
              rows={7}
              autoFocus
              className="w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-mute outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setStage("options")}
                className="flex-1 rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handlePasteConfirm}
                disabled={!pasteText.trim()}
                className={cx(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                  pasteText.trim()
                    ? "bg-brand text-[var(--color-brand-ink)] hover:bg-brand-strong shadow-[var(--shadow-brand)]"
                    : "cursor-not-allowed bg-[var(--color-disabled)] text-[var(--color-disabled-fg)]",
                )}
              >
                Lanjut <IconArrow width={15} height={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {stage === "loading" && (
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-surface p-8 text-center animate-[fade-in_200ms_ease-out_both]">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              {loadMethod === "paste" ? <IconPaste width={26} height={26} /> : <IconUpload width={26} height={26} />}
            </span>
            <div>
              <p className="text-base font-semibold text-ink">Memproses…</p>
              <p className="mt-1 text-sm text-ink-soft">{loadMeta[loadMethod].label}</p>
            </div>
            <div className="w-full overflow-hidden rounded-full bg-[var(--color-line-soft)]" role="progressbar" aria-label="Memuat">
              <div className="h-2 animate-[loading-bar_2s_ease-in-out_forwards] rounded-full bg-brand" />
            </div>
            <p className="text-xs text-ink-mute">Mohon tunggu sebentar…</p>
          </div>
        )}

        {/* ── TITLE ── */}
        {stage === "title" && (
          <div className="rounded-2xl border border-line bg-surface p-6 animate-[fade-in_200ms_ease-out_both]">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <IconUpload width={22} height={22} />
              </span>
              <div>
                <p className="text-base font-semibold text-ink">Beri judul materimu</p>
                <p className="text-sm text-ink-soft">Agar mudah ditemukan nanti</p>
              </div>
            </div>
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              placeholder="Contoh: Perjuangan Bangsa Indonesia…"
              autoFocus
              className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-mute outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            {submitError && <p className="mt-2 text-sm text-error" role="alert">{submitError}</p>}
            <div className="mt-4 flex gap-3">
              <button
                onClick={reset}
                className="flex-1 rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleTitleSubmit}
                disabled={!titleValue.trim() || submitting}
                className={cx(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                  titleValue.trim() && !submitting
                    ? "bg-brand text-[var(--color-brand-ink)] hover:bg-brand-strong shadow-[var(--shadow-brand)]"
                    : "cursor-not-allowed bg-[var(--color-disabled)] text-[var(--color-disabled-fg)]",
                )}
              >
                {submitting ? "Menyimpan…" : "Mulai Membaca"} <IconArrow width={15} height={15} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
