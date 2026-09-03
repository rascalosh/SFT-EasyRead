"use client"

import type { ReactNode } from "react"
import { IconCheck } from "../icons"
import { cx } from "./cx"
import { Card } from "./layout"
import type { Tone } from "./progress"

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string
  name: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}) {
  const sizes = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base", xl: "h-16 w-16 text-xl" }
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div
      className={cx(
        "inline-flex items-center justify-center shrink-0 rounded-full bg-brand-soft font-semibold text-brand-strong overflow-hidden",
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  )
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  tone = "brand",
  className,
}: {
  label: string
  value: string | number
  unit?: string
  trend?: number
  trendLabel?: string
  icon?: ReactNode
  tone?: Tone
  className?: string
}) {
  const iconBg: Record<Tone, string> = {
    brand: "bg-brand-soft text-brand",
    good: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
    warn: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
    error: "bg-[var(--color-error-soft)] text-[var(--color-error)]",
    amber: "bg-[var(--color-amber-soft)] text-[var(--color-amber)]",
    lavender: "bg-[var(--color-lavender-soft)] text-[var(--color-lavender)]",
  }
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">{label}</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-ink">
            {value}
            {unit && <span className="ml-1 text-sm font-normal text-ink-soft">{unit}</span>}
          </p>
          {trend !== undefined && (
            <p className={cx(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              trend >= 0 ? "text-[var(--color-good)]" : "text-[var(--color-error)]",
            )}>
              <span aria-hidden>{trend >= 0 ? "↑" : "↓"}</span>
              <span className="sr-only">{trend >= 0 ? "Naik" : "Turun"}</span>
              {Math.abs(trend)}% {trendLabel}
            </p>
          )}
        </div>
        {icon && (
          <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", iconBg[tone])}>
            {icon}
          </span>
        )}
      </div>
    </Card>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-xs text-ink-soft shadow-[var(--shadow-xs)]">
      {children}
    </kbd>
  )
}

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <nav aria-label="Langkah" className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={cx(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                  done    && "bg-[var(--color-good)] text-[var(--color-good-ink)]",
                  active  && "bg-brand text-[var(--color-brand-ink)] shadow-[var(--shadow-brand)]",
                  !done && !active && "bg-[var(--color-line-soft)] text-ink-mute",
                )}
              >
                {done ? <IconCheck width={13} height={13} /> : i + 1}
              </span>
              <span className={cx(
                "hidden text-xs font-medium sm:block",
                active ? "text-ink" : done ? "text-ink-soft" : "text-ink-mute",
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cx(
                "h-px w-8 flex-1 rounded",
                done ? "bg-[var(--color-good)]" : "bg-[var(--color-line)]",
              )} aria-hidden />
            )}
          </div>
        )
      })}
    </nav>
  )
}

const overlayOptions = [
  { id: "cream",  label: "Krem",  bg: "var(--color-overlay-cream)",  ring: "#d4a96a" },
  { id: "peach",  label: "Persik", bg: "var(--color-overlay-peach)", ring: "#d4845e" },
  { id: "mint",   label: "Mint",  bg: "var(--color-overlay-mint)",   ring: "#5aab6a" },
  { id: "blue",   label: "Biru",  bg: "var(--color-overlay-blue)",   ring: "#4a82d4" },
  { id: "lilac",  label: "Ungu",  bg: "var(--color-overlay-lilac)",  ring: "#9b72d4" },
  { id: "yellow", label: "Kuning", bg: "var(--color-overlay-yellow)", ring: "#c9a82a" },
] as const

export type OverlayId = (typeof overlayOptions)[number]["id"]

export function OverlayPicker({
  value,
  onChange,
}: {
  value: OverlayId
  onChange: (id: OverlayId) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Warna latar membaca">
      {overlayOptions.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          aria-label={o.label}
          onClick={() => onChange(o.id)}
          className={cx(
            "h-8 w-8 rounded-full border-2 transition-all duration-150",
            value === o.id ? "scale-110 border-[3px]" : "border-transparent hover:scale-105",
          )}
          style={{ background: o.bg, borderColor: value === o.id ? o.ring : "transparent" }}
        />
      ))}
    </div>
  )
}
