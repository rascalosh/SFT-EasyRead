import { generateStructured, activeModel, isRateLimited } from "@repo/web/lib/gemini"
import { buildSimplifyPrompt, buildStructuredSimplifyPrompt } from "@repo/web/lib/prompts/simplify.prompt"
import {
    simplifySchema,
    structuredSimplifySchema,
    type SimplifyResult,
    type SimplifyStyle,
    type StructuredSimplifyStored,
} from "@repo/schemas/simplify"
import * as documentRepository from "@repo/db/repositories/document"
import * as simplificationRepository from "@repo/db/repositories/simplification"
import { createClient } from "@repo/db/server"
import crypto from "crypto"
import { SemanticValidatorService } from "@repo/web/services/semanticValidators.service"
import { DeterministicValidators } from "@repo/web/services/deterministicValidators"
import { MLApiClient } from "@repo/web/services/mlApi.client"
import { ReadabilityMetrics } from "@/lib/readability"
import { markdownToPlainText } from "@/lib/markdown-text"

const OPERATION = "simplify"
const MAX_RETRIES = 2

/**
 * Dua versi Simplify disimpan di tabel yang sama (`operation = 'simplify'`)
 * dan dibedakan lewat `pipeline_version`, yang memang bagian dari kunci cache
 * dan unique constraint. Jadi tidak perlu melebarkan CHECK kolom operation.
 */
const PIPELINE_VERSION: Record<SimplifyStyle, string> = {
    plain: "v1",
    structured: "structured-v1",
}

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

async function findExistingSimplification(payload: {
    user_id: string
    input_hash: string
    operation: string
    pipeline_version: string
    model: string
}) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("simplifications")
        .select("id")
        .eq("user_id", payload.user_id)
        .eq("input_hash", payload.input_hash)
        .eq("operation", payload.operation)
        .eq("pipeline_version", payload.pipeline_version)
        .eq("model", payload.model)
        .maybeSingle()

    if (error) throw error
    return data
}

async function updateSimplificationById(
    id: string,
    payload: Parameters<typeof simplificationRepository.createSimplification>[0],
) {
    const supabase = await createClient()
    const { data, error } = await supabase
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
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data
}

async function insertSimplification(
    payload: Parameters<typeof simplificationRepository.createSimplification>[0],
) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("simplifications")
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

async function saveSimplification(payload: Parameters<typeof simplificationRepository.createSimplification>[0]) {
    try {
        return await simplificationRepository.createSimplification(payload)
    } catch (error) {
        const code = errorCode(error)

        // Unique constraint dilanggar, atau ON CONFLICT tidak cocok dengan unique
        // di database ini (42P10). Cari baris yang ada lalu update; kalau belum
        // ada, insert biasa.
        if (code !== "23505" && code !== "42P10") throw error

        const existing = await findExistingSimplification(payload).catch(() => null)
        if (existing?.id) return updateSimplificationById(existing.id, payload)

        try {
            return await insertSimplification(payload)
        } catch (insertError) {
            if (errorCode(insertError) !== "23505") throw insertError
            const row = await findExistingSimplification(payload)
            if (!row?.id) throw insertError
            return updateSimplificationById(row.id, payload)
        }
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
    const { paragraphs, markdown } = result as { paragraphs?: unknown; markdown?: unknown }
    if (typeof markdown === "string" && markdown.trim()) return true
    return Array.isArray(paragraphs) && paragraphs.length > 0
}

export async function getCachedSimplification(
    documentId: string,
    userId: string,
    style: SimplifyStyle = "plain",
) {
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
        pipelineVersion: PIPELINE_VERSION[style],
        model,
    })
}

/**
 * Versi 2: satu dokumen Markdown terstruktur. Validasinya per dokumen, bukan
 * per paragraf — bentuknya sengaja berubah (judul, poin, tabel) sehingga
 * pemetaan paragraf asli → hasil tidak lagi berlaku. Yang dijaga ketat adalah
 * angka dan kata negasi; kemiripan makna dicatat sebagai confidence.
 */
async function simplifyStructuredDocument(input: {
    documentId: string
    userId: string
    originalText: string
    inputHash: string
    model: string
}) {
    const { documentId, userId, originalText, inputHash, model } = input
    const startedAt = Date.now()

    let feedback: string[] | undefined
    let errors: string[] = []
    let result = await generateStructured(structuredSimplifySchema, buildStructuredSimplifyPrompt(originalText))
    let plain = markdownToPlainText(result.markdown)

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            try {
                result = await generateStructured(
                    structuredSimplifySchema,
                    buildStructuredSimplifyPrompt(originalText, feedback),
                )
                plain = markdownToPlainText(result.markdown)
            } catch (error) {
                // Hasil pertama tetap dipakai daripada membakar kuota dan gagal total.
                if (isRateLimited(error)) break
                throw error
            }
        }

        const numbers = DeterministicValidators.validateNumbers(originalText, plain)
        const negations = DeterministicValidators.validateNegations(originalText, plain)
        errors = [...numbers.errors, ...negations.errors]

        if (!errors.length) break
        feedback = errors
    }

    const similarity = await MLApiClient.checkSemanticSimilarity(originalText, plain)
    const processingTime = Date.now() - startedAt

    const originalReadabilityScore = ReadabilityMetrics.calculateIndonesianScore(originalText)
    const simplifiedReadabilityScore = ReadabilityMetrics.calculateIndonesianScore(plain)

    console.log(`[Readability/structured] Asli: ${originalReadabilityScore} | Hasil: ${simplifiedReadabilityScore}`)

    const stored: StructuredSimplifyStored = {
        title: result.title,
        markdown: result.markdown.trim(),
        format: "markdown",
    }

    const payload = {
        document_id: documentId,
        user_id: userId,
        operation: OPERATION,
        result: stored,
        provider: "google" as const,
        model,
        pipeline_version: PIPELINE_VERSION.structured,
        confidence: similarity != null ? Number(similarity.toFixed(4)) : null,
        original_readability_score: originalReadabilityScore,
        simplified_readability_score: simplifiedReadabilityScore,
        processing_time_ms: processingTime,
        // "pending": angka/negasi masih ada yang tidak cocok setelah retry;
        // hasil tetap ditampilkan tapi pembaca diberi tahu untuk mengecek.
        validation_status: errors.length ? ("pending" as const) : ("valid" as const),
        input_hash: inputHash,
    }

    const created = await saveSimplification(payload)

    return {
        ...created,
        result: created.result as StructuredSimplifyStored,
        cached: false,
    }
}

export async function simplifyDocument(
    documentId: string,
    userId: string,
    style: SimplifyStyle = "plain",
) {
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
        pipelineVersion: PIPELINE_VERSION[style],
        model,
    })

    if (cached && isCompleteSimplifyCache(cached)) {
        return { ...cached, cached: true }
    }

    if (style === "structured") {
        return simplifyStructuredDocument({
            documentId: document.id,
            userId,
            originalText,
            inputHash,
            model,
        })
    }

    const startedAt = Date.now()

    // 1. Generate Simplifikasi Pertama
    const result = await simplifyText(originalText)

    // 2. Multi-Layer Validation Loop
    const validatedParagraphs: SimplifyResult["paragraphs"] = []
    const similarityScores: number[] = []
    let hasFallback = false

    // Lakukan validasi per paragraf. Kalau kuota Gemini habis di tengah jalan,
    // paragraf sisa memakai draf yang sudah ada — jangan panggil model lagi.
    let quotaExhausted = false

    for (let i = 0; i < result.paragraphs.length; i++) {
        let paragraph = result.paragraphs[i];
        
        if (!paragraph) continue; 

        if (quotaExhausted) {
            hasFallback = true
            similarityScores.push(0)
            validatedParagraphs.push(paragraph)
            continue
        }

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
                    try {
                        const retryResult = await simplifyText(paragraph.original, errors);
                        const newParagraph = retryResult.paragraphs?.[0];
                        if (newParagraph) {
                            paragraph = newParagraph;
                        }
                    } catch (error) {
                        if (isRateLimited(error)) {
                            quotaExhausted = true
                            break
                        }
                        throw error
                    }
                }
            }
        }

        // 3. Fallback jika Max Retry Lampaui dan Masih Gagal Validasi
        if (!isValid) {
            hasFallback = true
            if (quotaExhausted) {
                similarityScores.push(lastScore)
                validatedParagraphs.push(paragraph)
            } else {
                similarityScores.push(1.0)
                validatedParagraphs.push({
                    ...paragraph,
                    simplified: paragraph.original,
                })
            }
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
        pipeline_version: PIPELINE_VERSION.plain,
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