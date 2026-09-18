"use client"

import { useEffect, useRef, useState } from "react"
import {
  SETTINGS_EVENT,
  applyFontPreferences,
  defaultSettings,
  loadSettings,
  syncSettingsFromServer,
  type ReadingSettings,
} from "@/lib/session"

/** Preferensi Pengaturan yang tetap hidup di semua halaman bacaan. */
export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings)
  const [ready, setReady] = useState(false)
  const settingsRef = useRef<ReadingSettings>(defaultSettings)

  useEffect(() => {
    const sync = () => {
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
      window.removeEventListener(SETTINGS_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return { settings, settingsRef, ready }
}
