"use client"

import { Card } from "@/components/shared/ui"
import { KincaidInline, type KincaidReading } from "./KincaidScore"

export function OriginalTextPanel({
  text,
  onChange,
  kincaid = null,
}: {
  text: string
  onChange: (value: string) => void
  kincaid?: KincaidReading | null
}) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <Card variant="reading" className="flex min-h-64 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-ink">Teks Asli</h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-mute">
          <KincaidInline reading={kincaid} />
          {kincaid && <span aria-hidden>·</span>}
          <span>{wordCount} kata</span>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tempel atau ketik teks yang ingin dibaca lebih mudah…"
        className="reading-area min-h-40 w-full flex-1 resize-y border border-[color-mix(in_srgb,var(--reading-fg)_18%,transparent)] !mt-0 !max-w-none !p-4 placeholder:opacity-50 outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </Card>
  )
}
