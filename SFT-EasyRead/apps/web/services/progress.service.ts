import {
    buildProgress,
    type ProgressInput,
    type QuizAnswerInput,
    type ReadingSessionInput,
    type SpeechAssessmentInput,
    type ScoreView,
} from "@repo/web/lib/progress-rules"
import { scoresFromMetrics, averageScore, noteForScore } from "@repo/web/lib/speech-align"
import * as sessionRepository from "@repo/db/repositories/reading-session"
import * as answerRepository from "@repo/db/repositories/quiz-answer"
import * as speechRepository from "@repo/db/repositories/speech"
import * as progressRepository from "@repo/db/repositories/progress"

const UNTITLED = "Tanpa judul"

function toNumber(value: unknown, fallback = 0) {
    const parsed = typeof value === "string" ? Number(value) : value
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback
}

function titleOf(joined: unknown) {
    const row = joined as { title?: unknown } | null
    return typeof row?.title === "string" && row.title ? row.title : UNTITLED
}

function mapSessions(rows: Record<string, unknown>[]): ReadingSessionInput[] {
    return rows.map((row) => ({
        startedAt: String(row.started_at ?? ""),
        documentTitle: titleOf(row.documents),
        durationSeconds: toNumber(row.duration_seconds),
        wordsRead: toNumber(row.words_read),
        completed: row.completed === true,
        helpUsage: (row.help_usage ?? {}) as Record<string, number>,
    }))
}

function mapAnswers(rows: Record<string, unknown>[]): QuizAnswerInput[] {
    return rows.map((row) => {
        const question = row.quiz_questions as
            | { category?: unknown; quizzes?: { documents?: unknown } }
            | null

        const category = question?.category
        const verdict = row.verdict

        return {
            answeredAt: String(row.answered_at ?? ""),
            documentTitle: titleOf(question?.quizzes?.documents),
            category:
                category === "main_idea" || category === "explicit" || category === "context"
                    ? category
                    : null,
            score: toNumber(row.score),
            verdict: verdict === "paham" || verdict === "belum_paham" ? verdict : null,
        }
    })
}

function mapAssessments(rows: Record<string, unknown>[]): SpeechAssessmentInput[] {
    return rows.map((row) => {
        const wordAccuracy = toNumber(row.word_accuracy)

        // Skor lima sumbu dihitung ulang dari angka yang tersimpan, supaya
        // rumusnya satu tempat dengan yang dipakai saat asesmen berlangsung.
        const scores: ScoreView[] = scoresFromMetrics(
            {
                alignment: [],
                correctWords: toNumber(row.correct_words),
                substitutions: toNumber(row.substitutions),
                omissions: toNumber(row.omissions),
                insertions: toNumber(row.insertions),
                repetitions: toNumber(row.repetitions),
                referenceWordCount: Math.max(
                    1,
                    toNumber(row.correct_words) +
                        toNumber(row.substitutions) +
                        toNumber(row.omissions),
                ),
                spokenWordCount: 0,
                wordAccuracy,
                wordErrorRate: toNumber(row.word_error_rate),
                wordsPerMinute: toNumber(row.words_per_minute),
            },
            toNumber(row.long_pauses),
        )

        return {
            createdAt: String(row.created_at ?? ""),
            documentTitle: titleOf(row.documents),
            wordAccuracy,
            wordsPerMinute: toNumber(row.words_per_minute),
            omissions: toNumber(row.omissions),
            repetitions: toNumber(row.repetitions),
            longPauses: toNumber(row.long_pauses),
            scores,
            averageScore: averageScore(scores),
        }
    })
}

/**
 * Kumpulkan seluruh data progress pengguna lalu jalankan rule engine.
 * Achievement yang baru layak diraih dicatat sekali (upsert `ignoreDuplicates`)
 * supaya tanggal "Diraih …" tidak bergeser tiap halaman dibuka.
 */
export async function getProgress(userId: string) {
    const [sessions, answers, assessments, achievements] = await Promise.all([
        sessionRepository.getReadingSessions(userId),
        answerRepository.getQuizAnswers(userId),
        speechRepository.getSpeechAssessments(userId),
        progressRepository.getAchievements(userId),
    ])

    const awarded: Record<string, string> = {}
    for (const row of (achievements.data ?? []) as Record<string, unknown>[]) {
        if (typeof row.code === "string") {
            awarded[row.code] = String(row.awarded_at ?? new Date().toISOString())
        }
    }

    const input: ProgressInput = {
        sessions: mapSessions((sessions.data ?? []) as Record<string, unknown>[]),
        answers: mapAnswers((answers.data ?? []) as Record<string, unknown>[]),
        assessments: mapAssessments((assessments.data ?? []) as Record<string, unknown>[]),
        awarded,
        now: new Date(),
    }

    const result = buildProgress(input)

    const fresh = result.earnedCodes.filter((rule) => !awarded[rule.code])

    if (fresh.length > 0) {
        try {
            await progressRepository.awardAchievements(
                fresh.map((rule) => ({ user_id: userId, code: rule.code, metadata: {} })),
            )
        } catch {
            // Achievement bersifat hiasan — kegagalan mencatatnya tidak boleh
            // menggagalkan seluruh halaman progress.
        }

        // Tampilkan yang baru diraih pada respons yang sama.
        const now = new Date().toISOString()
        for (const rule of fresh) awarded[rule.code] = now

        return buildProgress({ ...input, awarded })
    }

    return result
}

export { noteForScore }
