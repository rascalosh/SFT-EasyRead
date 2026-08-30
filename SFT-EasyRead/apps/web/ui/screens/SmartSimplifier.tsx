"use client"

import { useState } from "react"
import { Card, Button, Badge, SectionTitle } from "../components/ui"
import { IconSparkle, IconClipboard, IconArrow, IconCheck } from "../components/icons"
import { demoTitle, simplifiedText, summaryPoints } from "../data/mock"

export default function SmartSimplifier() {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const simplify = () => {
    setLoading(true)
    setDone(false)
    // Simulasi proses AI dengan sedikit jeda.
    setTimeout(() => {
      setLoading(false)
      setDone(true)
    }, 900)
  }

  const wc = (t: string) => t.trim().split(/\s+/).length

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
          <Button onClick={simplify} disabled={loading}>
            {loading ? "Menyederhanakan…" : "Sederhanakan Teks"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Card className={done ? "border-brand" : ""}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-ink"><IconSparkle width={17} height={17} className="text-brand" /> Teks yang Disederhanakan</h2>
            {done && <Badge tone="good"><IconCheck width={13} height={13} /> Tingkat Kesulitan: Mudah</Badge>}
          </div>
          {done ? (
            <>
              <div className="reading-area text-ink">{simplifiedText}</div>
              <div className="mt-4 text-xs text-ink-mute">{wc(simplifiedText)} kata</div>
            </>
          ) : (
            <div className="grid h-full min-h-40 place-items-center text-center text-sm text-ink-mute">
              {loading ? "AI sedang menyederhanakan teks…" : "Tekan \"Sederhanakan Teks\" untuk melihat versi yang lebih mudah dibaca."}
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-brand-soft">
        <SectionTitle
          icon={<IconClipboard width={18} height={18} />}
          title="Ringkasan Otomatis"
          action={<span className="text-sm text-ink-soft">Bacaan: {demoTitle}</span>}
        />
        {done ? (
          <ul className="space-y-2">
            {summaryPoints.map((p) => (
              <li key={p} className="flex gap-3 font-dyslexic text-ink">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">Ringkasan ide utama akan muncul di sini setelah teks disederhanakan.</p>
        )}
        {done && (
          <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-strong hover:underline-offset-2">
            Salin Ringkasan <IconArrow width={15} height={15} />
          </button>
        )}
      </Card>
    </div>
  )
}
