"use client"

import { Card } from "@/components/shared/ui"

export function OriginalTextPanel({
  text,
  onChange,
}: {
  text: string
  onChange: (value: string) => void
}) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <Card className="flex min-h-64 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Teks Asli</h2>
        <span className="text-xs text-ink-mute">{wordCount} kata</span>
      </div>
      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tempel atau ketik teks yang ingin disederhanakan…"
        className="min-h-40 w-full flex-1 resize-y rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-mute outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </Card>
  )
}
