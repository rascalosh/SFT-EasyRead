import { z } from "zod"

/**
 * Yang diminta dari Gemini (dikirim sebagai response schema). Jangan tambahkan
 * level kesulitan di sini — level dihitung sendiri dari teks keluaran, bukan
 * dinilai model atas dirinya sendiri.
 */
export const summarySchema = z.object({
    title: z.string(),
    
    summary: z.string(),

    bulletPoints: z
        .array(z.string())
        .min(3)
        .max(5)
});

export type SummaryResult = z.infer<typeof summarySchema>

export const difficultySchema = z.object({
    level: z.number().int().min(1).max(10),
    band: z.string(),
    /** Flesch-Kincaid terkoreksi Indonesia (faktor suku kata 0,6). Makin tinggi makin sulit. */
    fkId: z.number(),
    /** Flesch Reading Ease terkoreksi Indonesia. Makin tinggi makin mudah. */
    freId: z.number(),
    wordsPerSentence: z.number(),
    /** Mentah, belum dikali 0,6. */
    syllablesPerWord: z.number(),
    longWordRatio: z.number(),
    words: z.number().int(),
    sentences: z.number().int(),
})

export type Difficulty = z.infer<typeof difficultySchema>

/**
 * Bentuk yang disimpan ke `simplifications.result`. Superset dari
 * `summarySchema`, jadi komponen frontend yang membaca `summary`/`bulletPoints`
 * tetap jalan tanpa perubahan.
 */
export const storedSummarySchema = summarySchema.extend({
    difficulty: difficultySchema,
    sourceDifficulty: difficultySchema,
    revisionRounds: z.number().int().min(0),
    mode: z.enum(["prose", "terse"]),
    targetLevel: z.number().int().min(1).max(10),
})

export type StoredSummary = z.infer<typeof storedSummarySchema>