"use client"

import type { ReactNode } from "react"
import { cx } from "./cx"

export function Card({
  className,
  children,
  as: Tag = "div",
  onClick,
  hover = false,
  variant = "default",
}: {
  className?: string
  children: ReactNode
  as?: "div" | "article" | "section"
  onClick?: () => void
  hover?: boolean
  /** "reading" = latar/teks ramah disleksia (--reading-bg / --reading-fg) */
  variant?: "default" | "reading"
}) {
  return (
    <Tag
      onClick={onClick}
      className={cx(
        "rounded-[var(--radius-card)] border p-5",
        "shadow-[var(--shadow-xs)]",
        variant === "reading"
          ? "reading-surface border-[color-mix(in_srgb,var(--reading-fg)_18%,transparent)]"
          : "border-line bg-surface",
        hover && "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-brand/40",
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (label) {
    return (
      <div className={cx("flex items-center gap-3", className)}>
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-widest text-ink-mute">{label}</span>
        <div className="h-px flex-1 bg-line" />
      </div>
    )
  }
  return <hr className={cx("border-0 border-t border-line", className)} />
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="mt-0.5 text-brand">{icon}</span>}
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-sm text-ink-mute">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
