import { generateStructured, activeModel } from "@repo/web/lib/gemini"
import { buildSimplifyPrompt } from "@repo/web/lib/prompts/simplify.prompt"
import { simplifySchema, type SimplifyResult } from "@repo/schemas/simplify"
import * as documentRepository from "@repo/db/repositories/document"
import * as simplificationRepository from "@repo/db/repositories/simplification"
import { createClient } from "@repo/db/server"
import crypto from "crypto"
import { SemanticValidatorService } from "@repo/web/services/semanticValidators.service"
import { ReadabilityMetrics } from "@/lib/readability"

const PIPELINE_VERSION = "v1"
const OPERATION = "simplify"
const MAX_RETRIES = 2

export async function simplifyText(originalText: string, feedback?: string[]): Promise<SimplifyResult> {
    const prompt = buildSimplifyPrompt(originalText, feedback)
    const response = await generateStructured(simplifySchema, prompt)
    return response as SimplifyResult
}

function hashInput(text: string) {
    return crypto.createHash("sha256").update(text).digest("hex")
}

function errorCode(error: unknown): string {
    if (!error || typeof error !== "object" || !("code" in error)) return ""
    return String((error as { code: unknown }).code)
}

async function saveSimplification(payload: Parameters<typeof simplificationRepository.createSimplification>[0]) {
    try {
        return await simplificationRepository.createSimplification(payload)
    } catch (error) {
        if (errorCode(error) !== "23505") throw error

        const supabase = await createClient()
        const { data: existing, error: findError } = await supabase
            .from("simplifications")
            .select("id")
            .eq("user_id", payload.user_id)
            .eq("input_hash", payload.input_hash)
            .eq("operation", payload.operation)
            .eq("pipeline_version", payload.pipeline_version)
            .maybeSingle()

        if (findError || !existing?.id) throw error

        const { data, error: updateError } = await supabase
            .from("simplifications")
            .update({
                result: payload.result,
                provider: payload.provider,
                model: payload.model,
                confidence: payload.confidence,
                original_readability_score: payload.original_readability_score,
                simplified_readability_score: payload.simplified_readability_score,
                processing_time_ms: payload.processing_time_ms,
                validation_status: payload.validation_status,
            })
            .eq("id", existing.id)
            .select()
            .single()

        if (updateError) throw updateError
        return data
    }
}

function isCompleteSimplifyCache(row: {
    original_readability_score?: unknown
    simplified_readability_score?: unknown
    result?: unknown
} | null) {
    if (!row) return false
    if (typeof row.original_readability_score !== "number") return false
    if (typeof row.simplified_readability_score !== "number") return false
    const result = row.result
    if (!result || typeof result !== "object") return false
    const paragraphs = (result as { paragraphs?: unknown }).paragraphs
    return Array.isArray(paragraphs) && paragraphs.length > 0
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

    if (cached && isCompleteSimplifyCache(cached)) {
        return { ...cached, cached: true }
    }

    const startedAt = Date.now()

    // 1. Generate Simplifikasi Pertama
    const result = await simplifyText(originalText)

    // 2. Multi-Layer Validation Loop
    const validatedParagraphs: SimplifyResult["paragraphs"] = []
    const similarityScores: number[] = []
    let hasFallback = false

    // Lakukan validasi per paragraf
    for (let i = 0; i < result.paragraphs.length; i++) {
        let paragraph = result.paragraphs[i];
        
        if (!paragraph) continue; 

        let pAttempts = 0;
        let isValid = false;
        let lastScore = 0;
        let errors: string[] = [];

        while (pAttempts <= MAX_RETRIES && !isValid) {
            const validation = await SemanticValidatorService.validateParagraph(
                paragraph.original,
                paragraph.simplified
            );

            lastScore = validation.similarityScore;

            if (validation.passed) {
                isValid = true;
                similarityScores.push(lastScore);
                validatedParagraphs.push(paragraph);
            } else {
                errors = validation.reasons;
                pAttempts++;

                if (pAttempts <= MAX_RETRIES) {
                    // Regenerate khusus paragraf yang bermasalah dengan Feedback
                    const retryResult = await simplifyText(paragraph.original, errors);
                    
                    const newParagraph = retryResult.paragraphs?.[0];
                    if (newParagraph) {
                        paragraph = newParagraph;
                    }
                }
            }
        }

        // 3. Fallback jika Max Retry Lampaui dan Masih Gagal Validasi
        if (!isValid) {
            hasFallback = true;
            similarityScores.push(1.0); // Teks asli identik 100%
            validatedParagraphs.push({
                ...paragraph,
                simplified: paragraph.original, // Guardrail Fallback
            });
        }
    }

    const processingTime = Date.now() - startedAt

    // 4. Hitung Metrik Keterbacaan Bahasa Indonesia (Flesch Calibration Formula)
    const simplifiedFullText = validatedParagraphs.map(p => p.simplified).join(" ");
    const originalReadabilityScore = ReadabilityMetrics.calculateIndonesianScore(originalText);
    const simplifiedReadabilityScore = ReadabilityMetrics.calculateIndonesianScore(simplifiedFullText);

    console.log(`[Readability] Asli: ${originalReadabilityScore} | Hasil: ${simplifiedReadabilityScore}`);

    // Metrik Agregat
    const avgConfidence = similarityScores.length
        ? similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length
        : null

    const validationStatus = hasFallback ? "fallback" : "valid";

    const finalResult: SimplifyResult = {
        ...result,
        paragraphs: validatedParagraphs,
    }

    // 5. Save to Repository dengan Metadata Guardrail Lengkap
    const payload = {
        document_id: document.id,
        user_id: userId,
        operation: OPERATION,
        result: finalResult,
        provider: "google" as const,
        model,
        pipeline_version: PIPELINE_VERSION,
        confidence: avgConfidence ? Number(avgConfidence.toFixed(4)) : null,
        original_readability_score: originalReadabilityScore,
        simplified_readability_score: simplifiedReadabilityScore,
        processing_time_ms: processingTime,
        validation_status: validationStatus,
        input_hash: inputHash,
    }

    const created = await saveSimplification(payload)

    return {
        ...created,
        result: created.result as SimplifyResult,
        cached: false,
    }
}