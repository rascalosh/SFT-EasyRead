"use client"

import { useEffect, useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react"
import { IconCheckCircle, IconChevronDown, IconError } from "../icons"
import { cx } from "./cx"

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
