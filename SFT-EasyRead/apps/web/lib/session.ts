/**
 * Session helpers – material yang sedang aktif dibaca.
 * Data disimpan di sessionStorage agar hilang saat tab ditutup (tidak perlu login).
 * Untuk data yang perlu persisten lintas tab, gunakan localStorage (pengaturan, dll).
 */

export type ActiveMaterial = {
  id: string
  title: string
  /** Teks lengkap materi (sumber kebenaran untuk Baca/Simplify/dll). */
  originalText?: string
  /** Paragraf hasil pecah teks (untuk tampilan baris). */
  paragraphs: string[]
}

const ACTIVE_KEY = "easyread-active"

/** Simpan material aktif (dipanggil dari MaterialPage saat dokumen dimuat). */
export function setActiveMaterial(material: ActiveMaterial) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(material))
  } catch {
    // private/incognito bisa throw
  }
}

/** Ambil material aktif. Kembalikan null jika belum ada. */
export function getActiveMaterial(): ActiveMaterial | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY)
    return raw ? (JSON.parse(raw) as ActiveMaterial) : null
  } catch {
    return null
  }
}

// ── Pengaturan (localStorage agar persisten antar sesi) ──────────────────────

export type UiFontId = "lexend" | "opendyslexic"
export type ReadingFontId = "atkinson" | "opendyslexic"

export type ReadingSettings = {
  /** Font antarmuka (tombol, sidebar, label). */
  uiFont: UiFontId
  /** Font area teks bacaan / ramah disleksia. */
  readingFont: ReadingFontId
  /** @deprecated diganti readingFont; tetap dibaca untuk kompatibilitas */
  dyslexicFont?: boolean
  fontSize: number
  letterSpacing: number
  overlay: string
  autoTts: boolean
  ttsSpeed: number
  language: string
}

const SETTINGS_KEY = "easyread-settings"
export const SETTINGS_EVENT = "easyread-settings"

export const defaultSettings: ReadingSettings = {
  uiFont: "lexend",
  readingFont: "atkinson",
  dyslexicFont: true,
  fontSize: 20,
  letterSpacing: 0.06,
  overlay: "var(--color-overlay-cream)",
  autoTts: false,
  ttsSpeed: 1.0,
  language: "id-ID",
}

function normalizeSettings(raw: Partial<ReadingSettings>): ReadingSettings {
  const uiFont: UiFontId = raw.uiFont === "opendyslexic" ? "opendyslexic" : "lexend"
  let readingFont: ReadingFontId =
    raw.readingFont === "opendyslexic" ? "opendyslexic" : "atkinson"

  // Migrasi toggle lama: dyslexicFont false → tetap pakai atkinson sebagai default bacaan
  // (area bacaan tanpa class font-dyslexic tetap mengikuti UI)
  if (!raw.readingFont && raw.dyslexicFont === false) {
    readingFont = "atkinson"
  }

  return {
    ...defaultSettings,
    ...raw,
    uiFont,
    readingFont,
    dyslexicFont: readingFont === "opendyslexic" || raw.dyslexicFont !== false,
  }
}

export function loadSettings(): ReadingSettings {
  if (typeof window === "undefined") return defaultSettings
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw
      ? normalizeSettings(JSON.parse(raw) as Partial<ReadingSettings>)
      : defaultSettings
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: ReadingSettings) {
  if (typeof window === "undefined") return
  try {
    const next = normalizeSettings(settings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(SETTINGS_EVENT))
  } catch {
    // ignore
  }
}

/** Terapkan preferensi font ke <html> (CSS variables / data attributes). */
export function applyFontPreferences(settings: ReadingSettings = loadSettings()) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.dataset.uiFont = settings.uiFont
  root.dataset.readingFont = settings.readingFont
}

// ── Progress sesi (in-memory, reset per sesi) ────────────────────────────────

export type SessionActivity = {
  date: string
  activity: string
  materialTitle: string
  result: string
  status: "Paham" | "Belum Paham"
}

const ACTIVITY_KEY = "easyread-activity"

export function logActivity(entry: SessionActivity) {
  if (typeof window === "undefined") return
  try {
    const raw = sessionStorage.getItem(ACTIVITY_KEY)
    const list: SessionActivity[] = raw ? (JSON.parse(raw) as SessionActivity[]) : []
    list.unshift(entry)
    sessionStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    // ignore
  }
}

export function getActivityLog(): SessionActivity[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(ACTIVITY_KEY)
    return raw ? (JSON.parse(raw) as SessionActivity[]) : []
  } catch {
    return []
  }
}
