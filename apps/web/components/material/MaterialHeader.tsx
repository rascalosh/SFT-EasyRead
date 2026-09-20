"use client"

import { useEffect, useState } from "react"
import { IconBook } from "@/components/shared/icons"
import { FocusRulerSentences } from "@/components/shared/FocusRulerSentences"
import { loadSettings, SETTINGS_EVENT, syncSettingsFromServer, type FocusRulerMode } from "@/lib/session"

export function MaterialHeader({
  title,
  paragraphs,
}: {
  title: string
  paragraphs: string[]
}) {
  const [focusRuler, setFocusRuler] = useState(true)
  const [focusRulerMode, setFocusRulerMode] = useState<FocusRulerMode>("sentence")
  const [layoutKey, setLayoutKey] = useState("")

  useEffect(() => {
    let alive = true

    const sync = () => {
      if (!alive) return
      const settings = loadSettings()
      setFocusRuler(settings.focusRuler)
      setFocusRulerMode(settings.focusRulerMode)
      setLayoutKey(
        `${settings.fontSize}-${settings.letterSpacing}-${settings.readingFont}-${settings.contrastId}`,
      )
    }

    sync()
    void syncSettingsFromServer()
    window.addEventListener(SETTINGS_EVENT, sync)
    window.addEventListener("storage", sync)

    return () => {
      alive = false
      window.removeEventListener(SETTINGS_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <div className="reading-surface rounded-[var(--radius-card)] border border-line p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <IconBook width={22} height={22} />
        </span>
        <h1 className="min-w-0 flex-1 text-heading-2 text-ink">{title}</h1>
      </div>
      <FocusRulerSentences
        blocks={paragraphs}
        enabled={focusRuler}
        mode={focusRulerMode}
        layoutKey={layoutKey}
        className="reading-area mt-4 !max-w-none"
      />
    </div>
  )
}
