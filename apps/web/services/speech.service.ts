import { alignReading, scoresFromMetrics, averageScore } from "@repo/web/lib/speech-align"
import {
    speechAssessRequestSchema,
    type SpeechAssessmentResult,
} from "@repo/schemas/speech"
import * as speechRepository from "@repo/db/repositories/speech"

/**
 * Model yang mengerjakan transkripsi. Web Speech API berjalan di perangkat
 * pengguna, jadi audio mentah tidak pernah meninggalkan browser dan tidak
 * pernah dikirim ke Gemini — sesuai aturan privasi PLAN.md.
 */
const MODEL = "web-speech-api"

export async function assessReading(userId: string, input: unknown): Promise<SpeechAssessmentResult> {
    const request = speechAssessRequestSchema.parse(input)
    const startedAt = Date.now()

    const metrics = alignReading(
        request.referenceText,
        request.transcript,
        request.durationSeconds,
    )

    const scores = scoresFromMetrics(metrics, request.longPauses)
    const processingTimeMs = Date.now() - startedAt

    const result: SpeechAssessmentResult = {
        transcript: request.transcript,
        durationSeconds: request.durationSeconds,
        wordsPerMinute: Math.round(metrics.wordsPerMinute),
        wordAccuracy: Number(metrics.wordAccuracy.toFixed(4)),
        wordErrorRate: Number(metrics.wordErrorRate.toFixed(4)),
        correctWords: metrics.correctWords,
        substitutions: metrics.substitutions,
        omissions: metrics.omissions,
        insertions: metrics.insertions,
        repetitions: metrics.repetitions,
        longPauses: request.longPauses,
        model: MODEL,
        processingTimeMs,
        scores,
        averageScore: averageScore(scores),
    }

    // Tanpa dokumen tersimpan (mis. memakai teks demo), hasil tetap ditampilkan
    // tapi tidak bisa dipersist — document_id wajib di tabel ini.
    if (!request.documentId) return result

    try {
        const assessment = await speechRepository.createSpeechAssessment({
            document_id: request.documentId,
            user_id: userId,
            transcript: result.transcript,
            reference_text: request.referenceText,
            duration_seconds: result.durationSeconds,
            words_per_minute: result.wordsPerMinute,
            word_accuracy: result.wordAccuracy,
            word_error_rate: result.wordErrorRate,
            correct_words: result.correctWords,
            substitutions: result.substitutions,
            omissions: result.omissions,
            insertions: result.insertions,
            repetitions: result.repetitions,
            long_pauses: result.longPauses,
            model: MODEL,
            processing_time_ms: processingTimeMs,
        })

        // Simpan alignment per kata agar riwayat kesalahan bisa ditelusuri.
        // `word_alignments` tidak punya user_id — RLS lewat speech_assessments.
        if (metrics.alignment.length > 0) {
            await speechRepository.createWordAlignments(
                metrics.alignment.slice(0, 500).map((word) => ({
                    assessment_id: String(assessment.id),
                    position: word.position,
                    expected_word: word.expectedWord,
                    spoken_word: word.spokenWord,
                    status: word.status,
                })),
            )
        }
    } catch {
        // Hasil penilaian tetap dikembalikan walau penyimpanan gagal; pengguna
        // tidak boleh kehilangan umpan balik hanya karena masalah database.
    }

    return result
}
