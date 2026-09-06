"use client"

import { useState, type ReactNode } from "react"
import { IconCheckCircle, IconClose, IconError, IconInfo, IconWarning } from "../icons"
import { cx } from "./cx"
import { Card } from "./layout"

type AlertTone = "info" | "good" | "warn" | "error"

const alertStyles: Record<AlertTone, { wrap: string; icon: ReactNode }> = {
  info:  { wrap: "bg-brand-soft border-brand/30 text-brand-strong", icon: <IconInfo width={16} height={16} aria-hidden /> },
  good:  { wrap: "bg-[var(--color-good-soft)] border-[var(--color-good)]/30 text-[var(--color-good-strong)]", icon: <IconCheckCircle width={16} height={16} aria-hidden /> },
  warn:  { wrap: "bg-[var(--color-warn-soft)] border-[var(--color-warn)]/30 text-[var(--color-warn-strong)]", icon: <IconWarning width={16} height={16} aria-hidden /> },
  error: { wrap: "bg-[var(--color-error-soft)] border-[var(--color-error)]/30 text-[var(--color-error-strong)]", icon: <IconError width={16} height={16} aria-hidden /> },
}

export function Alert({
  tone = "info",
  title,
  children,
  onClose,
  className,
}: {
  tone?: AlertTone
  title?: string
  children: ReactNode
  onClose?: () => void
  className?: string
}) {
  const { wrap, icon } = alertStyles[tone]
  return (
    <div role="alert" className={cx("flex gap-3 rounded-xl border p-4", wrap, className)}>
      <span className="mt-0.5 flex-none">{icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Tutup" className="flex-none opacity-60 hover:opacity-100 transition-opacity">
          <IconClose width={16} height={16} />
        </button>
      )}
    </div>
  )
}

export function Skeleton({
  width,
  height = 16,
  className,
  circle = false,
}: {
  width?: number | string
  height?: number | string
  className?: string
  circle?: boolean
}) {
  return (
    <span
      aria-hidden
      className={cx("skeleton block", circle && "rounded-full", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: circle ? "50%" : undefined,
      }}
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <Skeleton height={20} width="60%" className="mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? "40%" : "100%"} className="mb-2" />
      ))}
    </Card>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx("flex flex-col items-center justify-center gap-4 py-12 text-center", className)}>
      {icon && (
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-line-soft)] text-ink-mute">
          {icon}
        </span>
      )}
      <div className="max-w-xs">
        <p className="font-semibold text-ink">{title}</p>
        {body && <p className="mt-1 text-sm text-ink-mute">{body}</p>}
      </div>
      {action}
    </div>
  )
}

export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string
  children: ReactNode
  side?: "top" | "bottom" | "left" | "right"
}) {
  const [visible, setVisible] = useState(false)
  const positions = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  }
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cx(
            "pointer-events-none absolute z-[var(--z-tooltip)] whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-[var(--color-brand-ink)] shadow-[var(--shadow-md)]",
            "animate-[fade-in_120ms_ease-out_both]",
            positions[side],
          )}
        >
          {label}
        </div>
      )}
    </div>
  )
}
