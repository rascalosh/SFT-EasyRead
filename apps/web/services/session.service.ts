import * as sessionRepository from "@repo/db/repositories/reading-session"
import * as documentRepository from "@repo/db/repositories/document"

function countWords(text: string) {
    const trimmed = text.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
}

/**
 * Catat sesi membaca saat pengguna membuka satu materi.
 * `words_read` diisi dari panjang teks dokumen supaya progress punya angka
 * walaupun pengguna keluar tanpa menekan apa pun.
 */
export async function startReadingSession(documentId: string, userId: string) {
    const { data: document, error } = await documentRepository.getDocumentById(documentId, userId)

    if (error || !document) {
        throw new Error("Document not found")
    }

    const originalText = typeof document.original_text === "string" ? document.original_text : ""

    return sessionRepository.createReadingSession({
        document_id: documentId,
        user_id: userId,
        words_read: countWords(originalText),
    })
}

export type FinishSessionInput = {
    durationSeconds?: number
    lastPosition?: number
    completed?: boolean
    /** { simplify, tts, syllable, ttsSlowdown } — dipakai rule engine. */
    helpUsage?: Record<string, number>
}

export async function updateReadingSession(
    sessionId: string,
    userId: string,
    input: FinishSessionInput,
) {
    const payload: sessionRepository.ReadingSessionUpdate = {}

    if (typeof input.durationSeconds === "number" && Number.isFinite(input.durationSeconds)) {
        payload.duration_seconds = Math.max(0, Math.round(input.durationSeconds))
    }

    if (typeof input.lastPosition === "number" && Number.isFinite(input.lastPosition)) {
        payload.last_position = Math.max(0, Math.round(input.lastPosition))
    }

    if (typeof input.completed === "boolean") {
        payload.completed = input.completed
        if (input.completed) payload.finished_at = new Date().toISOString()
    }

    if (input.helpUsage && typeof input.helpUsage === "object") {
        payload.help_usage = input.helpUsage
    }

    const { data, error } = await sessionRepository.updateReadingSession(sessionId, userId, payload)

    if (error) throw error
    return data
}
