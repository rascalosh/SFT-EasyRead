import crypto from "crypto"

import { activeModel } from "@repo/web/lib/gemini"
import { summarizeText, type SummaryOptions } from "@repo/web/lib/summarize"
import type { StoredSummary } from "@repo/schemas/summary"

import * as documentRepository from "@repo/db/repositories/document"
import * as simplificationRepository from "@repo/db/repositories/simplification"

// Bagian dari kunci cache: tanpa dinaikkan, dokumen yang pernah diringkas
// selamanya menyajikan hasil prompt lama.
const PIPELINE_VERSION = "v2"
const OPERATION = "summary"

function hashInput(text: string) {
    return crypto.createHash("sha256").update(text).digest("hex")
}

export async function summaryText(originalText: string, options: SummaryOptions = {}) {
    return summarizeText(originalText, options)
}

/** Porsi penurunan level yang tercapai. Kolom numeric(5,4), dibatasi 0..1. */
function confidenceFor(result: StoredSummary) {
    if (result.difficulty.level <= result.targetLevel) return 1
    const needed = Math.max(1, result.sourceDifficulty.level - result.targetLevel)
    const achieved = result.sourceDifficulty.level - result.difficulty.level
    return Math.round(Math.max(0, Math.min(1, achieved / needed)) * 10000) / 10000
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
        confidence: confidenceFor(result),
        processing_time_ms: processingTime,
        // Kolomnya dibatasi CHECK ke pending|valid|rejected|fallback — JANGAN "passed".
        validation_status: result.difficulty.level <= result.targetLevel ? "valid" : "pending",
        input_hash: inputHash,
    })

    return { ...created, cached: false }
}
