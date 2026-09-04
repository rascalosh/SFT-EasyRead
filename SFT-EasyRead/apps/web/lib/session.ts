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

/** Font sans-serif yang direkomendasikan untuk keterbacaan (BDA-style). */
export const UI_FONT_OPTIONS = [
  { id: "lexend", label: "Lexend (default)" },
  { id: "opendyslexic", label: "OpenDyslexic" },
  { id: "open-sans", label: "Open Sans" },
  { id: "arial", label: "Arial" },
  { id: "verdana", label: "Verdana" },
  { id: "tahoma", label: "Tahoma" },
  { id: "trebuchet", label: "Trebuchet MS" },
  { id: "calibri", label: "Calibri" },
  { id: "century-gothic", label: "Century Gothic" },
  { id: "comic-sans", label: "Comic Sans" },
] as const

export const READING_FONT_OPTIONS = [
  { id: "atkinson", label: "Atkinson Hyperlegible (default)" },
  { id: "opendyslexic", label: "OpenDyslexic" },
  { id: "open-sans", label: "Open Sans" },
  { id: "arial", label: "Arial" },
  { id: "verdana", label: "Verdana" },
  { id: "tahoma", label: "Tahoma" },
  { id: "trebuchet", label: "Trebuchet MS" },
  { id: "calibri", label: "Calibri" },
  { id: "century-gothic", label: "Century Gothic" },
  { id: "comic-sans", label: "Comic Sans" },
] as const

export type UiFontId = (typeof UI_FONT_OPTIONS)[number]["id"]
export type ReadingFontId = (typeof READING_FONT_OPTIONS)[number]["id"]

const UI_FONT_IDS = new Set<string>(UI_FONT_OPTIONS.map((f) => f.id))
const READING_FONT_IDS = new Set<string>(READING_FONT_OPTIONS.map((f) => f.id))

/**
 * Pasangan latar + teks dengan kontras luminansi tinggi.
 * Hindari hijau & merah/pink sebagai pilihan utama (kesulitan untuk color blindness).
 */
export const READING_CONTRAST_OPTIONS = [
  {
    id: "cream-ink",
    label: "Krem · teks gelap",
    background: "#fcf6e7",
    text: "#1B3C53",
  },
  {
    id: "paper-black",
    label: "Kertas · kontras tinggi",
    background: "#f5f0e6",
    text: "#0a0a0a",
  },
  {
    id: "blue-ink",
    label: "Biru lembut · teks gelap",
    background: "#e2ecf9",
    text: "#14283a",
  },
  {
    id: "peach-ink",
    label: "Persik · teks gelap",
    background: "#fbe8d9",
    text: "#2c1810",
  },
  {
    id: "lilac-ink",
    label: "Lila · teks gelap",
    background: "#ede5f5",
    text: "#241536",
  },
  {
    id: "yellow-black",
    label: "Kuning lembut · teks hitam",
    background: "#fef7d6",
    text: "#1a1a1a",
  },
  {
    id: "slate-black",
    label: "Abu · teks hitam",
    background: "#e8eaed",
    text: "#111827",
  },
] as const

export type ReadingContrastId = (typeof READING_CONTRAST_OPTIONS)[number]["id"]
const CONTRAST_IDS = new Set<string>(READING_CONTRAST_OPTIONS.map((c) => c.id))

export function getContrastOption(id: ReadingContrastId | string | undefined) {
  return (
    READING_CONTRAST_OPTIONS.find((c) => c.id === id) ??
    READING_CONTRAST_OPTIONS[0]
  )
}

/** Migrasi overlay lama (hanya warna latar) → pasangan kontras. */
function contrastFromLegacyOverlay(overlay?: string): ReadingContrastId {
  if (!overlay) return "cream-ink"
  if (overlay.includes("peach")) return "peach-ink"
  if (overlay.includes("blue")) return "blue-ink"
  if (overlay.includes("lilac")) return "lilac-ink"
  if (overlay.includes("yellow")) return "yellow-black"
  // mint/hijau diganti ke biru agar lebih aman untuk color vision deficiency
  if (overlay.includes("mint")) return "blue-ink"
  return "cream-ink"
}

export type ReadingSettings = {
  /** Font antarmuka (tombol, sidebar, label). */
  uiFont: UiFontId
  /** Font area teks bacaan / ramah disleksia. */
  readingFont: ReadingFontId
  /** @deprecated diganti readingFont; tetap dibaca untuk kompatibilitas */
  dyslexicFont?: boolean
  fontSize: number
  /** Jarak antar huruf (em). Target ~0.12em ≈ 35% lebar huruf rata-rata. */
  letterSpacing: number
  /** Pasangan warna teks + latar bacaan (kontras tinggi). */
  contrastId: ReadingContrastId
  /** @deprecated diganti contrastId; tetap disimpan agar kompatibel */
  overlay: string
  autoTts: boolean
  ttsSpeed: number
  language: string
  /** Sorot baris aktif saat teks bacaan diketuk. */
  focusRuler: boolean
}

const SETTINGS_KEY = "easyread-settings"
export const SETTINGS_EVENT = "easyread-settings"

/** Word spacing = 3.5 × letter spacing (panduan ramah disleksia). */
export function wordSpacingFromLetter(letterSpacingEm: number) {
  return Math.max(0, letterSpacingEm * 3.5)
}

export const defaultSettings: ReadingSettings = {
  uiFont: "lexend",
  readingFont: "atkinson",
  dyslexicFont: true,
  fontSize: 20,
  letterSpacing: 0.12,
  contrastId: "cream-ink",
  overlay: READING_CONTRAST_OPTIONS[0].background,
  autoTts: false,
  ttsSpeed: 1.0,
  language: "id-ID",
  focusRuler: true,
}

function normalizeSettings(raw: Partial<ReadingSettings>): ReadingSettings {
  const uiFont: UiFontId = UI_FONT_IDS.has(raw.uiFont ?? "")
    ? (raw.uiFont as UiFontId)
    : "lexend"

  let readingFont: ReadingFontId = READING_FONT_IDS.has(raw.readingFont ?? "")
    ? (raw.readingFont as ReadingFontId)
    : "atkinson"

  // Migrasi toggle lama: dyslexicFont false → tetap pakai atkinson sebagai default bacaan
  if (!raw.readingFont && raw.dyslexicFont === false) {
    readingFont = "atkinson"
  }

  const letterSpacing =
    typeof raw.letterSpacing === "number" && Number.isFinite(raw.letterSpacing)
      ? Math.min(0.35, Math.max(0, raw.letterSpacing))
      : defaultSettings.letterSpacing

  const fontSize =
    typeof raw.fontSize === "number" && Number.isFinite(raw.fontSize)
      ? Math.min(30, Math.max(16, Math.round(raw.fontSize)))
      : defaultSettings.fontSize

  const contrastId: ReadingContrastId = CONTRAST_IDS.has(raw.contrastId ?? "")
    ? (raw.contrastId as ReadingContrastId)
    : contrastFromLegacyOverlay(raw.overlay)

  const contrast = getContrastOption(contrastId)

  return {
    ...defaultSettings,
    ...raw,
    uiFont,
    readingFont,
    fontSize,
    letterSpacing,
    contrastId,
    overlay: contrast.background,
    dyslexicFont: raw.dyslexicFont !== false,
    focusRuler: raw.focusRuler !== false,
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

/** Terapkan preferensi font, ukuran, jarak, & kontras warna ke <html>. */
export function applyFontPreferences(settings: ReadingSettings = loadSettings()) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const contrast = getContrastOption(settings.contrastId)
  const letter = settings.letterSpacing
  const word = wordSpacingFromLetter(letter)

  root.dataset.uiFont = settings.uiFont
  root.dataset.readingFont = settings.readingFont
  root.dataset.readingContrast = settings.contrastId
  root.style.setProperty("--reading-bg", contrast.background)
  root.style.setProperty("--reading-fg", contrast.text)
  root.style.setProperty("--reading-font-size", `${settings.fontSize}px`)
  root.style.setProperty("--reading-letter-spacing", `${letter}em`)
  root.style.setProperty("--reading-word-spacing", `${word}em`)
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

// ── Sinkronisasi preferensi dengan akun ──────────────────────────────────────

/**
 * Preferensi disimpan dua tempat: localStorage (cepat, jalan tanpa login, dan
 * jadi cache offline) serta tabel `reading_preferences` (ikut pengguna lintas
 * perangkat). localStorage tetap jadi sumber render pertama supaya tidak ada
 * kedipan, lalu ditimpa nilai dari akun begitu tiba.
 */

/** Ambil preferensi akun, terapkan, dan simpan ke localStorage. */
export async function syncSettingsFromServer(): Promise<ReadingSettings | null> {
  if (typeof window === "undefined") return null

  const { fetchPreferences, isOk } = await import("./api")
  const result = await fetchPreferences()

  // Belum login atau server bermasalah — setelan lokal tetap dipakai.
  if (!isOk(result)) return null

  // Server mengirim id font/kontras sebagai string biasa; normalizeSettings
  // yang memvalidasinya dan jatuh ke default kalau idnya tidak dikenal.
  const merged = normalizeSettings({
    ...loadSettings(),
    ...result.data,
  } as Partial<ReadingSettings>)

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
    window.dispatchEvent(new Event(SETTINGS_EVENT))
  } catch {
    // private/incognito bisa throw
  }

  applyFontPreferences(merged)
  return merged
}

/** Simpan ke perangkat sekarang juga, lalu titipkan ke akun di latar belakang. */
export function saveSettingsEverywhere(settings: ReadingSettings) {
  saveSettings(settings)

  if (typeof window === "undefined") return

  void (async () => {
    try {
      const { savePreferencesToAccount } = await import("./api")

      await savePreferencesToAccount({
        uiFont: settings.uiFont,
        readingFont: settings.readingFont,
        contrastId: settings.contrastId,
        fontSize: settings.fontSize,
        letterSpacing: settings.letterSpacing,
        ttsSpeed: settings.ttsSpeed,
        autoTts: settings.autoTts,
        focusRuler: settings.focusRuler,
        language: settings.language,
      })
    } catch {
      // Gagal menyimpan ke akun tidak boleh mengganggu; nilai lokal sudah aman.
    }
  })()
}
