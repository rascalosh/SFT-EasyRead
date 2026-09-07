import crypto from "crypto"

import { generateStructured, activeModel } from "@repo/web/lib/gemini"
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
    // Batas 3–5 poin ringkasan kini ikut terkirim ke Gemini karena skemanya
    // diturunkan dari Zod; sebelumnya batas itu hanya ada di sisi validasi
    // sehingga jawaban 2 atau 6 poin lolos lalu gagal dan membakar retry.
    return generateStructured(summarySchema, buildSummaryPrompt(originalText))
}

export async function getCachedSummary(documentId: string, userId: string) {
    const { data: document, error } = await documentRepository.getDocumentById(documentId, userId)

    if (error || !document) {
        throw new Error("Document not found")
    }

    const originalText = typeof document.original_text === "string" ? document.original_text : ""
    if (!originalText.trim()) return null

    const inputHash = hashInput(originalText)
    const model = activeModel()

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
    const model = activeModel()

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
