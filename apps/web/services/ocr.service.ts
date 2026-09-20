import { generateStructuredFromImage } from "@repo/web/lib/gemini"
import { buildOcrPrompt } from "@repo/web/lib/prompts/ocr.prompt"
import { ocrSchema, type OcrResult } from "@repo/schemas/ocr"

/** PLAN.md: gambar maksimal 10 MB. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export class OcrInputError extends Error {}

/**
 * OCR lewat Gemini multimodal.
 *
 * PLAN.md aslinya menugaskan ini ke PP-OCRv5 di `apps/ml-api`. Selama service
 * Python itu belum ada, jalurnya ditempuh Gemini dengan bentuk hasil yang sama
 * (text, confidence, warnings) supaya nanti bisa ditukar tanpa mengubah UI.
 */
export async function extractTextFromImage(file: File): Promise<OcrResult> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new OcrInputError("Format gambar harus JPG, PNG, atau WebP.")
    }

    if (file.size > MAX_IMAGE_BYTES) {
        throw new OcrInputError("Ukuran gambar maksimal 10 MB.")
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64")

    return generateStructuredFromImage(ocrSchema, buildOcrPrompt(), {
        data: base64,
        mimeType: file.type,
    })
}
