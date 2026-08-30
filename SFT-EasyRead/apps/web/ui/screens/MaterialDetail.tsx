"use client"

import { useEffect, useState, type ReactElement } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { hrefFor, type ScreenId } from "../nav"
import { demoParagraphs, findMaterial, readingHistory, type ReadingHistory } from "../data/mock"
import { cx } from "../components/ui"
import {
  IconSparkle, IconWave, IconLetters,
  IconArrow, IconBook,
} from "../components/icons"

type Tool = {
  id: ScreenId
  icon: ReactElement
  title: string
  subtitle: string
  body: string
  color: { bg: string; text: string; border: string }
}

const tools: Tool[] = [
  {
    id: "simplify",
    icon: <IconSparkle width={26} height={26} />,
    title: "Simplify & Ringkasan",
    subtitle: "AI menyederhanakan teks",
    body: "Teks dipecah jadi kalimat pendek dan ringkas agar lebih mudah dipahami. Tersedia juga ringkasan poin utama.",
    color: {
      bg: "bg-brand-soft",
      text: "text-brand-strong",
      border: "border-brand/20 hover:border-brand/60",
    },
  },
  {
    id: "tracking",
    icon: <IconWave width={26} height={26} />,
    title: "Multisensory Tracking",
    subtitle: "Dengar, lihat, ikuti",
    body: "Setiap kata disorot saat dibacakan. Bantu otak menyinkronkan bunyi dan tulisan secara bersamaan.",
    color: {
      bg: "bg-[var(--color-lavender-soft)]",
      text: "text-[var(--color-lavender)]",
      border: "border-[var(--color-lavender)]/20 hover:border-[var(--color-lavender)]/50",
    },
  },
  {
    id: "syllable",
    icon: <IconLetters width={26} height={26} />,
    title: "Latihan Kata (Syllable)",
    subtitle: "Pecah suku kata",
    body: "Kata panjang dipecah jadi suku kata kecil. Latih pengucapan satu suku kata per ketukan.",
    color: {
      bg: "bg-[var(--color-amber-soft)]",
      text: "text-[var(--color-amber)]",
      border: "border-[var(--color-amber)]/20 hover:border-[var(--color-amber)]/50",
    },
  },
]

export default function MaterialDetail() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === "string" ? params.id : ""
  const known = readingHistory.find((item) => item.id === id)
  const [material, setMaterial] = useState<ReadingHistory | undefined>(known)

  useEffect(() => {
    setMaterial(findMaterial(id) ?? known)
  }, [id, known])

  if (!material) {
    return (
      <p className="text-ink-soft">
        Materi tidak ditemukan.{" "}
        <Link href={hrefFor("home")} className="font-semibold text-brand">
          Kembali ke Materi Baru
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-8 animate-[fade-in_300ms_ease-out_both]">

      {/* ── Material header card ── */}
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <IconBook width={22} height={22} />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-heading-2 text-ink">{material.title}</h1>
            <div className="reading-area mt-3 text-ink">
              {demoParagraphs.map((p, i) => (
                <p key={i} className="text-ink">{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tool picker ── */}
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-mute">
          Pilih aktivitas
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={hrefFor(tool.id)}
              className={cx(
                "group flex flex-col rounded-[var(--radius-card)] border bg-surface p-5 text-left",
                "transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]",
                tool.color.border,
              )}
            >
              {/* Icon */}
              <span className={cx(
                "mb-4 grid h-13 w-13 place-items-center rounded-xl",
                tool.color.bg, tool.color.text,
              )}>
                {tool.icon}
              </span>

              {/* Text */}
              <p className="text-[15px] font-semibold text-ink leading-snug">{tool.title}</p>
              <p className="mt-0.5 text-xs font-medium text-ink-mute">{tool.subtitle}</p>
              <p className="mt-2 flex-1 text-sm text-ink-soft leading-relaxed">{tool.body}</p>

              {/* CTA */}
              <span className={cx(
                "mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
                tool.color.text,
              )}>
                Mulai <IconArrow width={15} height={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
