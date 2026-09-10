import { z } from "zod"

/**
 * Preferensi membaca yang dikirim ke/dari `/api/preferences`.
 *
 * Bentuknya sengaja dibuat camelCase persis seperti `ReadingSettings` di
 * `apps/web/lib/session.ts` supaya komponen tidak perlu memetakan apa pun.
 *
 * Id font dan kontras sengaja divalidasi longgar (string biasa): daftar id yang
 * sah hidup di `lib/session.ts` (UI_FONT_OPTIONS, READING_FONT_OPTIONS,
 * READING_CONTRAST_OPTIONS) dan `normalizeSettings()` di sana yang menjadi satu-
 * satunya sumber kebenaran. Menyalin daftarnya ke sini hanya akan menimbulkan
 * drift. Yang divalidasi ketat adalah angka, karena itulah yang punya CHECK di
 * tabel `reading_preferences`.
 */
export const preferencesSchema = z.object({
    uiFont: z.string().min(1),

    readingFont: z.string().min(1),

    contrastId: z.string().min(1),

    /** CHECK reading_preferences.font_size: 14–40. UI membatasi 16–30. */
    fontSize: z.number().int().min(14).max(40),

    /** CHECK reading_preferences.letter_spacing: 0–0.35 setelah migration. */
    letterSpacing: z.number().min(0).max(0.35),

    /** CHECK reading_preferences.tts_rate: 0.50–1.50. */
    ttsSpeed: z.number().min(0.5).max(1.5),

    autoTts: z.boolean(),

    focusRuler: z.boolean(),

    language: z.string().min(2).max(10),
})

export type PreferencesPayload = z.infer<typeof preferencesSchema>

/** PUT boleh mengirim sebagian field saja. */
export const preferencesPatchSchema = preferencesSchema.partial()

export type PreferencesPatch = z.infer<typeof preferencesPatchSchema>
