"use client"

import { Card, SectionTitle } from "@/components/shared/ui"
import { IconClipboard, IconArrow } from "@/components/shared/icons"
import { summaryReaderNotes, type SummaryView } from "@/lib/ai-result"
import { KincaidScoreStrip, type KincaidReading } from "./KincaidScore"

export function SummaryCard({
  title,
  points,
  done,
  onCopy,
  view,
  originalKincaid = null,
  summaryKincaid = null,
}: {
  title: string
  points: string[]
  done: boolean
  onCopy?: () => void
  view?: SummaryView | null
  originalKincaid?: KincaidReading | null
  summaryKincaid?: KincaidReading | null
}) {
  const summary = view?.summary?.trim() ?? ""
  const hasContent = Boolean(summary) || points.length > 0
  const notes = done && hasContent ? summaryReaderNotes(view) : []

  return (
    <Card variant="reading">
      <SectionTitle
        icon={<IconClipboard width={18} height={18} />}
        title="Inti singkat"
        subtitle="Hanya ide utama, bukan seluruh teks."
        action={<span className="text-sm opacity-70">Bacaan: {title}</span>}
      />
      {done && hasContent ? (
        <div className="font-dyslexic space-y-4">
          {summary && <p className="leading-relaxed">{summary}</p>}
          {points.length > 0 && (
            <ul className="space-y-3">
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
          )}
        </div>
      ) : (
        <p className="font-dyslexic text-sm opacity-70">
          Inti singkat akan muncul di sini setelah bacaan mudah dibuat.
        </p>
      )}
      {notes.length > 0 && (
        <p className="mt-4 font-dyslexic text-sm text-ink-soft">
          {notes.map((note) => (
            <span key={note} className="block">{note}</span>
          ))}
        </p>
      )}
      {done && hasContent && (
        <div className="mt-4">
          <KincaidScoreStrip
            before={originalKincaid}
            after={summaryKincaid}
            afterLabel="Inti singkat"
          />
        </div>
      )}
      {done && hasContent && (
        <button
          type="button"
          onClick={onCopy}
          className="mt-4 inline-flex items-center gap-1 text-sm font-bold hover:opacity-80"
        >
          Salin inti singkat <IconArrow width={15} height={15} />
        </button>
      )}
    </Card>
  )
}
