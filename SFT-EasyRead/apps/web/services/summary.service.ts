import crypto from "crypto"

import { gemini, GEMINI_MODEL } from "@repo/web/lib/gemini"
import { buildSummaryPrompt } from "@repo/web/lib/prompts/summary.prompt"
import { summarySchema } from "@repo/schemas/summary"

import * as documentRepository from "@repo/db/repositories/document"
import * as simplificationRepository from "@repo/db/repositories/simplification"

const PIPELINE_VERSION = "v1"
const OPERATION = "summary"

function hashInput(text: string) {
    return crypto.createHash("sha256").update(text).digest("hex")
}

export async function summaryText(originalText: string) {
    const prompt = buildSummaryPrompt(originalText)

    let lastError: unknown

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await gemini.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            summary: { type: "string" },
                            bulletPoints: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                            },
                        },
                        required: ["title", "summary", "bulletPoints"],
                    },
                },
            })

            const text = response?.text

            if (!text) {
                throw new Error("Gemini response text is missing")
            }

            const parsed = JSON.parse(text)

            return summarySchema.parse(parsed)
        } catch (error) {
            lastError = error
        }
    }

    throw lastError
}

export async function getCachedSummary(documentId: string, userId: string) {
    const { data: document, error } = await documentRepository.getDocumentById(documentId, userId)

    if (error || !document) {
        throw new Error("Document not found")
    }

    const originalText = typeof document.original_text === "string" ? document.original_text : ""
    if (!originalText.trim()) return null

    const inputHash = hashInput(originalText)
    const model = process.env.GEMINI_MODEL ?? GEMINI_MODEL

    return simplificationRepository.findCachedSimplification({
        documentId: document.id,
        operation: OPERATION,
        inputHash,
        pipelineVersion: PIPELINE_VERSION,
        model,
    })
}

export async function summarizeDocument(documentId: string, userId: string) {
    const { data: document, error } = await documentRepository.getDocumentById(
        documentId,
        userId,
    )

    if (error || !document) {
        throw new Error("Document not found")
    }

    const originalText = typeof document.original_text === "string" ? document.original_text : ""

    if (!originalText.trim()) {
        throw new Error("Document text is empty")
    }

    const inputHash = hashInput(originalText)
    const model = process.env.GEMINI_MODEL ?? GEMINI_MODEL

    const cached = await simplificationRepository.findCachedSimplification({
        documentId: document.id,
        operation: OPERATION,
        inputHash,
        pipelineVersion: PIPELINE_VERSION,
        model,
    })

    if (cached) {
        return { ...cached, cached: true }
    }

    const startedAt = Date.now()
    const result = await summaryText(originalText)
    const processingTime = Date.now() - startedAt

    const created = await simplificationRepository.createSimplification({
        document_id: document.id,
        user_id: userId,
        operation: OPERATION,
        result,
        provider: "google",
        model,
        pipeline_version: PIPELINE_VERSION,
        confidence: null,
        processing_time_ms: processingTime,
        validation_status: "pending",
        input_hash: inputHash,
    })

    return { ...created, cached: false }
}
