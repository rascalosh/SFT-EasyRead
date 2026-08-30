import { gemini, GEMINI_MODEL } from "@repo/web/lib/gemini";
import { buildSummaryPrompt } from "@repo/web/lib/prompts/summary.prompt";
import { summarySchema } from "@repo/schemas/summary";

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

      const parsed = JSON.parse(response?.text);

      return summarySchema.parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}