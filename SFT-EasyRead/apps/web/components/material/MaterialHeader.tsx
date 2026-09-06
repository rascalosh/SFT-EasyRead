"use client"

import { useEffect, useState } from "react"
import { IconBook } from "@/components/shared/icons"
import { loadSettings, SETTINGS_EVENT, syncSettingsFromServer } from "@/lib/session"

export function MaterialHeader({
  title,
  paragraphs,
}: {
  title: string
  paragraphs: string[]
}) {
  const [focusRuler, setFocusRuler] = useState(true)
  const [ruler, setRuler] = useState<number | null>(null)

  useEffect(() => {
    const sync = () => {
      const enabled = loadSettings().focusRuler
      setFocusRuler(enabled)
      if (!enabled) setRuler(null)
    }

    sync()
    void syncSettingsFromServer()
    window.addEventListener(SETTINGS_EVENT, sync)
    window.addEventListener("storage", sync)

    return () => {
      window.removeEventListener(SETTINGS_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <IconBook width={22} height={22} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-heading-2 text-ink">{title}</h1>
          <div className="reading-area mt-3 text-ink">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                onPointerDown={(event) => {
                  if (!focusRuler) return
                  event.preventDefault()
                  setRuler(ruler === i ? null : i)
                }}
                onKeyDown={(event) => {
                  if (!focusRuler || (event.key !== "Enter" && event.key !== " ")) return
                  event.preventDefault()
                  setRuler(ruler === i ? null : i)
                }}
                tabIndex={focusRuler ? 0 : -1}
                role="button"
                className={[
                  "-mx-3 block w-[calc(100%+1.5rem)] rounded-lg px-3 py-1.5 text-ink transition-colors",
                  focusRuler && "cursor-pointer select-none",
                  focusRuler && ruler === i
                    ? "bg-[var(--color-brand-soft)] outline outline-1 outline-[var(--color-brand)] shadow-[inset_0_-3px_0_var(--color-brand)]"
                    : focusRuler && "hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]",
                ].filter(Boolean).join(" ")}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
