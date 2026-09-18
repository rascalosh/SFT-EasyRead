"use client"

import { cx } from "@/components/shared/ui"

export default function SettingsToggle({
  on,
  onToggle,
  label,
  desc,
}: {
  on: boolean
  onToggle: () => void
  label: string
  desc: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="text-xs text-ink-soft">{desc}</div>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={cx("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-brand" : "bg-[var(--color-line)]")}
      >
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-surface-raised transition-all", on ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  )
}
