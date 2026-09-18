"use client"

import type { ReactNode } from "react"
import { IconCheck, IconClose, IconWarning } from "../icons"
import { cx } from "./cx"

const badgeTones: Record<string, string> = {
  neutral:  "bg-[var(--color-line-soft)] text-ink-soft",
  brand:    "bg-brand-soft text-brand-strong border border-brand/20",
  good:     "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  warn:     "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
  error:    "bg-[var(--color-error-soft)] text-[var(--color-error)]",
  amber:    "bg-[var(--color-amber-soft)] text-[var(--color-amber)]",
  lavender: "bg-[var(--color-lavender-soft)] text-[var(--color-lavender)]",
}

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode
  tone?: keyof typeof badgeTones
  icon?: ReactNode
  className?: string
}) {
  return (
    <span className={cx(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
      badgeTones[tone],
      className,
    )}>
      {icon}
      {children}
    </span>
  )
}

export function NumberBadge({ count, max = 99 }: { count: number; max?: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-error)] px-1 font-mono text-[11px] font-semibold text-[var(--color-error-ink)]">
      {count > max ? `${max}+` : count}
    </span>
  )
}

export function StatusPill({ ok }: { ok: boolean }) {
  return ok ? (
    <Badge tone="good" icon={<IconCheck width={12} height={12} />}>Paham</Badge>
  ) : (
    <Badge tone="warn" icon={<IconWarning width={12} height={12} />}>Belum Paham</Badge>
  )
}

export function Chip({
  children,
  selected = false,
  onClick,
  icon,
  onRemove,
}: {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  icon?: ReactNode
  onRemove?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all duration-150",
        selected
          ? "border-brand bg-brand-soft text-brand-strong"
          : "border-line bg-surface text-ink-soft hover:border-brand/50 hover:text-ink",
      )}
    >
      {icon}
      {children}
      {onRemove && (
        <span
          role="button"
          aria-label="Hapus"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="ml-0.5 grid h-4 w-4 place-items-center rounded-full hover:bg-brand/20"
        >
          <IconClose width={10} height={10} />
        </span>
      )}
    </button>
  )
}
