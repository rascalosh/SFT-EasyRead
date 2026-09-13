"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cx } from "@/components/shared/ui"
import { flattenFocusSentences } from "@/lib/focus-sentences"
import { lineSpanFromPoint, sameLine, type LineSpan } from "@/lib/focus-line"
import type { FocusRulerMode } from "@/lib/session"

const RULER_HIGHLIGHT =
  "bg-[var(--color-brand-soft)] outline outline-1 outline-[var(--color-brand)] shadow-[inset_0_-3px_0_var(--color-brand)]"

export function FocusRulerSentences({
  blocks,
  enabled,
  mode = "sentence",
  className,
  layoutKey,
}: {
  blocks: string[]
  enabled: boolean
  mode?: FocusRulerMode
  className?: string
  layoutKey?: string
}) {
  const [ruler, setRuler] = useState<number | null>(null)
  const [line, setLine] = useState<LineSpan | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const sentences = useMemo(() => flattenFocusSentences(blocks), [blocks])

  useEffect(() => {
    if (!enabled) {
      setRuler(null)
      setLine(null)
    }
  }, [enabled])

  useEffect(() => {
    setRuler(null)
    setLine(null)
  }, [mode, layoutKey, blocks])

  useEffect(() => {
    if (mode !== "line" || !line) return

    function clear() {
      setLine(null)
    }

    window.addEventListener("resize", clear)
    return () => window.removeEventListener("resize", clear)
  }, [mode, line])

  function pickLine(event: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || mode !== "line") return
    const box = boxRef.current
    if (!box) return
    event.preventDefault()
    const next = lineSpanFromPoint(event.clientX, event.clientY, box)
    if (!next) {
      setLine(null)
      return
    }
    setLine((prev) => (prev && sameLine(prev, next) ? null : next))
  }

  if (mode === "line") {
    return (
      <div
        ref={boxRef}
        className={cx("relative", enabled && "cursor-pointer select-none", className)}
        onPointerDown={pickLine}
      >
        {blocks.map((paragraph, i) => {
          const active = enabled && line && line.paragraphIndex === i
          const start = active ? line.start : 0
          const end = active ? line.end : 0
          return (
            <p key={`${i}-${paragraph.slice(0, 24)}`}>
              {active ? (
                <>
                  {paragraph.slice(0, start)}
                  <span className={cx("rounded-lg px-1 py-0.5", RULER_HIGHLIGHT)}>
                    {paragraph.slice(start, end)}
                  </span>
                  {paragraph.slice(end)}
                </>
              ) : (
                paragraph
              )}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className={className}>
      {sentences.map((sentence, i) => (
        <p
          key={`${i}-${sentence.slice(0, 32)}`}
          onPointerDown={(event) => {
            if (!enabled) return
            event.preventDefault()
            setRuler(ruler === i ? null : i)
          }}
          onKeyDown={(event) => {
            if (!enabled || (event.key !== "Enter" && event.key !== " ")) return
            event.preventDefault()
            setRuler(ruler === i ? null : i)
          }}
          tabIndex={enabled ? 0 : -1}
          role={enabled ? "button" : undefined}
          className={cx(
            "-mx-3 block w-[calc(100%+1.5rem)] rounded-lg px-3 py-1.5 transition-colors",
            enabled && "cursor-pointer select-none",
            enabled && ruler === i
              ? RULER_HIGHLIGHT
              : enabled && "hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]",
          )}
        >
          {sentence}
        </p>
      ))}
    </div>
  )
}
