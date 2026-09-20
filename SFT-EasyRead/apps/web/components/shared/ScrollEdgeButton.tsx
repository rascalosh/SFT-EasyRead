"use client"

import { useCallback, useEffect, useState } from "react"
import { IconButton, cx } from "@/components/shared/ui"
import { IconChevronDown, IconChevronUp } from "@/components/shared/icons"

const THRESHOLD = 16

function scrollingElement() {
  return document.scrollingElement ?? document.documentElement
}

export default function ScrollEdgeButton({ className }: { className?: string }) {
  const [toBottom, setToBottom] = useState(true)

  const update = useCallback(() => {
    const el = scrollingElement()
    const atTop = el.scrollTop <= THRESHOLD
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - THRESHOLD
    setToBottom(!(atBottom && !atTop))
  }, [])

  useEffect(() => {
    let alive = true

    function safeUpdate() {
      if (!alive) return
      update()
    }

    safeUpdate()
    window.addEventListener("scroll", safeUpdate, { passive: true })
    window.addEventListener("resize", safeUpdate)

    const observer = new ResizeObserver(safeUpdate)
    observer.observe(document.documentElement)
    observer.observe(document.body)

    return () => {
      alive = false
      window.removeEventListener("scroll", safeUpdate)
      window.removeEventListener("resize", safeUpdate)
      observer.disconnect()
    }
  }, [update])

  function handleClick() {
    const el = scrollingElement()
    el.scrollTo({
      top: toBottom ? el.scrollHeight : 0,
      behavior: "smooth",
    })
  }

  const label = toBottom ? "Gulir ke bawah" : "Gulir ke atas"

  return (
    <IconButton
      label={label}
      variant="primary"
      size="lg"
      rounded="full"
      icon={toBottom ? <IconChevronDown aria-hidden /> : <IconChevronUp aria-hidden />}
      onClick={handleClick}
      className={cx("fixed bottom-6 right-6 z-[60] shadow-[var(--shadow-lg)]", className)}
    />
  )
}
