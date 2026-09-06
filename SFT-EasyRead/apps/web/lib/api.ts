/**
 * Klien fetch untuk endpoint baru.
 *
 * Mengikuti pola `lib/documents.ts`: tidak pernah melempar, selalu
 * mengembalikan discriminated union sehingga komponen bisa jatuh ke mock
 * dengan aman saat pengguna belum login atau server bermasalah.
 */

export type ApiResult<T> = { data: T } | { unauthorized: true } | { error: true }

export function isOk<T>(result: ApiResult<T>): result is { data: T } {
    return "data" in result
}

async function request<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
    try {
        const response = await fetch(input, init)

        if (response.status === 401) return { unauthorized: true }
        if (!response.ok) return { error: true }

        return { data: (await response.json()) as T }
    } catch {
        // Offline atau server mati — komponen memakai fallback.
        return { error: true }
    }
}

function jsonInit(method: string, body: unknown): RequestInit {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }
}

// ── Preferensi ───────────────────────────────────────────────────────────────

export type ApiPreferences = {
    uiFont: string
    readingFont: string
    contrastId: string
    fontSize: number
    letterSpacing: number
    ttsSpeed: number
    autoTts: boolean
    focusRuler: boolean
    language: string
}

export function fetchPreferences() {
    return request<ApiPreferences>("/api/preferences")
}

export function savePreferencesToAccount(patch: Partial<ApiPreferences>) {
    return request<ApiPreferences>("/api/preferences", jsonInit("PUT", patch))
}

// ── Kuis ─────────────────────────────────────────────────────────────────────

export type ApiQuizQuestion = {
    id: string
    prompt: string
    keywords: string[]
    category: string
}

export type ApiQuiz = {
    quizId: string
    questions: ApiQuizQuestion[]
    cached: boolean
}

export type ApiQuizAnalysis = {
    ok: boolean
    ide: number
    eksplisit: number
    konteks: number
    feedback: string
}

export function fetchQuiz(documentId: string) {
    return request<ApiQuiz>(`/api/documents/${documentId}/quiz`, { method: "POST" })
}

export function submitQuizAnswer(questionId: string, answer: string) {
    return request<ApiQuizAnalysis>("/api/quiz-answers", jsonInit("POST", { questionId, answer }))
}

// ── Sesi membaca ─────────────────────────────────────────────────────────────

export type ApiReadingSession = { id: string }

export function startReadingSession(documentId: string) {
    return request<ApiReadingSession>("/api/reading-sessions", jsonInit("POST", { documentId }))
}

export type ReadingSessionPatch = {
    durationSeconds?: number
    lastPosition?: number
    completed?: boolean
    helpUsage?: Record<string, number>
}

export function updateReadingSession(sessionId: string, patch: ReadingSessionPatch) {
    return request<unknown>(`/api/reading-sessions/${sessionId}`, jsonInit("PATCH", patch))
}

/**
 * Dipakai saat komponen dilepas / tab ditutup. `keepalive` membuat permintaan
 * tetap terkirim walau halaman sudah berpindah.
 */
export function updateReadingSessionBeacon(sessionId: string, patch: ReadingSessionPatch) {
    try {
        void fetch(`/api/reading-sessions/${sessionId}`, {
            ...jsonInit("PATCH", patch),
            keepalive: true,
        })
    } catch {
        // Tidak ada yang bisa dilakukan saat halaman sedang ditutup.
    }
}

// ── Progress ─────────────────────────────────────────────────────────────────

export type ApiProgressStat = { label: string; value: string; note: string }
export type ApiActivityRow = {
    date: string
    activity: string
    mode: "Standar" | "Personalized"
    task: string
    result: string
    status: "Paham" | "Belum Paham"
}
export type ApiAchievement = { title: string; body: string; date: string }
export type ApiPracticeRec = { title: string; body: string }
export type ApiTrendPoint = { week: string; value: number }
export type ApiScore = { label: string; score: number; note: string }

export type ApiProgress = {
    progressStats: ApiProgressStat[]
    activity: ApiActivityRow[]
    achievements: ApiAchievement[]
    practiceRecs: ApiPracticeRec[]
    readingScores: ApiScore[]
    comprehensionTrend: ApiTrendPoint[]
    hasData: boolean
}

export function fetchProgress() {
    return request<ApiProgress>("/api/progress")
}

// ── Suku kata ────────────────────────────────────────────────────────────────

export type ApiSyllable = {
    word: string
    breakdown: string
    meaning: string
    checkedAgo: string
}

export function fetchSyllables(words: string[], documentId: string | null) {
    return request<{ words: ApiSyllable[] }>(
        "/api/syllabify",
        jsonInit("POST", { words, documentId }),
    )
}

// ── OCR ──────────────────────────────────────────────────────────────────────

export type ApiOcr = {
    text: string
    summary: string
    confidence: number
    warnings: string[]
}

export function scanImage(file: File) {
    const form = new FormData()
    form.append("image", file)

    return request<ApiOcr>("/api/ocr", { method: "POST", body: form })
}

// ── Penilaian suara ──────────────────────────────────────────────────────────

export type ApiSpeechRequest = {
    documentId: string | null
    referenceText: string
    transcript: string
    durationSeconds: number
    longPauses: number
}

export type ApiSpeechResult = {
    transcript: string
    wordsPerMinute: number
    wordAccuracy: number
    wordErrorRate: number
    correctWords: number
    substitutions: number
    omissions: number
    insertions: number
    repetitions: number
    longPauses: number
    scores: ApiScore[]
    averageScore: number
}

export function assessSpeech(payload: ApiSpeechRequest) {
    return request<ApiSpeechResult>("/api/speech/assess", jsonInit("POST", payload))
}
