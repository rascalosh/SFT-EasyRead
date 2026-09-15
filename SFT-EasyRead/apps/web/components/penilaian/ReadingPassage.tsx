"use client"

import { useState, type ReactNode } from "react"
import { Card, Button, cx } from "@/components/shared/ui"
import { IconBook, IconChevronDown, IconChevronUp, IconInfo, IconSpeaker, IconSpeakerOff } from "@/components/shared/icons"
import { FocusRulerSentences } from "@/components/shared/FocusRulerSentences"
import { useReadingSettings } from "@/lib/use-reading-settings"
import { tokenizeWords } from "@/lib/tts-sync"

/** Perkiraan kecepatan baca nyaring yang nyaman (kata per menit). */
const READ_ALOUD_WPM = 100

export function passageStats(paragraphs: string[]) {
  const words = tokenizeWords(paragraphs.join(" ")).length
  const minutes = Math.max(1, Math.round(words / READ_ALOUD_WPM))
  return { words, minutes }
}

/**
 * Teks bacaan untuk penilaian. Selalu memakai font, ukuran, jarak, dan warna
 * kontras dari Pengaturan; bisa dibacakan (TTS) dan disorot per kalimat.
 */
export function ReadingPassage({
  title,
  paragraphs,
  label = "Teks Bacaan",
  speaking = false,
  onToggleListen,
  listenLabel = "Dengarkan contoh",
  collapsible = false,
  defaultOpen = true,
  focusRuler: focusRulerProp,
  note,
  action,
  className,
}: {
  title: string
  paragraphs: string[]
  label?: string
  speaking?: boolean
  onToggleListen?: () => void
  listenLabel?: string
  collapsible?: boolean
  defaultOpen?: boolean
  /** Paksa penggaris fokus nyala/mati; default mengikuti Pengaturan. */
  focusRuler?: boolean
  /** Catatan singkat di atas teks, mis. penjelasan teks dipendekkan. */
  note?: string
  action?: ReactNode
  className?: string
}) {
  const { settings } = useReadingSettings()
  const [open, setOpen] = useState(defaultOpen)
  const { words, minutes } = passageStats(paragraphs)
  const focusRuler = focusRulerProp ?? settings.focusRuler
  const visible = !collapsible || open

  return (
    <Card variant="reading" className={cx("animate-fade-in", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--reading-fg)_10%,transparent)]">
            <IconBook width={18} height={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="truncate font-semibold">{title}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-70">
            {words} kata · ± {minutes} menit
          </span>
          {onToggleListen && (
            <Button
              type="button"
              size="sm"
              variant={speaking ? "primary" : "outline"}
              onClick={onToggleListen}
              aria-pressed={speaking}
              className={cx(!speaking && "!bg-transparent !text-inherit border-current/30 hover:!text-inherit")}
            >
              {speaking ? <IconSpeakerOff width={15} height={15} /> : <IconSpeaker width={15} height={15} />}
              {speaking ? "Berhenti" : listenLabel}
            </Button>
          )}
          {action}
          {collapsible && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="!bg-transparent !text-inherit border-current/30 hover:!text-inherit"
            >
              {open ? <IconChevronUp width={15} height={15} /> : <IconChevronDown width={15} height={15} />}
              {open ? "Sembunyikan" : "Lihat bacaan"}
            </Button>
          )}
        </div>
      </div>

      {visible && (
        <div className="mt-4 border-t border-[color-mix(in_srgb,var(--reading-fg)_15%,transparent)] pt-4">
          {note && (
            <p className="mb-4 flex items-start gap-2 rounded-lg bg-[color-mix(in_srgb,var(--reading-fg)_8%,transparent)] px-3 py-2 text-sm">
              <IconInfo width={16} height={16} className="mt-0.5 shrink-0" aria-hidden />
              <span>{note}</span>
            </p>
          )}
          {paragraphs.length === 0 ? (
            <p className="font-dyslexic opacity-70">Teks bacaan belum tersedia untuk materi ini.</p>
          ) : (
            <FocusRulerSentences
              blocks={paragraphs}
              enabled={focusRuler}
              mode={settings.focusRulerMode}
              layoutKey={`${settings.fontSize}-${settings.letterSpacing}-${settings.readingFont}-${settings.contrastId}`}
              className="reading-area !max-w-none !bg-transparent !p-0"
            />
          )}
          {focusRuler && paragraphs.length > 0 && (
            <p className="mt-3 text-xs opacity-60">
              Ketuk kalimat untuk menyorotnya agar mata tidak kehilangan baris.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
