import { z } from "zod"

export const wordMeaningSchema = z.object({
    meaning: z
        .string()
        .describe(
            "Arti kata dalam satu kalimat pendek Bahasa Indonesia, sesederhana mungkin untuk anak SD.",
        ),
})

export type WordMeaning = z.infer<typeof wordMeaningSchema>
