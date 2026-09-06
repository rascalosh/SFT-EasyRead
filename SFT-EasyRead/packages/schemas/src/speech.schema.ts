import { z } from "zod"

/** Status tiap kata hasil alignment — cocok dengan CHECK word_alignments.status. */
export const ALIGNMENT_STATUSES = [
    "correct",
    "substitution",
    "omission",
    "insertion",
    "repetition",
] as const

export type AlignmentStatus = (typeof ALIGNMENT_STATUSES)[number]

export const wordAlignmentSchema = z.object({
    position: z.number().int().min(0),
    expectedWord: z.string().nullable(),
    spokenWord: z.string().nullable(),
    status: z.enum(ALIGNMENT_STATUSES),
})

export type WordAlignment = z.infer<typeof wordAlignmentSchema>

/** Payload dari browser. Audio mentah tidak pernah dikirim — hanya transkrip. */
export const speechAssessRequestSchema = z.object({
    documentId: z.string().uuid().nullable().optional(),

    /** Teks yang seharusnya dibaca. */
    referenceText: z.string().min(1),

    /** Hasil Web Speech API di perangkat pengguna. */
    transcript: z.string(),

    /** CHECK speech_assessments.duration_seconds: 0–120. */
    durationSeconds: z.number().min(0).max(120),

    /** Jeda panjang (>1.5 detik) yang terdeteksi browser antar hasil. */
    longPauses: z.number().int().min(0).default(0),
})

export type SpeechAssessRequest = z.infer<typeof speechAssessRequestSchema>

/** Satu sumbu penilaian, bentuknya persis prop <ScoreMeter />. */
export const speechScoreSchema = z.object({
    label: z.string(),
    score: z.number().int().min(0).max(100),
    note: z.string(),
})

export type SpeechScore = z.infer<typeof speechScoreSchema>

/** Hasil asesmen sesuai kontrak di PLAN.md. */
export const speechAssessmentSchema = z.object({
    transcript: z.string(),
    durationSeconds: z.number(),
    wordsPerMinute: z.number(),
    wordAccuracy: z.number(),
    wordErrorRate: z.number(),
    correctWords: z.number().int(),
    substitutions: z.number().int(),
    omissions: z.number().int(),
    insertions: z.number().int(),
    repetitions: z.number().int(),
    longPauses: z.number().int(),
    model: z.string(),
    processingTimeMs: z.number().int(),

    /** Lima sumbu yang dirender VoiceAssessment. */
    scores: z.array(speechScoreSchema),

    /** Rata-rata kelima sumbu, dipakai untuk tile & ambang 70. */
    averageScore: z.number().int().min(0).max(100),
})

export type SpeechAssessmentResult = z.infer<typeof speechAssessmentSchema>
