"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cx } from "./cx"

type BtnVariant = "primary" | "soft" | "ghost" | "outline" | "danger"
type BtnSize = "xs" | "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-brand text-[var(--color-brand-ink)] hover:bg-brand-strong shadow-[var(--shadow-brand)] hover:shadow-[var(--shadow-lg)]",
  soft:    "bg-brand-soft text-brand-strong hover:bg-[var(--color-brand-softer)] border border-brand/20",
  ghost:   "text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink",
  outline: "border border-line bg-surface text-ink hover:border-brand hover:text-brand",
  danger:  "bg-[var(--color-error)] text-[var(--color-error-ink)] hover:bg-[var(--color-error-strong)]",
}

const btnSizes: Record<BtnSize, string> = {
  xs: "px-2.5 py-1 text-xs gap-1.5 rounded-lg",
  sm: "px-3 py-1.5 text-sm gap-1.5 rounded-xl",
  md: "px-4 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-6 py-3 text-base gap-2 rounded-xl",
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        btnVariants[variant],
        btnSizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: BtnVariant
  size?: "sm" | "md" | "lg"
  icon: ReactNode
  rounded?: "md" | "full"
}

const iconBtnSizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  icon,
  rounded = "md",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "inline-grid place-items-center transition-all duration-150",
        "active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        btnVariants[variant],
        iconBtnSizes[size],
        rounded === "full" ? "rounded-full" : "rounded-xl",
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
}
