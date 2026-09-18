import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
})

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite"

/** Model yang benar-benar dipakai — juga jadi bagian kunci cache. */
export function activeModel() {
    return process.env.GEMINI_MODEL ?? GEMINI_MODEL
}

/**
 * Subset JSON Schema yang diterima Gemini: type, description, nullable, enum,
 * properties, required, items, minItems, maxItems, format.
 * Kunci lain (mis. $schema, additionalProperties, $defs) ditolak API.
 */
const ALLOWED_KEYS = new Set([
    "type",
    "description",
    "nullable",
    "enum",
    "properties",
    "required",
    "items",
    "minItems",
    "maxItems",
    "format",
])

function sanitizeSchema(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(sanitizeSchema)
    if (!node || typeof node !== "object") return node

    const source = node as Record<string, unknown>
    const output: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(source)) {
        if (!ALLOWED_KEYS.has(key)) continue

        if (key === "properties" && value && typeof value === "object") {
            const properties: Record<string, unknown> = {}
            for (const [name, child] of Object.entries(value as Record<string, unknown>)) {
                properties[name] = sanitizeSchema(child)
            }
            output[key] = properties
            continue
        }

        output[key] = key === "items" ? sanitizeSchema(value) : value
    }

    // Union nullable dari Zod (["string","null"]) tidak dimengerti Gemini.
    if (Array.isArray(output.type)) {
        const types = output.type as string[]
        const concrete = types.find((entry) => entry !== "null")
        output.type = concrete ?? "string"
        if (types.includes("null")) output.nullable = true
    }

    return output
}

/**
 * Zod → JSON Schema untuk Gemini.
 *
 * Sebelumnya tiap service menulis ulang skema JSON dengan tangan di samping
 * skema Zod-nya, dan keduanya sudah sempat melenceng (batas 3–5 poin ringkasan
 * ada di Zod tapi tidak di skema Gemini, sehingga jawaban 2 poin lolos ke API
 * lalu gagal validasi dan membakar retry). Sekarang satu sumber saja.
 */
export function toGeminiSchema(schema: z.ZodType) {
    return sanitizeSchema(z.toJSONSchema(schema, { io: "output" }))
}

function isRateLimited(error: unknown) {
    const status = (error as { status?: number })?.status
    const message = String((error as { message?: string })?.message ?? error ?? "")

    return status === 429 || /429|rate.?limit|RESOURCE_EXHAUSTED|quota/i.test(message)
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export type StructuredOptions = {
    /** PLAN.md: maksimal dua retry (jadi tiga percobaan). */
    maxAttempts?: number
    systemInstruction?: string
}

/**
 * Satu pintu untuk semua panggilan Gemini berformat JSON: structured output,
 * validasi Zod, dan retry dengan exponential backoff untuk 429 sesuai PLAN.md.
 */
export async function generateStructured<T>(
    schema: z.ZodType<T>,
    prompt: string,
    options: StructuredOptions = {},
): Promise<T> {
    const { maxAttempts = 3, systemInstruction } = options

    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await gemini.models.generateContent({
                model: activeModel(),
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: toGeminiSchema(schema),
                    ...(systemInstruction ? { systemInstruction } : {}),
                },
            })

            const rawText = typeof response.text === "string" ? response.text : ""
            if (!rawText.trim()) throw new Error("Gemini response text is missing")

            return schema.parse(JSON.parse(rawText))
        } catch (error) {
            lastError = error

            if (attempt < maxAttempts) {
                // 1s, 2s, 4s … hanya untuk rate limit; galat skema tidak perlu ditunggu.
                await wait(isRateLimited(error) ? 2 ** (attempt - 1) * 1000 : 250)
            }
        }
    }

    throw lastError
}

/** Panggilan multimodal (gambar + teks) untuk OCR. */
export async function generateStructuredFromImage<T>(
    schema: z.ZodType<T>,
    prompt: string,
    image: { data: string; mimeType: string },
    options: StructuredOptions = {},
): Promise<T> {
    const { maxAttempts = 3 } = options

    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await gemini.models.generateContent({
                model: activeModel(),
                contents: [
                    {
                        role: "user",
                        parts: [
                            { inlineData: { mimeType: image.mimeType, data: image.data } },
                            { text: prompt },
                        ],
                    },
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: toGeminiSchema(schema),
                },
            })

            const rawText = typeof response.text === "string" ? response.text : ""
            if (!rawText.trim()) throw new Error("Gemini response text is missing")

            return schema.parse(JSON.parse(rawText))
        } catch (error) {
            lastError = error
            if (attempt < maxAttempts) {
                await wait(isRateLimited(error) ? 2 ** (attempt - 1) * 1000 : 250)
            }
        }
    }

    throw lastError
}
