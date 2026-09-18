"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  activeMaterialFromDocument,
  fetchUserDocument,
} from "@/lib/documents"
import { getActiveMaterial, setActiveMaterial, type ActiveMaterial } from "@/lib/session"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Muat materi aktif dari API (`?id=` atau sesi), bukan teks demo.
 * Kalau `skip`, pemanggil sudah punya materi (mis. dioper dari halaman induk).
 */
export function useActiveDocument(options?: { skip?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryId = searchParams.get("id")
  const skip = options?.skip === true

  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (skip) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const session = getActiveMaterial()
      const documentId = queryId || session?.id || null

      if (!queryId && documentId && UUID.test(documentId)) {
        router.replace(`${pathname}?id=${encodeURIComponent(documentId)}`)
        return
      }

      if (!documentId || !UUID.test(documentId)) {
        if (!cancelled) {
          setMaterial(null)
          setLoading(false)
        }
        return
      }

      const result = await fetchUserDocument(documentId)
      if (cancelled) return

      if ("unauthorized" in result) {
        router.push("/login")
        return
      }

      if ("document" in result) {
        const active = activeMaterialFromDocument(result.document)
        setActiveMaterial(active)
        setMaterial(active)
        setLoading(false)
        return
      }

      if (session && session.id === documentId) {
        setMaterial(session)
        setError("Materi tidak bisa dimuat dari akun. Menampilkan salinan sesi ini.")
        setLoading(false)
        return
      }

      setMaterial(null)
      setError("Materi tidak ditemukan. Pilih materi dari beranda.")
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [skip, queryId, pathname, router])

  return { material, loading, error }
}
