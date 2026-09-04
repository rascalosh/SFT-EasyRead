import { createClient } from "../server"

export type SpeechAssessmentInsert = {
    document_id: string;
    user_id: string;
    transcript: string;
    reference_text: string;
    duration_seconds: number;
    words_per_minute: number;
    word_accuracy: number;
    word_error_rate: number;
    correct_words: number;
    substitutions: number;
    omissions: number;
    insertions: number;
    repetitions: number;
    long_pauses: number;
    model: string;
    processing_time_ms: number;
};

export type WordAlignmentInsert = {
    assessment_id: string;
    position: number;
    expected_word: string | null;
    spoken_word: string | null;
    /** CHECK: correct | substitution | omission | insertion | repetition. */
    status: string;
};

export async function createSpeechAssessment(payload: SpeechAssessmentInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("speech_assessments")
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * `word_alignments` tidak punya `user_id` — RLS-nya lewat speech_assessments.
 * Jangan memfilter user_id di sini.
 */
export async function createWordAlignments(payload: WordAlignmentInsert[]) {
    const supabase = await createClient()

    const { error } = await supabase.from("word_alignments").insert(payload)

    if (error) throw error
}

export async function getSpeechAssessments(userId: string, limit = 100) {
    const supabase = await createClient()

    return supabase
        .from("speech_assessments")
        .select("*, documents(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)
}
