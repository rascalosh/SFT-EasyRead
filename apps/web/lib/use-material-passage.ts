"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchCachedSimplify, fetchCachedSummary, generateSimplify, generateSummary, isOk } from "@/lib/api"
import { parseSimplifyPayload, parseSummaryPayload } from "@/lib/ai-result"
import { blocksFromSummary } from "@/lib/reading-excerpt"
import { markdownToPlainText } from "@/lib/markdown-text"
import type { ActiveMaterial } from "@/lib/session"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type MaterialSource = "original" | "easy" | "structured" | "summary"

export const MATERIAL_SOURCES: { id: MaterialSource; label: string }[] = [
  { id: "original", label: "Asli" },
  { id: "easy", label: "Mudah" },
  { id: "structured", label: "Terstruktur" },
  { id: "summary", label: "Ringkasan" },
]

const SOURCE_LABEL: Record<MaterialSource, string> = {
  original: "Bacaan asli",
  easy: "Bacaan mudah",
  structured: "Bacaan terstruktur",
  summary: "Ringkasan",
}

type Version = {
  paragraphs: string[]
  markdown: string | null
}

function originalBlocks(material: ActiveMaterial | null): string[] {
  if (!material) return []
  if (material.paragraphs?.length) return material.paragraphs.map((part) => part.trim()).filter(Boolean)
  const text = material.originalText?.trim()
  return text ? [text] : []
}

function paragraphsFromText(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return []
  const parts = trimmed.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
  return parts.length ? parts : [trimmed]
}

/**
 * Teks asli plus hasil Simplify/Summary yang sudah tersimpan.
 * Tidak memanggil Gemini — hanya cache. Pilihan yang belum dibuat dinonaktifkan.
 */
export function useMaterialPassage(material: ActiveMaterial | null) {
  const documentId = material?.id && UUID.test(material.id) ? material.id : null
  const original = useMemo<Version>(
    () => ({ paragraphs: originalBlocks(material), markdown: null }),
    [material],
  )

  const [source, setSource] = useState<MaterialSource>("original")
  const [easy, setEasy] = useState<Version | null>(null)
  const [structured, setStructured] = useState<Version | null>(null)
  const [summary, setSummary] = useState<Version | null>(null)
  const [ready, setReady] = useState(!documentId)
  const [generating, setGenerating] = useState<MaterialSource | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) {
      setEasy(null)
      setStructured(null)
      setSummary(null)
      setReady(true)
      return
    }

    let alive = true
    setReady(false)
    setSource("original")
    setEasy(null)
    setStructured(null)
    setSummary(null)

    void Promise.all([
      fetchCachedSimplify(documentId, "plain"),
      fetchCachedSimplify(documentId, "structured"),
      fetchCachedSummary(documentId),
    ]).then(([plainRes, structuredRes, summaryRes]) => {
      if (!alive) return

      if (isOk(plainRes)) {
        const view = parseSimplifyPayload(plainRes.data)
        const paragraphs = paragraphsFromText(view.text)
        if (paragraphs.length) setEasy({ paragraphs, markdown: null })
      }

      if (isOk(structuredRes)) {
        const view = parseSimplifyPayload(structuredRes.data)
        const markdown = view.markdown?.trim() || null
        let paragraphs = paragraphsFromText(view.text)
        if (!paragraphs.length && markdown) {
          paragraphs = paragraphsFromText(markdownToPlainText(markdown))
        }
        if (markdown || paragraphs.length) {
          setStructured({ paragraphs, markdown })
        }
      }

      if (isOk(summaryRes)) {
        const view = parseSummaryPayload(summaryRes.data)
        const paragraphs = blocksFromSummary(view.summary, view.points)
        if (paragraphs.length) setSummary({ paragraphs, markdown: null })
      }

      setReady(true)
    })

    return () => {
      alive = false
    }
  }, [documentId])

  const available: Record<MaterialSource, boolean> = {
    original: original.paragraphs.length > 0,
    easy: easy !== null,
    structured: structured !== null,
    summary: summary !== null,
  }

  const active: MaterialSource = available[source] ? source : "original"
  const current = (active === "easy" ? easy : active === "structured" ? structured : active === "summary" ? summary : original) ?? original
  const listenText = current.markdown
    ? markdownToPlainText(current.markdown)
    : current.paragraphs.join(" ").trim()

  /**
   * Pindah ke tab ini. Kalau versinya belum ada, buat dulu (panggil AI)
   * sebelum pindah — jadi biayanya cuma kena untuk versi yang benar-benar
   * dipilih pengguna, bukan semua gaya sekaligus di setiap Simplify.
   */
  async function selectSource(id: MaterialSource) {
    if (available[id]) {
      setSource(id)
      return
    }

    if (id === "original" || !documentId || generating) return

    setGenerating(id)
    setGenerateError(null)

    const result =
      id === "summary"
        ? await generateSummary(documentId)
        : await generateSimplify(documentId, id === "structured" ? "structured" : "plain")

    setGenerating(null)

    if (!isOk(result)) {
      setGenerateError("Gagal membuat versi ini. Coba lagi.")
      return
    }

    if (id === "summary") {
      const view = parseSummaryPayload(result.data)
      const paragraphs = blocksFromSummary(view.summary, view.points)
      if (!paragraphs.length) {
        setGenerateError("Gagal membuat versi ini. Coba lagi.")
        return
      }
      setSummary({ paragraphs, markdown: null })
    } else {
      const view = parseSimplifyPayload(result.data)
      const markdown = view.markdown?.trim() || null
      let paragraphs = paragraphsFromText(view.text)
      if (!paragraphs.length && markdown) {
        paragraphs = paragraphsFromText(markdownToPlainText(markdown))
      }
      if (!markdown && !paragraphs.length) {
        setGenerateError("Gagal membuat versi ini. Coba lagi.")
        return
      }
      if (id === "structured") setStructured({ paragraphs, markdown })
      else setEasy({ paragraphs, markdown: null })
    }

    setSource(id)
  }

  return {
    ready,
    source: active,
    setSource,
    selectSource,
    generating,
    generateError,
    available,
    label: SOURCE_LABEL[active],
    paragraphs: current.paragraphs,
    markdown: current.markdown,
    listenText,
    options: MATERIAL_SOURCES.map((item) => ({
      value: item.id,
      label: item.label,
      disabled: !available[item.id],
    })),
  }
}
