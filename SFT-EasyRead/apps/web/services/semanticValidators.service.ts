import { MLApiClient } from "./mlApi.client";
import { DeterministicValidators } from "./deterministicValidators";

export interface ValidationResult {
  passed: boolean;
  similarityScore: number;
  reasons: string[];
}

export class SemanticValidatorService {
  static async validateParagraph(
    original: string,
    simplified: string
  ): Promise<ValidationResult> {
    const reasons: string[] = [];

    // 1. Cek Embedding Similarity via FastAPI ML API
    const similarityScore = await MLApiClient.checkSemanticSimilarity(
      original,
      simplified
    );

    if (similarityScore < 0.85) {
      reasons.push(`Skor kemiripan makna terlalu rendah (${similarityScore.toFixed(2)} < 0.85).`);
    }

    // 2. Cek Angka
    const numberVal = DeterministicValidators.validateNumbers(original, simplified);
    if (!numberVal.passed) {
      reasons.push(...numberVal.errors);
    }

    // 3. Cek Negasi
    const negationVal = DeterministicValidators.validateNegations(original, simplified);
    if (!negationVal.passed) {
      reasons.push(...negationVal.errors);
    }

    const passed = similarityScore >= 0.85 && numberVal.passed && negationVal.passed;

    return {
      passed,
      similarityScore,
      reasons,
    };
  }
}