import { generateStructured, activeModel } from "@repo/web/lib/gemini"
import { buildQuizPrompt, QUIZ_PROMPT_VERSION } from "@repo/web/lib/prompts/quiz.prompt"
import { buildQuizEvalPrompt } from "@repo/web/lib/prompts/quiz-eval.prompt"
import { quizSchema } from "@repo/schemas/quiz"
import { quizEvaluationSchema, isPaham } from "@repo/schemas/quiz-evaluation"
import * as documentRepository from "@repo/db/repositories/document"
import * as quizRepository from "@repo/db/repositories/quiz"
import * as answerRepository from "@repo/db/repositories/quiz-answer"

/** Bentuk soal yang dipakai ComprehensionCheck. */
export type QuizQuestionView = {
    id: string
    prompt: string
    keywords: string[]
    category: string
}

/** Bentuk penilaian — sama persis dengan tipe `Analysis` di komponen. */
export type QuizAnalysis = {
    ok: boolean
    ide: number
    eksplisit: number
    konteks: number
    feedback: string
}

/** Gemini bisa membalas 800–1200 kata saja; potong bacaan yang kepanjangan. */
const MAX_PROMPT_WORDS = 1000

function trimToWords(text: string, limit = MAX_PROMPT_WORDS) {
    const words = text.trim().split(/\s+/)
    return words.length <= limit ? text.trim() : words.slice(0, limit).join(" ")
}

async function loadDocument(documentId: string, userId: string) {
    const { data: document, error } = await documentRepository.getDocumentById(documentId, userId)

    if (error || !document) {
        throw new Error("Document not found")
    }

    const originalText = typeof document.original_text === "string" ? document.original_text : ""

    if (!originalText.trim()) {
        throw new Error("Document text is empty")
    }

    return { document, originalText }
}

function toView(row: Record<string, unknown>): QuizQuestionView {
    const schema = (row.answer_schema ?? {}) as { keywords?: unknown }

    return {
        id: String(row.id),
        prompt: String(row.prompt ?? ""),
        category: String(row.category ?? "main_idea"),
        keywords: Array.isArray(schema.keywords) ? schema.keywords.map(String) : [],
    }
}

/**
 * Kuis di-cache per dokumen: sekali dibuat, soalnya dipakai lagi. Selain hemat
 * kuota Gemini, ini juga menjaga jawaban lama tetap merujuk ke soal yang sama.
 */
export async function getOrCreateQuiz(documentId: string, userId: string) {
    const existing = await quizRepository.findLatestQuiz(documentId, userId)

    const existingQuestions = (existing?.quiz_questions ?? []) as Record<string, unknown>[]

    if (existing && existingQuestions.length > 0) {
        const questions = [...existingQuestions]
            .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
            .map(toView)

        return { quizId: String(existing.id), questions, cached: true }
    }

    const { originalText } = await loadDocument(documentId, userId)

    const generated = await generateStructured(
        quizSchema,
        buildQuizPrompt(trimToWords(originalText)),
    )

    const quiz = await quizRepository.createQuiz({
        document_id: documentId,
        user_id: userId,
        provider: "google",
        model: activeModel(),
        prompt_version: QUIZ_PROMPT_VERSION,
    })

    const rows = await quizRepository.createQuizQuestions(
        generated.questions.map((question, index) => ({
            quiz_id: String(quiz.id),
            position: index + 1,
            category: question.category,
            prompt: question.prompt,
            answer_schema: {
                keywords: question.keywords,
                referenceAnswer: question.referenceAnswer,
            },
        })),
    )

    const questions = (rows ?? [])
        .map((row) => toView(row as Record<string, unknown>))

    return { quizId: String(quiz.id), questions, cached: false }
}

/**
 * Penilaian jawaban bebas oleh Gemini, lalu di-upsert ke quiz_answers.
 * Tabel itu unik per (question_id, user_id) sehingga menjawab ulang soal yang
 * sama memperbarui baris, bukan menumpuk baris baru.
 */
export async function evaluateAnswer(questionId: string, userId: string, answer: string) {
    const { data: question, error } = await quizRepository.findQuestionById(questionId)

    if (error || !question) {
        throw new Error("Question not found")
    }

    const quiz = question.quizzes as { user_id?: string; document_id?: string } | null

    // quiz_questions tidak punya user_id; kepemilikan diperiksa lewat kuis induk.
    if (!quiz || quiz.user_id !== userId) {
        throw new Error("Question not found")
    }

    const { originalText } = await loadDocument(String(quiz.document_id), userId)

    const schema = (question.answer_schema ?? {}) as { referenceAnswer?: unknown }

    const evaluation = await generateStructured(
        quizEvaluationSchema,
        buildQuizEvalPrompt({
            passage: trimToWords(originalText),
            question: String(question.prompt ?? ""),
            referenceAnswer: String(schema.referenceAnswer ?? ""),
            answer,
        }),
    )

    const total = evaluation.ide + evaluation.eksplisit + evaluation.konteks
    const ok = isPaham(evaluation)

    await answerRepository.upsertQuizAnswer({
        question_id: questionId,
        user_id: userId,
        answer,
        score: Math.round((total / 6) * 100),
        feedback: evaluation.feedback,
        verdict: ok ? "paham" : "belum_paham",
        scores: {
            ide: evaluation.ide,
            eksplisit: evaluation.eksplisit,
            konteks: evaluation.konteks,
        },
        tip: null,
    })

    const analysis: QuizAnalysis = {
        ok,
        ide: evaluation.ide,
        eksplisit: evaluation.eksplisit,
        konteks: evaluation.konteks,
        feedback: evaluation.feedback,
    }

    return analysis
}
