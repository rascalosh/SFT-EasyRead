"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, Badge } from "@/components/shared/ui"
import { IconSparkle } from "@/components/shared/icons"
import ScrollEdgeButton from "@/components/shared/ScrollEdgeButton"
import { createUserDocument, fetchUserDocument } from "@/lib/documents"
import { getActiveMaterial, setActiveMaterial, type ActiveMaterial } from "@/lib/session"
import {
  emptySimplifyView,
  emptySummaryView,
  parseSimplifyPayload,
  parseSummaryPayload,
  type SimplifyView,
  type SummaryView,
} from "@/lib/ai-result"
import { OriginalTextPanel } from "./OriginalTextPanel"
import { SimplifiedTextPanel } from "./SimplifiedTextPanel"
import { SummaryCard } from "./SummaryCard"

function toParagraphs(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return []
  const parts = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return parts.length ? parts : [trimmed]
}

/** Shell stabil untuk SSR + Suspense — hindari early-return yang beda dengan client. */
export function SimplifyPageShell({
  subtitle = "AI menyederhanakan teks yang sulit dan merangkum ide utama secara cepat.",
  sourceText = "",
  onSourceChange,
  resultText = "",
  points = [],
  title = "Teks baru",
  done = false,
  loading = false,
  error = null,
  onSimplify,
  onCopy,
  emptyMaterialHint = null,
  simplifyView = null,
  summaryView = null,
}: {
  subtitle?: string
  sourceText?: string
  onSourceChange?: (value: string) => void
  resultText?: string
  points?: string[]
  title?: string
  done?: boolean
  loading?: boolean
  error?: string | null
  onSimplify?: () => void
  onCopy?: () => void
  emptyMaterialHint?: string | null
  simplifyView?: SimplifyView | null
  summaryView?: SummaryView | null
}) {
  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <IconSparkle className="text-brand" /> AI Smart Simplifier & Summary
          </h1>
          <p className="text-sm text-ink-soft" suppressHydrationWarning>
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="brand"><IconSparkle width={13} height={13} /> Dihasilkan oleh AI</Badge>
          <Button onClick={onSimplify} disabled={loading || !sourceText.trim()}>
            {loading ? "Menyederhanakan…" : done ? "Proses Ulang" : "Sederhanakan Teks"}
          </Button>
        </div>
      </div>

      <OriginalTextPanel text={sourceText} onChange={onSourceChange ?? (() => {})} />
      {emptyMaterialHint && (
        <p className="text-sm text-ink-mute">{emptyMaterialHint}</p>
      )}
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <SimplifiedTextPanel text={resultText} loading={loading} done={done} view={simplifyView} />
      <SummaryCard title={title} points={points} done={done} onCopy={onCopy ?? (() => {})} view={summaryView} />
      </div>
      <ScrollEdgeButton />
    </>
  )
}

export default function SimplifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryId = searchParams.get("id")

  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [sourceText, setSourceText] = useState("")
  const [resultText, setResultText] = useState("")
  const [points, setPoints] = useState<string[]>([])
  const [simplifyView, setSimplifyView] = useState<SimplifyView>(emptySimplifyView)
  const [summaryView, setSummaryView] = useState<SummaryView>(emptySummaryView)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setBooting(true)
      setError(null)
      setDone(false)
      setFromCache(false)
      setResultText("")
      setPoints([])
      setSimplifyView(emptySimplifyView())
      setSummaryView(emptySummaryView())

      const session = getActiveMaterial()
      const documentId = queryId || session?.id || null

      if (!queryId && session?.id) {
        router.replace(`/simplify?id=${encodeURIComponent(session.id)}`)
        return
      }

      if (documentId) {
        const result = await fetchUserDocument(documentId)

        if (cancelled) return

        if ("unauthorized" in result) {
          router.push("/login")
          return
        }

        if ("document" in result) {
          const originalText = result.document.original_text?.trim() ?? ""
          const title = result.document.title ?? "Tanpa judul"
          const paragraphs = toParagraphs(originalText)
          const active: ActiveMaterial = {
            id: result.document.id,
            title,
            originalText,
            paragraphs,
          }
          setActiveMaterial(active)
          setMaterial(active)
          setSourceText(originalText)

          // Muat hasil AI tersimpan (tanpa panggil Gemini lagi)
          const [simplifyRes, summaryRes] = await Promise.all([
            fetch(`/api/documents/${result.document.id}/simplify`),
            fetch(`/api/documents/${result.document.id}/summary`),
          ])

          if (cancelled) return

          if (simplifyRes.ok) {
            const nextSimplify = parseSimplifyPayload(await simplifyRes.json())
            if (nextSimplify.text) {
              setSimplifyView(nextSimplify)
              setResultText(nextSimplify.text)
              setDone(true)
              setFromCache(true)
            }
          }
          if (summaryRes.ok) {
            const nextSummary = parseSummaryPayload(await summaryRes.json())
            if (nextSummary.points.length || nextSummary.summary) {
              setSummaryView(nextSummary)
              setPoints(nextSummary.points)
              setFromCache(true)
            }
          }

          setBooting(false)
          return
        }
      }

      if (cancelled) return

      if (
        session &&
        (!queryId || session.id === queryId) &&
        (session.originalText?.trim() || session.paragraphs?.length)
      ) {
        const text = session.originalText?.trim() || session.paragraphs.join("\n\n")
        setMaterial(session)
        setSourceText(text)
        setBooting(false)
        return
      }

      setMaterial(null)
      setSourceText("")
      setBooting(false)
    }

    void load()
    return () => { cancelled = true }
  }, [queryId, router])

  const title = material?.title ?? "Teks baru"

  const simplify = async () => {
    if (!sourceText.trim()) return

    setLoading(true)
    setDone(false)
    setFromCache(false)
    setError(null)

    try {
      let documentId = material?.id

      if (documentId) {
        const updateResponse = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ originalText: sourceText, title }),
        })
        if (updateResponse.status === 401) {
          router.push("/login")
          return
        }
        if (!updateResponse.ok) documentId = undefined
      }

      if (!documentId) {
        const created = await createUserDocument({
          title,
          sourceType: "text",
          originalText: sourceText,
        })

        if ("unauthorized" in created) {
          router.push("/login")
          return
        }
        if (!("document" in created)) throw new Error("create-failed")
        documentId = created.document.id
        setMaterial({
          id: documentId,
          title,
          originalText: sourceText,
          paragraphs: toParagraphs(sourceText),
        })
      }

      const [simplifyResponse, summaryResponse] = await Promise.all([
        fetch(`/api/documents/${documentId}/simplify`, { method: "POST" }),
        fetch(`/api/documents/${documentId}/summary`, { method: "POST" }),
      ])

      if (simplifyResponse.status === 401 || summaryResponse.status === 401) {
        router.push("/login")
        return
      }
      if (!simplifyResponse.ok) throw new Error("simplify-failed")

      const simplifyPayload = await simplifyResponse.json()
      const summaryPayload = summaryResponse.ok ? await summaryResponse.json() : null
      const nextSimplify = parseSimplifyPayload(simplifyPayload)
      const nextSummary = summaryPayload ? parseSummaryPayload(summaryPayload) : emptySummaryView()

      if (!nextSimplify.text) throw new Error("invalid-simplification")
      setSimplifyView(nextSimplify)
      setSummaryView(nextSummary)
      setResultText(nextSimplify.text)
      setPoints(nextSummary.points)
      setDone(true)
      setFromCache(Boolean((simplifyPayload as { cached?: boolean }).cached))
    } catch {
      setError("Teks gagal diproses oleh AI. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const copySummary = async () => {
    const chunks = [summaryView.summary, ...points].map((item) => item.trim()).filter(Boolean)
    if (!chunks.length) return
    try {
      await navigator.clipboard.writeText(chunks.join("\n"))
    } catch {
      // ignore
    }
  }

  const staleScores = fromCache && simplifyView.originalScore == null && simplifyView.simplifiedScore == null
  const subtitle = booting
    ? "Memuat teks materi…"
    : material
      ? fromCache
        ? staleScores
          ? `Menyederhanakan: ${material.title} · hasil tersimpan · tekan Proses Ulang untuk cek apakah sudah lebih mudah`
          : `Menyederhanakan: ${material.title} · hasil tersimpan`
        : `Menyederhanakan: ${material.title}`
      : "Belum ada materi dipilih. Tempel teks di bawah, atau buka materi dulu dari sidebar."

  return (
    <SimplifyPageShell
      subtitle={subtitle}
      sourceText={sourceText}
      onSourceChange={(value) => {
        setSourceText(value)
        // Teks diubah → hasil lama tidak berlaku sampai diproses ulang
        if (done) {
          setDone(false)
          setResultText("")
          setPoints([])
          setSimplifyView(emptySimplifyView())
          setSummaryView(emptySummaryView())
          setFromCache(false)
        }
      }}
      resultText={resultText}
      points={points}
      simplifyView={simplifyView}
      summaryView={summaryView}
      title={title}
      done={done}
      loading={loading || booting}
      error={error}
      onSimplify={simplify}
      onCopy={copySummary}
      emptyMaterialHint={
        !booting && !sourceText.trim() && material
          ? `Materi “${material.title}” belum punya teks tersimpan. Tempel teks di panel atas, lalu sederhanakan.`
          : null
      }
    />
  )
}
