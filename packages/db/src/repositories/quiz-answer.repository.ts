import { createClient } from "../server"

export type QuizAnswerUpsert = {
    question_id: string;
    user_id: string;
    answer: string;
    /** CHECK: 0–100. */
    score: number;
    feedback: string;
    /** CHECK: paham | belum_paham. */
    verdict: string;
    /** Rincian per aspek: { ide, eksplisit, konteks }. */
    scores: unknown;
    tip: string | null;
};

/**
 * Tabel ini punya unique (question_id, user_id) — jawab ulang soal yang sama
 * harus memperbarui baris yang ada, bukan menambah baris baru.
 * Catatan: `quiz_answers` TIDAK punya kolom quiz_id.
 */
export async function upsertQuizAnswer(payload: QuizAnswerUpsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("quiz_answers")
        .upsert(payload, { onConflict: "question_id,user_id" })
        .select()
        .single()

    if (error) throw error
    return data
}

/** Semua jawaban pengguna, dipakai rule engine progress. */
export async function getQuizAnswers(userId: string, limit = 200) {
    const supabase = await createClient()

    return supabase
        .from("quiz_answers")
        .select("*, quiz_questions(category, quiz_id, quizzes(document_id, documents(title)))")
        .eq("user_id", userId)
        .order("answered_at", { ascending: false })
        .limit(limit)
}
