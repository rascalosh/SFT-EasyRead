export interface SemanticSimilarityResponse {
  similarity: number;
  model: string;
  processing_time_ms: number;
}

export class MLApiClient {
  private static baseUrl = process.env.ML_API_URL || "http://localhost:8000/api/v1";
  private static bypassSecret = process.env.ML_API_BYPASS_SECRET;

  static async checkSemanticSimilarity(
    original: string,
    simplified: string
  ): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/semantic/similarity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.bypassSecret && {
            "x-vercel-protection-bypass": this.bypassSecret,
          }),
        },
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