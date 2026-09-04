import { z } from "zod"

export const ocrSchema = z.object({
    /** Teks hasil pindai, sudah dirapikan jadi paragraf. */
    text: z.string(),

    /** Ringkasan satu paragraf untuk tab "Ringkasan AI" di LensViewer. */
    summary: z.string(),

    /** Estimasi keyakinan model terhadap keterbacaan gambar. */
    confidence: z.number().min(0).max(1),

    /** Catatan masalah gambar: buram, miring, terpotong, dsb. */
    warnings: z.array(z.string()).max(5),
})

export type OcrResult = z.infer<typeof ocrSchema>
