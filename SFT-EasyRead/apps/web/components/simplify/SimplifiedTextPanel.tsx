"use client"

import Link from "next/link"
import { Badge, Card } from "@/components/shared/ui"
import { IconSparkle } from "@/components/shared/icons"
import { MarkdownAnswer } from "@/components/shared/MarkdownAnswer"
import { simplifyReaderNotes, type SimplifyView } from "@/lib/ai-result"
import { SIMPLIFY_STYLE_OPTIONS, type SimplifyStyle } from "@/lib/session"
import { hrefFor } from "@/lib/nav"

export function SimplifiedTextPanel({
  text,
  loading,
  done,
  view,
  style = "plain",
}: {
  text: string
  loading: boolean
  done: boolean
  view?: SimplifyView | null
  /** Versi yang dipilih di Pengaturan; menentukan teks tunggu dan label. */
  style?: SimplifyStyle
}) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const notes = done ? simplifyReaderNotes(view) : []
  const markdown = style === "structured" ? view?.markdown?.trim() || null : null
  const showResult = done && (style === "structured" ? Boolean(markdown) : Boolean(text.trim()))
  const styleLabel = SIMPLIFY_STYLE_OPTIONS.find((option) => option.id === style)?.short ?? "Paragraf"
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)

  return (
    <Card className={done ? "border-brand" : ""} variant="reading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <IconSparkle width={17} height={17} /> Bacaan lebih mudah
          </h2>
          <p className="mt-0.5 text-xs opacity-70">
            {style === "structured"
              ? "Seluruh teks, disusun dengan judul, poin, dan kata kunci."
              : "Seluruh teks, dengan kata yang lebih mudah."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Link
            href={hrefFor("settings")}
            className="rounded-full border border-current/25 px-2.5 py-0.5 text-xs font-medium opacity-80 hover:opacity-100"
            title="Ubah versi di Pengaturan"
          >
            Versi: {styleLabel}
          </Link>
          {notes.map((note) => (
            <Badge key={note.text} tone={note.tone}>
              {note.text}
            </Badge>
          ))}
        </div>
      </div>
      {showResult ? (
        <>
          {markdown ? (
            <MarkdownAnswer markdown={markdown} />
          ) : (
            <div className="reading-area !max-w-none !bg-transparent !p-0">
              {paragraphs.length > 1 ? paragraphs.map((part, i) => <p key={i}>{part}</p>) : text}
            </div>
          )}
          <div className="mt-4 text-xs opacity-60">{wordCount} kata</div>
        </>
      ) : (
        <div className="grid h-full min-h-40 place-items-center text-center text-sm opacity-60">
          {loading
            ? style === "structured"
              ? "AI sedang menyusun bacaan terstruktur…"
              : "AI sedang menulis ulang bacaan agar lebih mudah…"
            : style === "structured"
              ? "Tekan \"Buat bacaan mudah\" untuk menyusun versi terstruktur (judul, poin, kata kunci)."
              : "Tekan \"Buat bacaan mudah\" untuk melihat seluruh teks dengan kata yang lebih mudah."}
        </div>
      )}
    </Card>
  )
}
