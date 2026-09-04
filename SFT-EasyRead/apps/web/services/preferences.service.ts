import { preferencesPatchSchema, type PreferencesPatch } from "@repo/schemas/preferences"
import * as preferencesRepository from "@repo/db/repositories/preferences"

/**
 * Preferensi versi server. Bentuknya camelCase persis `ReadingSettings` di
 * `lib/session.ts` supaya komponen bisa memakainya tanpa pemetaan tambahan.
 */
export type PreferencesView = {
    uiFont: string
    readingFont: string
    contrastId: string
    fontSize: number
    letterSpacing: number
    ttsSpeed: number
    autoTts: boolean
    focusRuler: boolean
    language: string
}

/** Harus sama dengan `defaultSettings` di lib/session.ts. */
export const DEFAULT_PREFERENCES: PreferencesView = {
    uiFont: "lexend",
    readingFont: "atkinson",
    contrastId: "cream-ink",
    fontSize: 20,
    letterSpacing: 0.12,
    ttsSpeed: 1.0,
    autoTts: false,
    focusRuler: true,
    language: "id-ID",
}

function toView(row: Record<string, unknown> | null): PreferencesView {
    if (!row) return { ...DEFAULT_PREFERENCES }

    const number = (value: unknown, fallback: number) => {
        const parsed = typeof value === "string" ? Number(value) : value
        return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback
    }

    return {
        uiFont: typeof row.ui_font === "string" ? row.ui_font : DEFAULT_PREFERENCES.uiFont,
        readingFont:
            typeof row.reading_font === "string" ? row.reading_font : DEFAULT_PREFERENCES.readingFont,
        contrastId:
            typeof row.contrast_id === "string" ? row.contrast_id : DEFAULT_PREFERENCES.contrastId,
        fontSize: number(row.font_size, DEFAULT_PREFERENCES.fontSize),
        // numeric Postgres kembali sebagai string lewat PostgREST.
        letterSpacing: number(row.letter_spacing, DEFAULT_PREFERENCES.letterSpacing),
        ttsSpeed: number(row.tts_rate, DEFAULT_PREFERENCES.ttsSpeed),
        autoTts: row.auto_tts === true,
        focusRuler: row.focus_ruler_enabled === true,
        language: typeof row.language === "string" ? row.language : DEFAULT_PREFERENCES.language,
    }
}

export async function getPreferences(userId: string): Promise<PreferencesView> {
    const { data } = await preferencesRepository.getPreferences(userId)
    return toView((data ?? null) as Record<string, unknown> | null)
}

export async function savePreferences(userId: string, input: unknown): Promise<PreferencesView> {
    const patch: PreferencesPatch = preferencesPatchSchema.parse(input)

    // Hanya kolom yang dikirim yang ditulis, supaya PUT parsial tidak menimpa
    // setelan lain dengan nilai bawaan.
    const payload: Record<string, unknown> = { user_id: userId }

    if (patch.uiFont !== undefined) payload.ui_font = patch.uiFont
    if (patch.readingFont !== undefined) payload.reading_font = patch.readingFont
    if (patch.contrastId !== undefined) payload.contrast_id = patch.contrastId
    if (patch.fontSize !== undefined) payload.font_size = patch.fontSize
    if (patch.letterSpacing !== undefined) payload.letter_spacing = patch.letterSpacing
    if (patch.ttsSpeed !== undefined) payload.tts_rate = patch.ttsSpeed
    if (patch.autoTts !== undefined) payload.auto_tts = patch.autoTts
    if (patch.focusRuler !== undefined) payload.focus_ruler_enabled = patch.focusRuler
    if (patch.language !== undefined) payload.language = patch.language

    const { data, error } = await preferencesRepository.upsertPreferences(
        payload as preferencesRepository.PreferencesUpsert,
    )

    if (error) throw error

    return toView((data ?? null) as Record<string, unknown> | null)
}
