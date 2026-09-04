"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchUserDocument } from "@/lib/documents"
import { getSessionMaterials } from "@/lib/mock"
import { getActiveMaterial, setActiveMaterial } from "@/lib/session"
import { startReadingSession, updateReadingSessionBeacon, isOk } from "@/lib/api"
import { ActivityPicker } from "./ActivityPicker"
import { MaterialHeader } from "./MaterialHeader"
import { MaterialNotFound } from "./MaterialNotFound"

function toParagraphs(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return []
  const parts = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return parts.length ? parts : [trimmed]
}

export default function MaterialDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : ""
  const [material, setMaterial] = useState<{ id: string; title: string } | null>(null)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const sessionId = useRef<string | null>(null)
  const openedAt = useRef<number>(Date.now())

  useEffect(() => {
    let active = true

    async function load() {
      // 1) Ambil dari API
      const result = await fetchUserDocument(id)
      if (!active) return

      if ("unauthorized" in result) {
        router.push("/login")
        return
      }

      if ("document" in result) {
        const title = result.document.title ?? "Tanpa judul"
        const originalText = result.document.original_text?.trim() ?? ""
        const paras = toParagraphs(originalText)
        setMaterial({ id: result.document.id, title })
        setParagraphs(paras)
        setActiveMaterial({
          id: result.document.id,
          title,
          originalText,
          paragraphs: paras,
        })
        setLoading(false)

        // Catat sesi membaca. Gagal mencatat tidak boleh mengganggu membaca.
        openedAt.current = Date.now()
        const started = await startReadingSession(result.document.id)
        if (active && isOk(started)) sessionId.current = started.data.id

        return
      }

      // 2) Fallback: session aktif untuk id yang sama
      const session = getActiveMaterial()
      if (session && session.id === id) {
        setMaterial({ id: session.id, title: session.title })
        setParagraphs(
          session.paragraphs?.length
            ? session.paragraphs
            : toParagraphs(session.originalText ?? ""),
        )
        setLoading(false)
        return
      }

      // 3) Ada di daftar session (metadata saja) — tampilkan judul, teks kosong
      const local = getSessionMaterials().find((item) => item.id === id)
      if (local) {
        setMaterial({ id: local.id, title: local.title })
        setParagraphs([])
        setActiveMaterial({
          id: local.id,
          title: local.title,
          originalText: "",
          paragraphs: [],
        })
        setLoading(false)
        return
      }

      // 4) Tidak ditemukan — jangan isi teks demo palsu
      setMaterial(null)
      setLoading(false)
    }

    void load()

    return () => {
      active = false

      // Tutup sesi saat pengguna meninggalkan halaman, dengan durasi sebenarnya.
      if (sessionId.current) {
        updateReadingSessionBeacon(sessionId.current, {
          durationSeconds: Math.round((Date.now() - openedAt.current) / 1000),
          completed: true,
        })
        sessionId.current = null
      }
    }
  }, [id, router])

  if (loading) return <p className="text-sm text-ink-soft">Memuat materi…</p>
  if (!material) return <MaterialNotFound />

  return (
    <div className="space-y-8 animate-[fade-in_300ms_ease-out_both]">
      <MaterialHeader
        title={material.title}
        paragraphs={
          paragraphs.length
            ? paragraphs
            : ["Materi ini belum punya teks tersimpan. Tempel teks lewat beranda (Tempel Teks), lalu buka lagi."]
        }
      />
      <ActivityPicker materialId={material.id} />
    </div>
  )
}
