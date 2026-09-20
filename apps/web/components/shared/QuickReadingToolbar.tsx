"use client"

import { useState } from "react"
import { IconButton, cx } from "@/components/shared/ui"
import { IconSliders, IconClose, IconTextSize } from "@/components/shared/icons"
import { READING_CONTRAST_OPTIONS, type ReadingContrastId } from "@/lib/session"

/**
 * Panel cepat mengambang di layar baca — cuma dua kontrol yang paling sering
 * diubah sambil membaca (ukuran teks, warna latar), supaya tidak perlu
 * bolak-balik ke Pengaturan lengkap di bawah/menu lain.
 */
export function QuickReadingToolbar({
  fontSize,
  onFontSizeChange,
  contrastId,
  onContrastChange,
  className,
}: {
  fontSize: number
  onFontSizeChange: (size: number) => void
  contrastId: ReadingContrastId
  onContrastChange: (id: ReadingContrastId) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cx("fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3", className)}>
      {open && (
        <div className="w-64 rounded-2xl border border-line bg-surface-raised p-4 shadow-[var(--shadow-lg)] animate-[fade-in_150ms_ease-out_both]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-mute">Tampilan Cepat</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup tampilan cepat"
              className="text-ink-mute hover:text-ink"
            >
              <IconClose width={14} height={14} />
            </button>
          </div>

          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
            <IconTextSize width={14} height={14} /> Ukuran Teks · {fontSize}px
          </label>
          <input
            type="range"
            min={16}
            max={30}
            value={fontSize}
            onChange={(e) => onFontSizeChange(+e.target.value)}
            className="mb-4 w-full accent-[var(--color-brand)]"
          />

          <label className="mb-1.5 block text-xs font-semibold text-ink">Warna Latar</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kontras teks dan latar">
            {READING_CONTRAST_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-label={option.label}
                aria-checked={contrastId === option.id}
                onClick={() => onContrastChange(option.id)}
                className={cx(
                  "grid h-8 w-8 place-items-center rounded-full border-2 text-[10px] font-bold transition-transform",
                  contrastId === option.id ? "scale-110 border-brand" : "border-line",
                )}
                style={{ backgroundColor: option.background, color: option.text }}
              >
                Aa
              </button>
            ))}
          </div>
        </div>
      )}

      <IconButton
        label={open ? "Tutup tampilan cepat" : "Tampilan cepat"}
        variant="primary"
        size="lg"
        rounded="full"
        icon={open ? <IconClose aria-hidden /> : <IconSliders aria-hidden />}
        onClick={() => setOpen((v) => !v)}
        className="shadow-[var(--shadow-lg)]"
      />
    </div>
  )
}
