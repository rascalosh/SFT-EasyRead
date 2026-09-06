import { z } from "zod"

/** Kategori pertanyaan — harus cocok dengan CHECK quiz_questions.category. */
export const QUIZ_CATEGORIES = ["main_idea", "explicit", "context"] as const

export type QuizCategory = (typeof QUIZ_CATEGORIES)[number]

export const quizQuestionSchema = z.object({
    category: z.enum(QUIZ_CATEGORIES),

    prompt: z.string().min(5),

    /** Kata kunci acuan penilaian, dipakai juga sebagai fallback offline. */
    keywords: z.array(z.string()).min(1).max(8),

    /** Jawaban ideal singkat, jadi rubrik saat mengevaluasi jawaban pengguna. */
    referenceAnswer: z.string().min(1),
})

export const quizSchema = z.object({
    questions: z.array(quizQuestionSchema).min(3).max(3),
})

export type QuizQuestionResult = z.infer<typeof quizQuestionSchema>
export type QuizResult = z.infer<typeof quizSchema>
