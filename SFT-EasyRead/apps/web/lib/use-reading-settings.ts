"use client"

import { useEffect, useRef, useState } from "react"
import {
  SETTINGS_EVENT,
  applyFontPreferences,
  defaultSettings,
  loadSettings,
  saveSettingsEverywhere,
  syncSettingsFromServer,
  type ReadingSettings,
} from "@/lib/session"

/** Preferensi Pengaturan yang tetap hidup di semua halaman bacaan. */
export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings)
  const [ready, setReady] = useState(false)
  const settingsRef = useRef<ReadingSettings>(defaultSettings)

  useEffect(() => {
    let alive = true

    const sync = () => {
      if (!alive) return
      const next = loadSettings()
      settingsRef.current = next
      setSettings(next)
      applyFontPreferences(next)
    }

    sync()
    setReady(true)
    void syncSettingsFromServer()
    window.addEventListener(SETTINGS_EVENT, sync)
    window.addEventListener("storage", sync)

    return () => {
      alive = false
      window.removeEventListener(SETTINGS_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  function persist(partial: Partial<ReadingSettings>) {
    const next = { ...settingsRef.current, ...partial }
    settingsRef.current = next
    setSettings(next)
    saveSettingsEverywhere(next)
    applyFontPreferences(next)
  }

  return { settings, settingsRef, ready, persist }
}
