"use client"

// EasyRead AI — Design System Components
// Semua komponen aksesibel: status selalu ikon + label, tidak hanya warna.
import { useState, useRef, useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react"
import { IconCheck, IconWarning, IconError, IconInfo, IconClose, IconChevronDown, IconCheckCircle } from "./icons"

/* ──────────────────────────────────────────────────────────────────
   UTILITY
────────────────────────────────────────────────────────────────── */

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

/* ──────────────────────────────────────────────────────────────────
   LAYOUT
────────────────────────────────────────────────────────────────── */

export function Card({
  className,
  children,
  as: Tag = "div",
  onClick,
  hover = false,
}: {
  className?: string
  children: ReactNode
  as?: "div" | "article" | "section"
  onClick?: () => void
  hover?: boolean
}) {
  return (
    <Tag
      onClick={onClick}
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-surface p-5",
        "shadow-[var(--shadow-xs)]",
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

/* ──────────────────────────────────────────────────────────────────
   BUTTONS
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   PROGRESS & METERS
────────────────────────────────────────────────────────────────── */

type Tone = "brand" | "good" | "warn" | "error" | "amber" | "lavender"

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

/* ──────────────────────────────────────────────────────────────────
   BADGES & CHIPS
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   TABS & SEGMENTED CONTROL
────────────────────────────────────────────────────────────────── */

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
  options: { value: T; label: string }[]
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
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
            fullWidth && "flex-1",
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

/* ──────────────────────────────────────────────────────────────────
   FORM INPUTS
────────────────────────────────────────────────────────────────── */

type InputStatus = "default" | "error" | "success"

const inputStatusRing: Record<InputStatus, string> = {
  default: "border-line focus:border-brand focus:ring-2 focus:ring-brand/20",
  error:   "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20",
  success: "border-[var(--color-good)] focus:border-[var(--color-good)] focus:ring-2 focus:ring-[var(--color-good)]/20",
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  success?: string
  icon?: ReactNode
  iconRight?: ReactNode
  status?: InputStatus
}

export function Input({
  label,
  hint,
  error,
  success,
  icon,
  iconRight,
  status,
  className,
  id,
  ...rest
}: InputProps) {
  const resolvedStatus: InputStatus = error ? "error" : success ? "success" : status ?? "default"
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {rest.required && <span className="ml-1 text-[var(--color-error)]" aria-hidden>*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cx(
            "w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute",
            "outline-none transition-all duration-150",
            "disabled:bg-[var(--color-disabled)] disabled:text-[var(--color-disabled-fg)] disabled:cursor-not-allowed",
            inputStatusRing[resolvedStatus],
            icon ? "pl-10" : undefined,
            iconRight ? "pr-10" : undefined,
          )}
          aria-invalid={resolvedStatus === "error"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none">
            {iconRight}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="flex items-center gap-1 text-xs text-[var(--color-error)]">
          <IconError width={13} height={13} aria-hidden /> {error}
        </p>
      )}
      {success && !error && (
        <p className="flex items-center gap-1 text-xs text-[var(--color-good)]">
          <IconCheckCircle width={13} height={13} aria-hidden /> {success}
        </p>
      )}
      {hint && !error && !success && (
        <p id={`${inputId}-hint`} className="text-xs text-ink-mute">{hint}</p>
      )}
    </div>
  )
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
  charCount?: boolean
  maxLength?: number
}

export function Textarea({
  label,
  hint,
  error,
  charCount = false,
  maxLength,
  className,
  id,
  value,
  ...rest
}: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
  const len = typeof value === "string" ? value.length : 0
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        value={value}
        maxLength={maxLength}
        className={cx(
          "w-full resize-y rounded-xl border bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-mute",
          "outline-none transition-all duration-150 min-h-[100px]",
          error
            ? "border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
            : "border-line focus:border-brand focus:ring-2 focus:ring-brand/20",
        )}
        aria-invalid={!!error}
        {...rest}
      />
      <div className="flex items-start justify-between gap-2">
        {error ? (
          <p role="alert" className="flex items-center gap-1 text-xs text-[var(--color-error)]">
            <IconError width={13} height={13} aria-hidden /> {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-ink-mute">{hint}</p>
        ) : <span />}
        {charCount && maxLength && (
          <span className={cx("shrink-0 font-mono text-xs tabular-nums", len >= maxLength ? "text-[var(--color-error)]" : "text-ink-mute")}>
            {len}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, hint, error, options, className, id, ...rest }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">{label}</label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={cx(
            "w-full appearance-none rounded-xl border bg-surface px-4 py-2.5 pr-10 text-sm text-ink",
            "outline-none transition-all duration-150 cursor-pointer",
            error
              ? "border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
              : "border-line focus:border-brand focus:ring-2 focus:ring-brand/20",
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute">
          <IconChevronDown width={18} height={18} />
        </span>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs text-[var(--color-error)]">
          <IconError width={13} height={13} aria-hidden /> {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-ink-mute">{hint}</p>}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   TOGGLE / SWITCH
────────────────────────────────────────────────────────────────── */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: "sm" | "md"
}) {
  const sizes = {
    sm: { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" },
    md: { track: "h-6 w-11", thumb: "h-5 w-5", translate: "translate-x-5" },
  }
  const s = sizes[size]
  const id = `toggle-${label?.toLowerCase().replace(/\s+/g, "-") ?? Math.random()}`
  return (
    <label
      htmlFor={id}
      className={cx("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-50")}
    >
      <div className="relative mt-0.5 flex-none">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          onClick={() => !disabled && onChange(!checked)}
          className={cx(
            "flex items-center rounded-full transition-colors duration-200 p-[2px]",
            s.track,
            checked ? "bg-brand" : "bg-[var(--color-line)]",
          )}
        >
          <span
            className={cx(
              "rounded-full bg-[var(--color-surface-raised)] shadow-sm transition-transform duration-200",
              s.thumb,
              checked ? s.translate : "translate-x-0",
            )}
          />
        </div>
      </div>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-ink leading-tight">{label}</p>}
          {description && <p className="mt-0.5 text-xs text-ink-mute">{description}</p>}
        </div>
      )}
    </label>
  )
}

/* ──────────────────────────────────────────────────────────────────
   SLIDER
────────────────────────────────────────────────────────────────── */

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  hint,
  showTicks = false,
  tickLabels,
}: {
  label?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  hint?: string
  showTicks?: boolean
  tickLabels?: string[]
}) {
  const id = `slider-${label?.toLowerCase().replace(/\s+/g, "-") ?? Math.random()}`
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-baseline justify-between">
          <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
          <span className="font-mono text-sm font-semibold text-brand tabular-nums">
            {value}{unit && <span className="text-ink-mute font-normal text-xs ml-0.5">{unit}</span>}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
      {showTicks && tickLabels && (
        <div className="flex justify-between">
          {tickLabels.map((t) => (
            <span key={t} className="text-xs text-ink-mute">{t}</span>
          ))}
        </div>
      )}
      {hint && <p className="text-xs text-ink-mute">{hint}</p>}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   RADIO & CHECKBOX
────────────────────────────────────────────────────────────────── */

export function Radio({
  label,
  description,
  name,
  value,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  name: string
  value: string
  checked: boolean
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-50")}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-[var(--color-brand)]"
      />
      <div>
        <p className="text-sm font-medium text-ink leading-tight">{label}</p>
        {description && <p className="mt-0.5 text-xs text-ink-mute">{description}</p>}
      </div>
    </label>
  )
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  indeterminate = false,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <label className={cx("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-50")}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none cursor-pointer rounded accent-[var(--color-brand)]"
      />
      <div>
        <p className="text-sm font-medium text-ink leading-tight">{label}</p>
        {description && <p className="mt-0.5 text-xs text-ink-mute">{description}</p>}
      </div>
    </label>
  )
}

/* ──────────────────────────────────────────────────────────────────
   ALERTS & FEEDBACK
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   SKELETON
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   AVATAR
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   STAT CARD
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   EMPTY STATE
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   KBD / KEYBOARD SHORTCUT
────────────────────────────────────────────────────────────────── */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-xs text-ink-soft shadow-[var(--shadow-xs)]">
      {children}
    </kbd>
  )
}

/* ──────────────────────────────────────────────────────────────────
   TOOLTIP
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   STEP INDICATOR
────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────
   READING OVERLAY PICKER (accessibility control)
────────────────────────────────────────────────────────────────── */

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

