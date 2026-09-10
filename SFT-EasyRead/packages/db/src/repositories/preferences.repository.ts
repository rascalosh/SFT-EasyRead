import { createClient } from "../server"

export type PreferencesRow = {
    user_id: string;
    ui_font: string;
    reading_font: string;
    contrast_id: string;
    font_size: number;
    letter_spacing: number;
    tts_rate: number;
    auto_tts: boolean;
    focus_ruler_enabled: boolean;
    language: string;
};

export type PreferencesUpsert = Partial<Omit<PreferencesRow, "user_id">> & {
    user_id: string;
};

export async function getPreferences(userId: string) {
    const supabase = await createClient()

    return supabase
        .from("reading_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()
}

/** Baris preferensi dikunci per pengguna (PK = user_id), jadi upsert. */
export async function upsertPreferences(payload: PreferencesUpsert) {
    const supabase = await createClient()

    return supabase
        .from("reading_preferences")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single()
}
