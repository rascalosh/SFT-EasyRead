"use client"

import { useEffect } from "react"
import {
  SETTINGS_EVENT,
  applyFontPreferences,
  loadSettings,
} from "@/lib/session"

/** Sinkronkan preferensi font dari localStorage ke <html data-*>. */
export default function FontPreference() {
  useEffect(() => {
    const apply = () => applyFontPreferences(loadSettings())
    apply()
    window.addEventListener(SETTINGS_EVENT, apply)
    window.addEventListener("storage", apply)
    return () => {
      window.removeEventListener(SETTINGS_EVENT, apply)
      window.removeEventListener("storage", apply)
    }
  }, [])

  return null
}
