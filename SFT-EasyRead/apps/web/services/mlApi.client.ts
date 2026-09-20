export interface SemanticSimilarityResponse {
  similarity: number;
  model: string;
  processing_time_ms: number;
}

/** Jangan tahan pipeline Gemini kalau FastAPI hang saat load model. */
const ML_TIMEOUT_MS = 4_000

export class MLApiClient {
  private static baseUrl = process.env.ML_API_URL || "http://localhost:8000/api/v1";

  static async checkSemanticSimilarity(
    original: string,
    simplified: string
  ): Promise<number | null> {
    try {
      const response = await fetch(`${this.baseUrl}/semantic/similarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, simplified }),
        signal: AbortSignal.timeout(ML_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`ML API Error: ${response.statusText}`);
      }

      const data: SemanticSimilarityResponse = await response.json();
      return data.similarity;
    } catch (error) {
      console.warn("[MLApiClient] Semantic similarity unavailable; skipping that check.", error);
      return null;
    }
  }
}
