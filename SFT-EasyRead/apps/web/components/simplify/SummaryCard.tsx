"use client"

import { Card, SectionTitle } from "@/components/shared/ui"
import { IconClipboard, IconArrow } from "@/components/shared/icons"

export function SummaryCard({
  title,
  points,
  done,
  onCopy,
}: {
  title: string
  points: string[]
  done: boolean
  onCopy?: () => void
}) {
  return (
    <Card variant="reading">
      <SectionTitle
        icon={<IconClipboard width={18} height={18} />}
        title="Ringkasan Otomatis"
        action={<span className="text-sm opacity-70">Bacaan: {title}</span>}
      />
      {done ? (
        <ul className="font-dyslexic space-y-3">
          {points.map((point) => (
            <li key={point} className="flex gap-3">
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--reading-fg)]"
                aria-hidden
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-dyslexic text-sm opacity-70">
          Ringkasan ide utama akan muncul di sini setelah teks disederhanakan.
        </p>
      )}
      {done && (
        <button
          type="button"
          onClick={onCopy}
          className="mt-4 inline-flex items-center gap-1 text-sm font-bold hover:opacity-80"
        >
          Salin Ringkasan <IconArrow width={15} height={15} />
        </button>
      )}
    </Card>
  )
}
