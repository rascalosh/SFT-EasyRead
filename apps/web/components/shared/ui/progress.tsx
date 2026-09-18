"use client"

import { cx } from "./cx"

export type Tone = "brand" | "good" | "warn" | "error" | "amber" | "lavender"

const toneFill: Record<Tone, string> = {
  brand:    "bg-brand",
  good:     "bg-[var(--color-good)]",
  warn:     "bg-[var(--color-warn)]",
  error:    "bg-[var(--color-error)]",
  amber:    "bg-[var(--color-amber)]",
  lavender: "bg-[var(--color-lavender)]",
}

export function ProgressBar({
  value,
  tone = "brand",
  size = "sm",
  animated = false,
  className,
}: {
  value: number
  tone?: Tone
  size?: "xs" | "sm" | "md"
  animated?: boolean
  className?: string
}) {
  const heights = { xs: "h-1", sm: "h-2", md: "h-3" }
  return (
    <div className={cx("w-full overflow-hidden rounded-full bg-[var(--color-line-soft)]", heights[size], className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cx(
          "h-full rounded-full transition-[width] duration-500",
          toneFill[tone],
          animated && "animate-[loading-bar_2.2s_ease-in-out_forwards]",
        )}
        style={animated ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 56,
  tone = "brand",
  label,
}: {
  value: number
  size?: number
  tone?: Tone
  label?: string
}) {
  const radius = (size - 6) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ
  const strokeColors: Record<Tone, string> = {
    brand: "stroke-brand",
    good: "stroke-[var(--color-good)]",
    warn: "stroke-[var(--color-warn)]",
    error: "stroke-[var(--color-error)]",
    amber: "stroke-[var(--color-amber)]",
    lavender: "stroke-[var(--color-lavender)]",
  }
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-line-soft)" strokeWidth="5" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth="5" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={cx("transition-[stroke-dashoffset] duration-500", strokeColors[tone])}
        />
      </svg>
      {label && (
        <span className="absolute font-mono text-[11px] font-semibold text-ink">{label}</span>
      )}
    </div>
  )
}

export function ScoreMeter({
  label,
  score,
  note,
  className,
}: {
  label: string
  score: number
  note?: string
  className?: string
}) {
  const tone: Tone = score >= 85 ? "good" : score >= 65 ? "brand" : "warn"
  const toneTxt: Record<Tone, string> = {
    good: "text-[var(--color-good)]", brand: "text-brand",
    warn: "text-[var(--color-warn)]", error: "text-[var(--color-error)]",
    amber: "text-[var(--color-amber)]", lavender: "text-[var(--color-lavender)]",
  }
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className={cx("font-mono text-sm font-semibold tabular-nums", toneTxt[tone])}>
          {score}<span className="font-normal text-ink-mute">/100</span>
        </span>
      </div>
      <ProgressBar value={score} tone={tone} />
      {note && <p className="mt-1 text-xs text-ink-mute">{note}</p>}
    </div>
  )
}
