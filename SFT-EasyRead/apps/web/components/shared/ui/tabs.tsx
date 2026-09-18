"use client"

import type { ReactNode } from "react"
import { cx } from "./cx"

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cx("inline-flex rounded-xl border border-line bg-surface p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          role="tab"
          aria-selected={value === t.id}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150",
            value === t.id
              ? "bg-brand text-[var(--color-brand-ink)] shadow-[var(--shadow-xs)]"
              : "text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink",
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth = false,
}: {
  options: { value: T; label: string; disabled?: boolean }[]
  value: T
  onChange: (v: T) => void
  fullWidth?: boolean
}) {
  return (
    <div className={cx(
      "flex rounded-xl border border-line bg-[var(--color-canvas)] p-1 gap-1",
      fullWidth && "w-full",
    )}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            if (o.disabled) return
            onChange(o.value)
          }}
          disabled={o.disabled}
          aria-pressed={value === o.value}
          title={o.disabled ? "Belum ada. Buat dulu di Simplify." : undefined}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
            fullWidth && "flex-1",
            o.disabled && "cursor-not-allowed opacity-40",
            value === o.value
              ? "bg-surface text-ink shadow-[var(--shadow-xs)]"
              : "text-ink-mute hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
