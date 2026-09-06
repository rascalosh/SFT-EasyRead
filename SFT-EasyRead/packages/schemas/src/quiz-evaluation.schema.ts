import { z } from "zod"

/**
 * Penilaian jawaban bebas. Tiga aspek bernilai 0–2 sesuai proposal:
 * ide utama, informasi eksplisit, dan kesesuaian konteks.
 */
export const quizEvaluationSchema = z.object({
    ide: z.number().int().min(0).max(2),

    eksplisit: z.number().int().min(0).max(2),

    konteks: z.number().int().min(0).max(2),

    /** Feedback singkat, ramah, tanpa diagnosis. */
    feedback: z.string().min(1),
})

export type QuizEvaluationResult = z.infer<typeof quizEvaluationSchema>

/** Ambang "Paham": total minimal 4 dari 6. Dipakai server dan fallback lokal. */
export const QUIZ_PASS_THRESHOLD = 4

export function isPaham(evaluation: QuizEvaluationResult) {
    return evaluation.ide + evaluation.eksplisit + evaluation.konteks >= QUIZ_PASS_THRESHOLD
}
