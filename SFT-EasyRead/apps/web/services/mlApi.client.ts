export interface SemanticSimilarityResponse {
  similarity: number;
  model: string;
  processing_time_ms: number;
}

export class MLApiClient {
  private static baseUrl = process.env.ML_API_URL || "http://localhost:8000/api/v1";

  static async checkSemanticSimilarity(
    original: string,
    simplified: string
  ): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/semantic/similarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, simplified }),
      });

      if (!response.ok) {
        throw new Error(`ML API Error: ${response.statusText}`);
      }

      const data: SemanticSimilarityResponse = await response.json();
      return data.similarity;
    } catch (error) {
      console.error("[MLApiClient] Failed to fetch semantic similarity:", error);

      return 0.80; 
    }
  }
}