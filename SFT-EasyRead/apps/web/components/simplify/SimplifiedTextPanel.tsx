"use client"

import { Badge, Card } from "@/components/shared/ui"
import { IconSparkle } from "@/components/shared/icons"
import { simplifyReaderNotes, type SimplifyView } from "@/lib/ai-result"

export function SimplifiedTextPanel({
  text,
  loading,
  done,
  view,
}: {
  text: string
  loading: boolean
  done: boolean
  view?: SimplifyView | null
}) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const notes = done ? simplifyReaderNotes(view) : []

  return (
    <Card className={done ? "border-brand" : ""} variant="reading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <IconSparkle width={17} height={17} /> Teks yang Disederhanakan
        </h2>
        {notes.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {notes.map((note) => (
              <Badge key={note.text} tone={note.tone}>
                {note.text}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {done ? (
        <>
          <div className="reading-area !max-w-none !bg-transparent !p-0">{text}</div>
          <div className="mt-4 text-xs opacity-60">{wordCount} kata</div>
        </>
      ) : (
        <div className="grid h-full min-h-40 place-items-center text-center text-sm opacity-60">
          {loading ? "AI sedang menyederhanakan teks…" : "Tekan \"Sederhanakan Teks\" untuk melihat versi yang lebih mudah dibaca."}
        </div>
      )}
    </Card>
  )
}
