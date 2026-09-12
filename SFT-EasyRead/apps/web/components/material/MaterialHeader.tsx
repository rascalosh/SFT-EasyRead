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
    const sync = () => {
      const settings = loadSettings()
      setFocusRuler(settings.focusRuler)
      setFocusRulerMode(settings.focusRulerMode)
      setLayoutKey(
        `${settings.fontSize}-${settings.letterSpacing}-${settings.readingFont}-${settings.dyslexicFont}`,
      )
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
          <FocusRulerSentences
            blocks={paragraphs}
            enabled={focusRuler}
            mode={focusRulerMode}
            layoutKey={layoutKey}
            className="reading-area mt-3 text-ink"
          />
        </div>
      </div>
    </div>
  )
}
