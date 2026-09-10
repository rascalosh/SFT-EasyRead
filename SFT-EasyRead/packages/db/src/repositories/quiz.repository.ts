import { createClient } from "../server"

export type QuizInsert = {
    document_id: string;
    user_id: string;
    provider: string;
    model: string;
    /** Tabel `quizzes` memakai prompt_version, bukan pipeline_version. */
    prompt_version: string;
};

export type QuizQuestionInsert = {
    quiz_id: string;
    position: number;
    /** CHECK: main_idea | explicit | context. */
    category: string;
    prompt: string;
    answer_schema: unknown;
};

/** Kuis terakhir milik pengguna untuk satu dokumen, lengkap dengan soalnya. */
export async function findLatestQuiz(documentId: string, userId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from("quizzes")
        .select("*, quiz_questions(*)")
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    return data
}

export async function createQuiz(payload: QuizInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("quizzes")
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * `quiz_questions` tidak punya `user_id` — RLS-nya lewat `quizzes`.
 * Jangan pernah memfilter user_id di tabel ini.
 */
export async function createQuizQuestions(payload: QuizQuestionInsert[]) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("quiz_questions")
        .insert(payload)
        .select()
        .order("position", { ascending: true })

    if (error) throw error
    return data
}

/** Satu soal beserta kuis induknya, untuk memvalidasi kepemilikan saat menilai. */
export async function findQuestionById(questionId: string) {
    const supabase = await createClient()

    return supabase
        .from("quiz_questions")
        .select("*, quizzes(id, user_id, document_id)")
        .eq("id", questionId)
        .single()
}
