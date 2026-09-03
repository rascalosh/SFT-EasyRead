"use client"

import { useState } from "react"
import { Button, Badge } from "@/components/shared/ui"
import { IconSparkle } from "@/components/shared/icons"
import { demoTitle, originalText, simplifiedText, summaryPoints } from "@/lib/mock"
import { OriginalTextPanel } from "./OriginalTextPanel"
import { SimplifiedTextPanel } from "./SimplifiedTextPanel"
import { SummaryCard } from "./SummaryCard"

function extractDocumentId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const root = payload as Record<string, unknown>
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root
  return typeof data.id === "string" ? data.id : null
}

function extractSimplifiedText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return ""
  const root = payload as Record<string, unknown>
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root
  const result = data.result && typeof data.result === "object" ? (data.result as Record<string, unknown>) : data
  return typeof result.simplifiedText === "string" ? result.simplifiedText : ""
}

function extractSummaryPoints(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return []
  const root = payload as Record<string, unknown>
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root
  const result = data.result && typeof data.result === "object" ? (data.result as Record<string, unknown>) : data
  return Array.isArray(result.bulletPoints)
    ? result.bulletPoints.filter((item): item is string => typeof item === "string")
    : []
}

export default function SimplifyPage() {
  const [sourceText, setSourceText] = useState(originalText)
  const [resultText, setResultText] = useState("")
  const [points, setPoints] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const simplify = async () => {
    if (!sourceText.trim()) return

    setLoading(true)
    setDone(false)

    try {
      const createResponse = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: demoTitle,
          sourceType: "text",
          originalText: sourceText,
        }),
      })

      if (!createResponse.ok) throw new Error("create-failed")

      const documentId = extractDocumentId(await createResponse.json())
      if (!documentId) throw new Error("invalid-document")

      const [simplifyResponse, summaryResponse] = await Promise.all([
        fetch(`/api/documents/${documentId}/simplify`, { method: "POST" }),
        fetch(`/api/documents/${documentId}/summary`, { method: "POST" }),
      ])

      if (!simplifyResponse.ok) throw new Error("simplify-failed")

      const nextText = extractSimplifiedText(await simplifyResponse.json())
      const nextPoints = summaryResponse.ok
        ? extractSummaryPoints(await summaryResponse.json())
        : []

      setResultText(nextText || simplifiedText)
      setPoints(nextPoints.length ? nextPoints : summaryPoints)
      setDone(true)
    } catch {
      setResultText(simplifiedText)
      setPoints(summaryPoints)
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  const copySummary = async () => {
    if (!points.length) return
    try {
      await navigator.clipboard.writeText(points.join("\n"))
    } catch {
      // clipboard may be blocked in some browsers
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <IconSparkle className="text-brand" /> AI Smart Simplifier & Summary
          </h1>
          <p className="text-sm text-ink-soft">AI menyederhanakan teks yang sulit dan merangkum ide utama secara cepat.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="brand"><IconSparkle width={13} height={13} /> Dihasilkan oleh AI</Badge>
          <Button onClick={simplify} disabled={loading || !sourceText.trim()}>
            {loading ? "Menyederhanakan…" : "Sederhanakan Teks"}
          </Button>
        </div>
      </div>

      <OriginalTextPanel text={sourceText} onChange={setSourceText} />
      <SimplifiedTextPanel text={resultText} loading={loading} done={done} />
      <SummaryCard title={demoTitle} points={points} done={done} onCopy={copySummary} />
    </div>
  )
}
