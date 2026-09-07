import { createClient } from "../server"

export type ReadingSessionInsert = {
    document_id: string;
    user_id: string;
    words_read?: number;
};

export type ReadingSessionUpdate = {
    finished_at?: string;
    duration_seconds?: number;
    last_position?: number;
    help_usage?: unknown;
    completed?: boolean;
    words_read?: number;
};

export async function createReadingSession(payload: ReadingSessionInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("reading_sessions")
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateReadingSession(
    id: string,
    userId: string,
    payload: ReadingSessionUpdate,
) {
    const supabase = await createClient()

    return supabase
        .from("reading_sessions")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single()
}

export async function getReadingSessions(userId: string, limit = 200) {
    const supabase = await createClient()

    return supabase
        .from("reading_sessions")
        .select("*, documents(title)")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(limit)
}
