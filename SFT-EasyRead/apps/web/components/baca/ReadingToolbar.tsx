"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { cx, IconButton } from "@/components/shared/ui"
import {
  IconClose,
  IconLetters,
  IconMinus,
  IconPalette,
  IconPlus,
  IconSliders,
  IconSpacing,
  IconTextSize,
} from "@/components/shared/icons"
import { useReadingSettings } from "@/lib/use-reading-settings"
import {
  READING_CONTRAST_OPTIONS,
  READING_FONT_OPTIONS,
  wordSpacingFromLetter,
  type ReadingContrastId,
  type ReadingFontId,
} from "@/lib/session"

type ToolId = "overlay" | "font" | "size" | "spacing"

const TOOLS: { id: ToolId; label: string; icon: ReactNode }[] = [
  { id: "overlay", label: "Warna", icon: <IconPalette width={18} height={18} /> },
  { id: "font", label: "Font", icon: <IconLetters width={18} height={18} /> },
  { id: "size", label: "Ukuran", icon: <IconTextSize width={18} height={18} /> },
  { id: "spacing", label: "Jarak", icon: <IconSpacing width={18} height={18} /> },
]

const FONT_FAMILY: Record<ReadingFontId, string> = {
  atkinson: "var(--font-atkinson), sans-serif",
  opendyslexic: "var(--font-opendyslexic)",
  "open-sans": "var(--font-open-sans), Open Sans, sans-serif",
  arial: "Arial, Helvetica, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Verdana, sans-serif",
  trebuchet: "Trebuchet MS, Lucida Grande, sans-serif",
  calibri: "Calibri, Candara, Segoe UI, sans-serif",
  "century-gothic": "Century Gothic, AppleGothic, sans-serif",
  "comic-sans": "Comic Sans MS, Comic Sans, cursive, sans-serif",
}

function shortFontLabel(label: string) {
  return label.replace(" (default)", "")
}

export function ReadingToolbar() {
  const { settings, persist } = useReadingSettings()
  const contrastId = settings.contrastId
  const readingFont = settings.readingFont
  const fontSize = settings.fontSize
  const letterSpacing = settings.letterSpacing
  const onChange = persist

  const [open, setOpen] = useState(true)
  const [tool, setTool] = useState<ToolId | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  useEffect(() => {
    if (!open) setTool(null)
  }, [open])

  useEffect(() => {
    if (!tool) return

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return
      setTool(null)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTool(null)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [tool])

  function toggleTool(id: ToolId) {
    setOpen(true)
    setTool((current) => (current === id ? null : id))
  }

  const contrast = READING_CONTRAST_OPTIONS.find((option) => option.id === contrastId)
  const fontLabel = shortFontLabel(
    READING_FONT_OPTIONS.find((option) => option.id === readingFont)?.label ?? "Font",
  )

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 pr-20 left-0 right-0 lg:left-[var(--shell-sidebar)] lg:transition-[left] lg:duration-300 lg:ease-out"
    >
      <div className="pointer-events-auto w-full max-w-xl">
        {open && tool && (
          <div
            role="region"
            aria-labelledby={labelId}
            className="mb-2 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--color-surface-raised)_94%,transparent)] p-4 shadow-[var(--shadow-xl)] backdrop-blur-md"
          >
            {tool === "overlay" && (
              <OverlayPanel
                labelId={labelId}
                contrastId={contrastId}
                onChange={(id) => onChange({ contrastId: id })}
              />
            )}
            {tool === "font" && (
              <FontPanel
                labelId={labelId}
                readingFont={readingFont}
                onChange={(id) => onChange({ readingFont: id })}
              />
            )}
            {tool === "size" && (
              <SliderPanel
                labelId={labelId}
                title="Ukuran teks"
                valueLabel={`${fontSize}px`}
                min={16}
                max={30}
                step={1}
                value={fontSize}
                decreaseLabel="Kecilkan teks"
                increaseLabel="Besarkan teks"
                onChange={(value) => onChange({ fontSize: value })}
              />
            )}
            {tool === "spacing" && (
              <SliderPanel
                labelId={labelId}
                title="Jarak huruf"
                valueLabel={`${letterSpacing.toFixed(2)}em`}
                min={0.05}
                max={0.35}
                step={0.01}
                value={letterSpacing}
                decreaseLabel="Rapatkan huruf"
                increaseLabel="Lebarkan jarak huruf"
                hint={`Jarak kata ${wordSpacingFromLetter(letterSpacing).toFixed(2)}em (3.5×)`}
                onChange={(value) => onChange({ letterSpacing: value })}
              />
            )}
          </div>
        )}

        {open ? (
          <div
            role="toolbar"
            aria-label="Tampilan bacaan"
            className="flex items-center gap-1 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--color-surface-raised)_94%,transparent)] p-1.5 shadow-[var(--shadow-xl)] backdrop-blur-md"
          >
            {TOOLS.map((item) => {
              const selected = tool === item.id
              const extra =
                item.id === "overlay"
                  ? contrast?.label.split(" · ")[0]
                  : item.id === "font"
                    ? fontLabel
                    : item.id === "size"
                      ? `${fontSize}px`
                      : `${letterSpacing.toFixed(2)}em`
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  aria-expanded={selected}
                  onClick={() => toggleTool(item.id)}
                  className={cx(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 text-[11px] font-semibold transition-colors",
                    selected
                      ? "bg-brand text-[var(--color-brand-ink)]"
                      : "text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink",
                  )}
                >
                  {item.id === "overlay" ? (
                    <span
                      className="grid h-[18px] w-[18px] place-items-center rounded-full border border-current text-[8px] font-bold"
                      style={{
                        backgroundColor: contrast?.background,
                        color: contrast?.text,
                      }}
                      aria-hidden
                    >
                      Aa
                    </span>
                  ) : (
                    item.icon
                  )}
                  <span className="leading-tight">{item.label}</span>
                  <span className={cx("max-w-full truncate font-normal leading-tight", selected ? "opacity-80" : "text-ink-mute")}>
                    {extra}
                  </span>
                </button>
              )
            })}
            <IconButton
              label="Sembunyikan toolbar tampilan"
              variant="ghost"
              size="sm"
              className="shrink-0 self-start"
              icon={<IconClose width={16} height={16} />}
              onClick={() => {
                setTool(null)
                setOpen(false)
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-[color-mix(in_srgb,var(--color-surface-raised)_94%,transparent)] px-4 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-xl)] backdrop-blur-md hover:border-brand hover:text-brand"
            >
              <IconSliders width={16} height={16} />
              Tampilan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function OverlayPanel({
  labelId,
  contrastId,
  onChange,
}: {
  labelId: string
  contrastId: ReadingContrastId
  onChange: (id: ReadingContrastId) => void
}) {
  return (
    <div>
      <p id={labelId} className="mb-3 text-sm font-semibold text-ink">
        Warna overlay
      </p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Warna overlay bacaan">
        {READING_CONTRAST_OPTIONS.map((option) => {
          const selected = contrastId === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cx(
                "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all",
                selected
                  ? "border-brand outline outline-2 outline-brand -outline-offset-2"
                  : "border-line hover:border-brand/40",
              )}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-xs font-bold"
                style={{ backgroundColor: option.background, color: option.text }}
                aria-hidden
              >
                Aa
              </span>
              <span className="min-w-0 text-sm font-medium leading-snug text-ink">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FontPanel({
  labelId,
  readingFont,
  onChange,
}: {
  labelId: string
  readingFont: ReadingFontId
  onChange: (id: ReadingFontId) => void
}) {
  return (
    <div>
      <p id={labelId} className="mb-3 text-sm font-semibold text-ink">
        Font bacaan
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label="Font bacaan">
        {READING_FONT_OPTIONS.map((option) => {
          const selected = readingFont === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cx(
                "rounded-xl border px-3 py-2 text-left text-sm transition-all",
                selected
                  ? "border-brand bg-brand-soft font-semibold text-ink outline outline-2 outline-brand -outline-offset-2"
                  : "border-line text-ink-soft hover:border-brand/40 hover:text-ink",
              )}
              style={{ fontFamily: FONT_FAMILY[option.id] }}
            >
              {shortFontLabel(option.label)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SliderPanel({
  labelId,
  title,
  valueLabel,
  min,
  max,
  step,
  value,
  hint,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  labelId: string
  title: string
  valueLabel: string
  min: number
  max: number
  step: number
  value: number
  hint?: string
  decreaseLabel: string
  increaseLabel: string
  onChange: (value: number) => void
}) {
  const inputId = `${labelId}-range`

  function nudge(direction: -1 | 1) {
    const next = Number((value + direction * step).toFixed(2))
    onChange(Math.min(max, Math.max(min, next)))
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p id={labelId} className="text-sm font-semibold text-ink">
          {title}
        </p>
        <span className="font-mono text-sm font-semibold tabular-nums text-brand">{valueLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <IconButton
          label={decreaseLabel}
          variant="outline"
          size="sm"
          icon={<IconMinus width={14} height={14} />}
          onClick={() => nudge(-1)}
          disabled={value <= min}
        />
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[var(--color-brand)]"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-labelledby={labelId}
        />
        <IconButton
          label={increaseLabel}
          variant="outline"
          size="sm"
          icon={<IconPlus width={14} height={14} />}
          onClick={() => nudge(1)}
          disabled={value >= max}
        />
      </div>
      {hint && <p className="mt-2 text-xs text-ink-mute">{hint}</p>}
    </div>
  )
}
