"use client"

import { useCallback, useEffect, useState } from "react"
import { IconButton } from "@/components/shared/ui"
import { IconChevronDown, IconChevronUp } from "@/components/shared/icons"

const THRESHOLD = 16

function scrollingElement() {
  return document.scrollingElement ?? document.documentElement
}

export default function ScrollEdgeButton() {
  const [toBottom, setToBottom] = useState(true)

  const update = useCallback(() => {
    const el = scrollingElement()
    const atTop = el.scrollTop <= THRESHOLD
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - THRESHOLD
    setToBottom(!(atBottom && !atTop))
  }, [])

  useEffect(() => {
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    const observer = new ResizeObserver(update)
    observer.observe(document.documentElement)
    observer.observe(document.body)

    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
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
      className="fixed bottom-6 right-6 z-40 shadow-[var(--shadow-lg)]"
    />
  )
}
