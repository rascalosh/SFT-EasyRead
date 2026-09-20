"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, Badge } from "@/components/shared/ui"
import { IconSparkle } from "@/components/shared/icons"
import ScrollEdgeButton from "@/components/shared/ScrollEdgeButton"
import { createUserDocument, fetchUserDocument } from "@/lib/documents"
import {
  getActiveMaterial,
  setActiveMaterial,
  type ActiveMaterial,
  type SimplifyStyle,
} from "@/lib/session"
import { useReadingSettings } from "@/lib/use-reading-settings"
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
import { type KincaidReading } from "./KincaidScore"
import { measureDifficulty } from "@/lib/readability"

function toParagraphs(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return []
  const parts = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return parts.length ? parts : [trimmed]
}

/** Endpoint simplify dengan versi hasil yang dipilih di Pengaturan. */
function simplifyEndpoint(documentId: string, style: SimplifyStyle) {
  return `/api/documents/${documentId}/simplify?style=${style}`
}

function jsonMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message
  }
  return null
}

function kincaidOf(text: string): KincaidReading | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const difficulty = measureDifficulty(trimmed)
  return { fkId: difficulty.fkId, band: difficulty.band }
}

/** HTML yang sama di server, Suspense, dan hydrate pertama — baru kemudian shell penuh. */
export function SimplifyLoadingState() {
  return (
    <div className="space-y-6" suppressHydrationWarning>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink" suppressHydrationWarning>
        <IconSparkle className="text-brand" /> Simplify
      </h1>
      <p className="text-sm text-ink-mute" suppressHydrationWarning>
        Memuat teks materi…
      </p>
    </div>
  )
}

export function SimplifyPageShell({
  subtitle = "AI menulis ulang seluruh teks agar lebih mudah dibaca, lalu merangkum intinya.",
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
  style = "plain",
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
  style?: SimplifyStyle
}) {
  const originalKincaid = useMemo(() => kincaidOf(sourceText), [sourceText])
  const simplifiedKincaid = useMemo(
    () => (done ? kincaidOf(resultText) : null),
    [done, resultText],
  )
  const summaryKincaid = useMemo(() => {
    if (!done || !summaryView) return null
    if (summaryView.fkId != null) {
      return { fkId: summaryView.fkId, band: summaryView.band }
    }
    const surface = [summaryView.summary, ...points].join("\n")
    return kincaidOf(surface)
  }, [done, summaryView, points])

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <IconSparkle className="text-brand" /> Simplify
          </h1>
          <p className="text-sm text-ink-soft" suppressHydrationWarning>
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="brand"><IconSparkle width={13} height={13} /> Dihasilkan oleh AI</Badge>
          <Button onClick={onSimplify} disabled={loading || !sourceText.trim()}>
            {loading ? "Menyiapkan…" : done ? "Proses ulang" : "Buat bacaan mudah"}
          </Button>
        </div>
      </div>

      <OriginalTextPanel text={sourceText} onChange={onSourceChange ?? (() => {})} kincaid={originalKincaid} />
      {emptyMaterialHint && (
        <p className="text-sm text-ink-mute">{emptyMaterialHint}</p>
      )}
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <SimplifiedTextPanel
        text={resultText}
        loading={loading}
        done={done}
        view={simplifyView}
        style={style}
        originalKincaid={originalKincaid}
        simplifiedKincaid={simplifiedKincaid}
      />
      <SummaryCard
        title={title}
        points={points}
        done={done}
        onCopy={onCopy ?? (() => {})}
        view={summaryView}
        originalKincaid={originalKincaid}
        summaryKincaid={summaryKincaid}
      />
      </div>
      <ScrollEdgeButton />
    </>
  )
}

export default function SimplifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryId = searchParams.get("id")
  // Versi hasil (Teks sederhana / Terstruktur) diatur di Pengaturan dan
  // ikut berubah langsung kalau pengguna menggantinya di tab lain.
  const { settings, ready: settingsReady } = useReadingSettings()
  const style = settings.simplifyStyle

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!settingsReady) return

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
            fetch(simplifyEndpoint(result.document.id, style)),
            fetch(`/api/documents/${result.document.id}/summary`),
          ])

          if (cancelled) return

          if (simplifyRes.ok) {
            const nextSimplify = parseSimplifyPayload(await simplifyRes.json())
            const usable =
              style === "structured" ? Boolean(nextSimplify.markdown) : Boolean(nextSimplify.text)
            if (usable) {
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
  }, [queryId, router, style, settingsReady])

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

      const simplifyResponse = await fetch(simplifyEndpoint(documentId, style), { method: "POST" })

      if (simplifyResponse.status === 401) {
        router.push("/login")
        return
      }

      const simplifyPayload = await simplifyResponse.json().catch(() => null)
      if (!simplifyResponse.ok) {
        const fromApi = jsonMessage(simplifyPayload)
        if (simplifyResponse.status === 429) {
          throw new Error(fromApi || "Kuota AI sedang penuh. Tunggu sekitar 20 detik, lalu coba lagi.")
        }
        throw new Error(fromApi || "Teks gagal diproses oleh AI. Silakan coba lagi.")
      }

      const nextSimplify = parseSimplifyPayload(simplifyPayload)
      if (!nextSimplify.text) throw new Error("invalid-simplification")
      if (style === "structured" && !nextSimplify.markdown) throw new Error("invalid-simplification")

      setSimplifyView(nextSimplify)
      setResultText(nextSimplify.text)
      setFromCache(Boolean((simplifyPayload as { cached?: boolean }).cached))

      // Summary dipanggil setelah simplify supaya tidak berebut kuota Gemini.
      const summaryResponse = await fetch(`/api/documents/${documentId}/summary`, { method: "POST" })
      if (summaryResponse.status === 401) {
        router.push("/login")
        return
      }

      let nextSummary = emptySummaryView()
      let summaryNote: string | null = null
      if (summaryResponse.ok) {
        const summaryPayload = await summaryResponse.json().catch(() => null)
        if (summaryPayload) nextSummary = parseSummaryPayload(summaryPayload)
      } else if (summaryResponse.status === 429) {
        summaryNote =
          jsonMessage(await summaryResponse.json().catch(() => null)) ||
          "Bacaan mudah siap. Ringkasan belum bisa dibuat karena kuota AI penuh. Coba Proses ulang nanti."
      } else {
        summaryNote = "Bacaan mudah siap. Ringkasan belum berhasil dibuat. Coba Proses ulang nanti."
      }

      setSummaryView(nextSummary)
      setPoints(nextSummary.points)
      setDone(true)
      if (summaryNote) setError(summaryNote)
    } catch (error) {
      const raw = error instanceof Error ? error.message : ""
      if (raw === "create-failed") {
        setError("Materi gagal disimpan. Silakan coba lagi.")
      } else if (raw === "invalid-simplification") {
        setError("AI tidak mengembalikan bacaan yang bisa dipakai. Silakan coba lagi.")
      } else if (raw) {
        setError(raw)
      } else {
        setError("Teks gagal diproses oleh AI. Silakan coba lagi.")
      }
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

  if (!mounted) {
    return <SimplifyLoadingState />
  }

  const staleScores = fromCache && simplifyView.originalScore == null && simplifyView.simplifiedScore == null
  const subtitle = booting
    ? "Memuat teks materi…"
    : material
      ? fromCache
        ? staleScores
          ? `Simplify: ${material.title} · hasil tersimpan · tekan Proses ulang untuk cek apakah sudah lebih mudah`
          : `Simplify: ${material.title} · hasil tersimpan`
        : `Simplify: ${material.title}`
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
      style={style}
      title={title}
      done={done}
      loading={loading || booting}
      error={error}
      onSimplify={simplify}
      onCopy={copySummary}
      emptyMaterialHint={
        !booting && !sourceText.trim() && material
          ? `Materi “${material.title}” belum punya teks tersimpan. Tempel teks di panel atas, lalu tekan Buat bacaan mudah.`
          : null
      }
    />
  )
}
