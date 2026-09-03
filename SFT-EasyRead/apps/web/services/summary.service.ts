import crypto from "crypto"

import { gemini, GEMINI_MODEL } from "@repo/web/lib/gemini"
import { buildSummaryPrompt } from "@repo/web/lib/prompts/summary.prompt"
import { summarySchema } from "@repo/schemas/summary"

import * as documentRepository from "@repo/db/repositories/document"
import * as simplificationRepository from "@repo/db/repositories/simplification"



function hashInput(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function summaryText(originalText: string) {
  const prompt = buildSummaryPrompt(originalText);

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
      });

      const text = response?.text;

      if (!text) {
        throw new Error("Gemini response text is missing");
      }

      const parsed = JSON.parse(text);

      return summarySchema.parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}


export async function summarizeDocument(
  documentId: string,
  userId: string
) {
  const { data: document, error } = await documentRepository.getDocumentById(
    documentId,
    userId
  );

  if (!document) {
    throw new Error("Document not found");
  }

  const startedAt = Date.now();

  const result = await summaryText(document.original_text);

  const processingTime = Date.now() - startedAt;

  return simplificationRepository.createSimplification({
    document_id: document.id,
    user_id: userId,
    operation: "summary",
    result,
    provider: "google",
    model: GEMINI_MODEL,
    pipeline_version: "v1",
    confidence: null,
    processing_time_ms: processingTime,
    validation_status: "pending",
    input_hash: hashInput(document.original_text),
  });
}