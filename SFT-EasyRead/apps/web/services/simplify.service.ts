import { gemini, GEMINI_MODEL } from "@repo/web/lib/gemini"
import { buildSimplifyPrompt } from "@repo/web/lib/prompts/simplify.prompt"
import { simplifySchema } from "@repo/schemas/simplify"
import * as documentRepository from "@repo/db/repositories/document";
import * as simplificationRepository from "@repo/db/repositories/simplification";
import crypto from "crypto";

export async function simplifyText(originalText: string) {
    const prompt = buildSimplifyPrompt(originalText)

    let lastError: unknown;

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
                            simplifiedText: { type: "string" },
                            difficultWords: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        word: { type: "string" },
                                        explanation: { type: "string" },
                                    },
                                    required: ["word", "explanation"],
                                },
                            },
                        },
                        required: ["title", "simplifiedText", "difficultWords"],
                    },
                },
            });

            const rawText = typeof response.text === "string" ? response.text : "";
            const parsed = JSON.parse(rawText || "{}")
            return simplifySchema.parse(parsed)
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError
}

function hashInput(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function simplifyDocument(documentId: string, userId: string) {
  const { data: document, error } = await documentRepository.getDocumentById(documentId, userId);

  if (error || !document) {
    throw new Error("Document not found");
  }

  const originalText = typeof document.original_text === "string" ? document.original_text : "";

  if (!originalText.trim()) {
    throw new Error("Document text is empty");
  }

  const inputHash = hashInput(originalText);

  const startedAt = Date.now();
  const result = await simplifyText(originalText);
  const processingTime = Date.now() - startedAt;

  return simplificationRepository.createSimplification({
    document_id: document.id,
    user_id: userId,
    operation: "simplify",
    result,
    provider: "google",
    model: process.env.GEMINI_MODEL ?? GEMINI_MODEL,
    pipeline_version: "v1",
    confidence: null,
    processing_time_ms: processingTime,
    validation_status: "pending",
    input_hash: inputHash,
  });
}