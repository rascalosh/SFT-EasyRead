import { createClient } from "../server"

export type AchievementInsert = {
    user_id: string;
    code: string;
    metadata?: unknown;
};

export async function getAchievements(userId: string) {
    const supabase = await createClient()

    return supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false })
}

/**
 * Unique (user_id, code) — `ignoreDuplicates` menjaga `awarded_at` tetap
 * tanggal pertama kali diraih, bukan tertimpa setiap kali progress dibuka.
 */
export async function awardAchievements(payload: AchievementInsert[]) {
    if (payload.length === 0) return

    const supabase = await createClient()

    const { error } = await supabase
        .from("achievements")
        .upsert(payload, { onConflict: "user_id,code", ignoreDuplicates: true })

    if (error) throw error
}

export async function getProfile(userId: string) {
    const supabase = await createClient()

    return supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
}
