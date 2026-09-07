/**
 * Rule engine progress, achievement, dan rekomendasi — deterministik, tanpa AI.
 *
 * Semua bentuk keluaran di sini sengaja dibuat persis seperti yang sudah
 * dirender `components/progress/ProgressPage.tsx` dan `TrendChart.tsx`, supaya
 * komponen tidak perlu ditulis ulang.
 *
 * `buildProgress()` murni: "hari ini" pun disuntikkan lewat argumen `now`
 * supaya hasilnya bisa diuji.
 */

export type ProgressStat = { label: string; value: string; note: string }

export type ActivityRow = {
    date: string
    activity: string
    mode: "Standar" | "Personalized"
    task: string
    result: string
    status: "Paham" | "Belum Paham"
}

export type AchievementView = { title: string; body: string; date: string }
export type PracticeRec = { title: string; body: string }
export type TrendPoint = { week: string; value: number }
export type ScoreView = { label: string; score: number; note: string }

/** Satu jawaban kuis yang sudah dinilai. */
export type QuizAnswerInput = {
    answeredAt: string
    documentTitle: string
    category: "main_idea" | "explicit" | "context" | null
    /** 0–100. */
    score: number
    verdict: "paham" | "belum_paham" | null
}

export type ReadingSessionInput = {
    startedAt: string
    documentTitle: string
    durationSeconds: number
    wordsRead: number
    completed: boolean
    /** { simplify, tts, syllable, ttsSlowdown } */
    helpUsage: Record<string, number>
}

export type SpeechAssessmentInput = {
    createdAt: string
    documentTitle: string
    wordAccuracy: number
    wordsPerMinute: number
    omissions: number
    repetitions: number
    longPauses: number
    scores: ScoreView[]
    averageScore: number
}

export type ProgressInput = {
    sessions: ReadingSessionInput[]
    answers: QuizAnswerInput[]
    /** Terurut baru ke lama. */
    assessments: SpeechAssessmentInput[]
    /** Kode achievement yang sudah tercatat beserta tanggal diraihnya. */
    awarded: Record<string, string>
    now: Date
}

export type AchievementRule = { code: string; title: string; body: string }

export type ProgressResult = {
    progressStats: ProgressStat[]
    activity: ActivityRow[]
    achievements: AchievementView[]
    practiceRecs: PracticeRec[]
    readingScores: ScoreView[]
    comprehensionTrend: TrendPoint[]
    /** Kode yang layak diraih sekarang — dipersist oleh service. */
    earnedCodes: AchievementRule[]
    hasData: boolean
}

const DAY_MS = 86_400_000

function formatDate(value: Date) {
    return value.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

function dayIndex(value: Date) {
    return Math.floor(value.getTime() / DAY_MS)
}

function average(values: number[]) {
    if (values.length === 0) return 0
    return values.reduce((total, value) => total + value, 0) / values.length
}

function noteForScore(score: number) {
    if (score >= 85) return "Sangat Baik"
    if (score >= 70) return "Baik"
    if (score >= 55) return "Cukup"
    return "Perlu Latihan"
}

/** Hari aktif berturut-turut. Streak masih hidup bila aktivitas terakhir kemarin. */
export function streakOf(dates: Date[], now: Date) {
    if (dates.length === 0) return 0

    const days = new Set(dates.map(dayIndex))
    const today = dayIndex(now)

    let cursor = days.has(today) ? today : days.has(today - 1) ? today - 1 : null
    if (cursor === null) return 0

    let streak = 0
    while (days.has(cursor)) {
        streak++
        cursor--
    }

    return streak
}

function levelOf(averageComprehension: number, sessionCount: number) {
    if (sessionCount === 0) return { value: "Level 1", note: "Baru Memulai" }
    if (averageComprehension >= 85 && sessionCount >= 12) return { value: "Level 5", note: "Mandiri" }
    if (averageComprehension >= 75 && sessionCount >= 8) return { value: "Level 4", note: "Lancar" }
    if (averageComprehension >= 60 && sessionCount >= 4)
        return { value: "Level 3", note: "Sedang Berkembang" }
    if (sessionCount >= 2) return { value: "Level 2", note: "Mulai Terbiasa" }
    return { value: "Level 1", note: "Baru Memulai" }
}

function formatDuration(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.round((totalSeconds % 3600) / 60)
    if (hours === 0) return `${minutes} menit`
    return `${hours} jam ${minutes} menit`
}

/** Rata-rata skor kuis per minggu, empat minggu terakhir. */
function trendOf(answers: QuizAnswerInput[], now: Date): TrendPoint[] {
    const weeks: TrendPoint[] = []

    for (let index = 3; index >= 0; index--) {
        const end = now.getTime() - index * 7 * DAY_MS
        const start = end - 7 * DAY_MS

        const scores = answers
            .filter((answer) => {
                const at = new Date(answer.answeredAt).getTime()
                return at > start && at <= end
            })
            .map((answer) => answer.score)

        weeks.push({ week: `Minggu ${4 - index}`, value: Math.round(average(scores)) })
    }

    return weeks
}

type AchievementStats = {
    streak: number
    averageComprehension: number
    sessionCount: number
    accuracyGain: number
}

const ACHIEVEMENT_RULES: (AchievementRule & {
    earned: (input: ProgressInput, stats: AchievementStats) => boolean
})[] = [
    {
        code: "first_reading",
        title: "Langkah Pertama",
        body: "Menyelesaikan bacaan pertama.",
        earned: (_input, stats) => stats.sessionCount >= 1,
    },
    {
        code: "quiz_starter",
        title: "Berani Menjawab",
        body: "Mengerjakan kuis pemahaman pertama.",
        earned: (input) => input.answers.length >= 1,
    },
    {
        code: "consistent_reader",
        title: "Pembaca Konsisten",
        body: "Aktif membaca 7 hari berturut-turut.",
        earned: (_input, stats) => stats.streak >= 7,
    },
    {
        code: "great_comprehension",
        title: "Pemahaman Hebat",
        body: "Capai rata-rata pemahaman ≥ 80%.",
        earned: (input, stats) => input.answers.length >= 3 && stats.averageComprehension >= 80,
    },
    {
        code: "fluency_up",
        title: "Kelancaran Meningkat",
        body: "Kelancaran membaca naik ≥ 30%.",
        earned: (_input, stats) => stats.accuracyGain >= 30,
    },
]

/**
 * Rekomendasi latihan sesuai tabel rule engine di PLAN.md.
 *
 * Dihitung saat dibaca, bukan disimpan ke tabel `recommendations`: hasilnya
 * murni turunan dari data yang sudah ada, jadi menyimpannya hanya menambah
 * risiko basi. (Tabel itu juga memakai unique index parsial
 * `WHERE dismissed_at IS NULL` yang tidak bisa dipakai upsert PostgREST.)
 */
function recommendationsOf(input: ProgressInput, averageComprehension: number): PracticeRec[] {
    const recs: PracticeRec[] = []

    const totalHelp = (key: string) =>
        input.sessions.reduce((total, session) => total + (session.helpUsage?.[key] ?? 0), 0)

    const sessionCount = input.sessions.length
    const syllableTaps = totalHelp("syllable")
    const ttsSlowdowns = totalHelp("ttsSlowdown")
    const latest = input.assessments[0]

    const mainIdeaAnswers = input.answers.filter((answer) => answer.category === "main_idea")
    const mainIdeaMissRate =
        mainIdeaAnswers.length >= 2
            ? mainIdeaAnswers.filter((answer) => answer.verdict === "belum_paham").length /
              mainIdeaAnswers.length
            : 0

    if (sessionCount > 0 && syllableTaps / sessionCount >= 5) {
        recs.push({
            title: "Coba Sederhanakan Teks",
            body: "Kamu sering membuka kata sulit. Tekan Sederhanakan Teks sebelum mulai membaca.",
        })
    }

    if (ttsSlowdowns >= 3) {
        recs.push({
            title: "Simpan Kecepatan Suara",
            body: "Kamu sering memperlambat suara. Simpan kecepatan itu sebagai setelan bawaan di Pengaturan.",
        })
    }

    if (latest && latest.omissions >= 5) {
        recs.push({
            title: "Latihan Lebih Pendek",
            body: "Beberapa kata terlewat saat membaca. Coba bacaan yang lebih pendek dulu.",
        })
    }

    if (latest && latest.longPauses >= 3) {
        recs.push({
            title: "Dengarkan Dulu, Baru Baca",
            body: "Putar Text-to-Speech sekali sebelum membaca nyaring untuk mengurangi jeda.",
        })
    }

    if (mainIdeaMissRate >= 0.5) {
        recs.push({
            title: "Baca Ringkasan Sebelum Kuis",
            body: "Ide utama masih sering terlewat. Buka Ringkasan dulu sebelum menjawab kuis.",
        })
    }

    if (averageComprehension >= 80 && input.answers.length >= 3) {
        recs.push({
            title: "Naikkan Panjang Bacaan",
            body: "Pemahamanmu stabil. Coba bacaan yang sedikit lebih panjang.",
        })
    }

    if (recs.length === 0) {
        recs.push({
            title: "Mulai Bacaan Baru",
            body: "Tambah satu materi lalu kerjakan kuis pemahamannya.",
        })
    }

    return recs.slice(0, 3)
}

const EMPTY_SCORE_LABELS = [
    "Kelancaran Membaca",
    "Kecepatan Membaca",
    "Jeda",
    "Pengulangan Kata",
    "Akurasi Pengucapan",
]

export function buildProgress(input: ProgressInput): ProgressResult {
    const { sessions, answers, assessments, awarded, now } = input

    const sessionCount = sessions.length
    const totalSeconds = sessions.reduce((total, session) => total + (session.durationSeconds || 0), 0)
    const averageComprehension = Math.round(average(answers.map((answer) => answer.score)))

    const activityDates = [
        ...sessions.map((session) => new Date(session.startedAt)),
        ...answers.map((answer) => new Date(answer.answeredAt)),
        ...assessments.map((assessment) => new Date(assessment.createdAt)),
    ].filter((date) => !Number.isNaN(date.getTime()))

    const streak = streakOf(activityDates, now)
    const level = levelOf(averageComprehension, sessionCount)

    // Kenaikan akurasi dari asesmen terlama ke terbaru (assessments terurut baru→lama).
    const newest = assessments[0]
    const oldest = assessments[assessments.length - 1]
    const accuracyGain =
        newest && oldest && newest !== oldest && oldest.wordAccuracy > 0
            ? ((newest.wordAccuracy - oldest.wordAccuracy) / oldest.wordAccuracy) * 100
            : 0

    const progressStats: ProgressStat[] = [
        { label: "Level Membaca", value: level.value, note: level.note },
        {
            label: "Total Sesi",
            value: `${sessionCount} Sesi`,
            note: sessionCount === 0 ? "Belum ada sesi membaca" : formatDuration(totalSeconds),
        },
        {
            label: "Rata-rata Pemahaman",
            value: answers.length === 0 ? "—" : `${averageComprehension}%`,
            note: answers.length === 0 ? "Kerjakan kuis pertamamu" : noteForScore(averageComprehension),
        },
        {
            label: "Streak Aktivitas",
            value: `${streak} Hari`,
            note: streak === 0 ? "Mulai hari ini!" : "Pertahankan semangat!",
        },
    ]

    const activity: ActivityRow[] = [
        ...answers.map((answer) => ({
            at: new Date(answer.answeredAt).getTime(),
            row: {
                date: formatDate(new Date(answer.answeredAt)),
                activity: "Kuis Pemahaman",
                mode: "Standar" as const,
                task: answer.documentTitle,
                result: `${Math.round(answer.score)}%`,
                status: (answer.verdict === "paham" ? "Paham" : "Belum Paham") as
                    | "Paham"
                    | "Belum Paham",
            },
        })),
        ...assessments.map((assessment) => ({
            at: new Date(assessment.createdAt).getTime(),
            row: {
                date: formatDate(new Date(assessment.createdAt)),
                activity: "Penilaian Suara",
                mode: "Personalized" as const,
                task: assessment.documentTitle,
                result: `${assessment.averageScore}%`,
                status: (assessment.averageScore >= 70 ? "Paham" : "Belum Paham") as
                    | "Paham"
                    | "Belum Paham",
            },
        })),
    ]
        .sort((a, b) => b.at - a.at)
        .slice(0, 20)
        .map((entry) => entry.row)

    const stats: AchievementStats = { streak, averageComprehension, sessionCount, accuracyGain }

    const earnedCodes: AchievementRule[] = ACHIEVEMENT_RULES.filter((rule) =>
        rule.earned(input, stats),
    ).map(({ code, title, body }) => ({ code, title, body }))

    // Tanggal diambil dari baris `achievements` yang tersimpan supaya teks
    // "Diraih …" tidak berubah jadi hari ini setiap halaman dibuka.
    const achievements: AchievementView[] = earnedCodes
        .filter((rule) => awarded[rule.code])
        .map((rule) => ({
            title: rule.title,
            body: rule.body,
            date: formatDate(new Date(awarded[rule.code]!)),
        }))

    const readingScores: ScoreView[] = newest?.scores?.length
        ? newest.scores
        : EMPTY_SCORE_LABELS.map((label) => ({ label, score: 0, note: "Belum dinilai" }))

    return {
        progressStats,
        activity,
        achievements,
        practiceRecs: recommendationsOf(input, averageComprehension),
        readingScores,
        comprehensionTrend: trendOf(answers, now),
        earnedCodes,
        hasData: sessionCount > 0 || answers.length > 0 || assessments.length > 0,
    }
}
