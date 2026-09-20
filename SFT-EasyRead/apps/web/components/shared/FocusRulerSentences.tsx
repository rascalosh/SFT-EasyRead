"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cx } from "@/components/shared/ui"
import { flattenFocusSentences } from "@/lib/focus-sentences"
import { adjacentLineSpan, firstLineSpan, lineSpanFromPoint, sameLine, type LineSpan } from "@/lib/focus-line"
import type { FocusRulerMode } from "@/lib/session"

export function FocusRulerSentences({
  blocks,
  enabled,
  mode = "sentence",
  className,
  layoutKey,
  preview = false,
}: {
  blocks: string[]
  enabled: boolean
  mode?: FocusRulerMode
  className?: string
  layoutKey?: string
  /** Sorot contoh pertama supaya pratinjau pengaturan langsung terlihat. */
  preview?: boolean
}) {
  const [ruler, setRuler] = useState<number | null>(preview ? 0 : null)
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
    if (preview) return
    setRuler(null)
    setLine(null)
  }, [mode, layoutKey, blocks, preview])

  useLayoutEffect(() => {
    if (!preview || !enabled) return

    let alive = true

    if (mode === "sentence") {
      setRuler(0)
      setLine(null)
      return
    }

    const box = boxRef.current
    if (!box) return

    const apply = () => {
      if (!alive) return
      setLine(firstLineSpan(box))
    }
    apply()
    const frame = window.requestAnimationFrame(apply)
    return () => {
      alive = false
      window.cancelAnimationFrame(frame)
    }
  }, [preview, enabled, mode, layoutKey, blocks])

  useEffect(() => {
    if (mode !== "line") return

    function onResize() {
      if (preview && boxRef.current) {
        setLine(firstLineSpan(boxRef.current))
        return
      }
      setLine(null)
    }

    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [mode, preview])

  useLayoutEffect(() => {
    if (!enabled || preview) return
    const mark = boxRef.current?.querySelector(".focus-ruler-mark")
    mark?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [enabled, preview, ruler, line])

  function focusBox() {
    boxRef.current?.focus({ preventScroll: true })
  }

  function moveRuler(direction: 1 | -1) {
    if (!enabled) return

    if (mode === "sentence") {
      if (!sentences.length) return
      setRuler((current) => {
        if (current === null) return direction > 0 ? 0 : sentences.length - 1
        return Math.min(sentences.length - 1, Math.max(0, current + direction))
      })
      return
    }

    const box = boxRef.current
    if (!box) return
    setLine((current) => adjacentLineSpan(box, current, direction) ?? current)
  }

  useEffect(() => {
    if (!enabled) return

    function onWindowKey(event: KeyboardEvent) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.defaultPrevented) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true'], [role='radiogroup']")
      ) {
        return
      }
      event.preventDefault()
      moveRuler(event.key === "ArrowDown" ? 1 : -1)
    }

    window.addEventListener("keydown", onWindowKey)
    return () => window.removeEventListener("keydown", onWindowKey)
  }, [enabled, mode, sentences])

  function pickLine(event: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || mode !== "line") return
    const box = boxRef.current
    if (!box) return
    event.preventDefault()
    focusBox()
    const next = lineSpanFromPoint(event.clientX, event.clientY, box)
    if (!next) {
      if (!preview) setLine(null)
      return
    }
    setLine((prev) => (prev && sameLine(prev, next) ? (preview ? prev : null) : next))
  }

  const boxProps = enabled
    ? {
        tabIndex: 0 as const,
        role: "group" as const,
        "aria-label": "Penggaris fokus. Gunakan panah atas dan bawah untuk memindah sorotan.",
      }
    : {}

  if (mode === "line") {
    return (
      <div
        ref={boxRef}
        className={cx(
          "relative",
          enabled && "cursor-pointer select-none outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand",
          className,
        )}
        onPointerDown={pickLine}
        {...boxProps}
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
                  <span className="focus-ruler-mark rounded-lg px-1 py-0.5">
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
    <div
      ref={boxRef}
      className={cx(
        enabled && "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand",
        className,
      )}
      onPointerDown={() => {
        if (enabled) focusBox()
      }}
      {...boxProps}
    >
      {sentences.map((sentence, i) => (
        <p
          key={`${i}-${sentence.slice(0, 32)}`}
          onPointerDown={(event) => {
            if (!enabled) return
            event.preventDefault()
            setRuler((current) => {
              if (current === i) return preview ? current : null
              return i
            })
          }}
          className={cx(
            "-mx-3 block w-[calc(100%+1.5rem)] rounded-lg px-3 py-1.5 transition-colors",
            enabled && "cursor-pointer select-none",
            enabled && ruler === i
              ? "focus-ruler-mark"
              : enabled && "hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]",
          )}
        >
          {sentence}
        </p>
      ))}
    </div>
  )
}
