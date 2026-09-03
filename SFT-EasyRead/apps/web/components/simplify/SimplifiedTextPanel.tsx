"use client"

import { Badge, Card } from "@/components/shared/ui"
import { IconSparkle } from "@/components/shared/icons"

export function SimplifiedTextPanel({
  text,
  loading,
  done,
}: {
  text: string
  loading: boolean
  done: boolean
}) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <Card className={done ? "border-brand" : ""}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <IconSparkle width={17} height={17} className="text-brand" /> Teks yang Disederhanakan
        </h2>
        {done && (
          <Badge tone="good">Tingkat Kesulitan: Mudah</Badge>
        )}
      </div>
      {done ? (
        <>
          <div className="reading-area text-ink">{text}</div>
          <div className="mt-4 text-xs text-ink-mute">{wordCount} kata</div>
        </>
      ) : (
        <div className="grid h-full min-h-40 place-items-center text-center text-sm text-ink-mute">
          {loading ? "AI sedang menyederhanakan teks…" : "Tekan \"Sederhanakan Teks\" untuk melihat versi yang lebih mudah dibaca."}
        </div>
      )}
    </Card>
  )
}
