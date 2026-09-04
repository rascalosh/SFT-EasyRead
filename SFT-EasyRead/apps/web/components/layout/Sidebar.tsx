'use client'

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, FileText, BarChart3, Mic, Settings, BookOpen } from "lucide-react"
import { UploadModal } from "../dashboard/UploadModal"

type Doc = { id: string; title: string; created_at?: string }

const bottomNav = [
  { label: "Pencapaian", icon: BarChart3, href: "/pencapaian" },
  { label: "Penilaian Membaca", icon: Mic, href: "/penilaian" },
  { label: "Pengaturan & Bantuan", icon: Settings, href: "/pengaturan" },
]

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [docs, setDocs] = useState<Doc[]>([])

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents")
      if (!res.ok) return
      const json = await res.json()
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
      setDocs(list)
    } catch {}
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  return (
    <>
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-300",
          "xl:static xl:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full xl:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <BookOpen className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-ink">
              EasyRead <span className="text-brand-600">AI</span>
            </p>
            <p className="text-xs text-ink-soft">Membaca Jadi Lebih Mudah</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {/* Beranda */}
          <Link
            href="/home"
            onClick={onClose}
            className={[
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              pathname.startsWith("/home") ? "bg-brand-500 text-white" : "text-ink hover:bg-slate-50",
            ].join(" ")}
          >
            <Home className="h-5 w-5" strokeWidth={1.8} />
            Beranda
          </Link>

          {/* + Materi Baru */}
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="mt-2 flex w-full items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-100"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
            Materi Baru
          </button>

          {/* Materi Terbaru */}
          <p className="px-3 pb-2 pt-5 text-xs font-bold uppercase tracking-wide text-ink-soft">
            Materi Terbaru
          </p>
          <div className="space-y-1">
            {docs.length === 0 ? (
              <p className="px-3 text-xs text-ink-soft">Belum ada materi. Klik &quot;Materi Baru&quot;.</p>
            ) : (
              docs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/materi/${doc.id}`}
                  onClick={onClose}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{doc.title}</p>
                    <p className="text-xs text-ink-soft">Materi tersimpan</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Menu bawah */}
        <div className="space-y-1 border-t border-slate-100 px-3 py-3">
          {bottomNav.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
            >
              <Icon className="h-5 w-5 text-ink-soft" strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </div>
      </aside>

      <UploadModal open={uploadOpen} onClose={() => { setUploadOpen(false); loadDocs() }} />
    </>
  )
}