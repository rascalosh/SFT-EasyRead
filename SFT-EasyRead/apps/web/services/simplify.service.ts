import { generateStructured, activeModel } from "@repo/web/lib/gemini"
import { buildSimplifyPrompt } from "@repo/web/lib/prompts/simplify.prompt"
import { simplifySchema } from "@repo/schemas/simplify"
import * as documentRepository from "@repo/db/repositories/document"
import * as simplificationRepository from "@repo/db/repositories/simplification"
import crypto from "crypto"

const PIPELINE_VERSION = "v1"
const OPERATION = "simplify"

export async function simplifyText(originalText: string) {
    // Skema JSON untuk Gemini diturunkan langsung dari skema Zod, jadi tidak
    // ada lagi dua definisi yang bisa melenceng satu sama lain.
    return generateStructured(simplifySchema, buildSimplifyPrompt(originalText))
}

function hashInput(text: string) {
    return crypto.createHash("sha256").update(text).digest("hex")
}

export async function getCachedSimplification(documentId: string, userId: string) {
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

export async function simplifyDocument(documentId: string, userId: string) {
    const { data: document, error } = await documentRepository.getDocumentById(documentId, userId)

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
    const result = await simplifyText(originalText)
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
