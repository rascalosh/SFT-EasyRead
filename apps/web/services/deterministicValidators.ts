const NEGATION_WORDS = ["tidak", "bukan", "belum", "jangan", "tanpa", "tak"];

export interface ValidationDetail {
  passed: boolean;
  errors: string[];
}

export class DeterministicValidators {
  /**
   * Validasi Perubahan Angka
   */
  static validateNumbers(original: string, simplified: string): ValidationDetail {
    // Pastikan return type selalu string[]
    const extractNumbers = (text: string): string[] => {
      const matches = text.match(/\d+([.,]\d+)?/g);
      return matches ? Array.from(matches) : [];
    };
    
    const origNumbers = extractNumbers(original);
    const simpNumbers = extractNumbers(simplified);

    const errors: string[] = [];

    for (const num of origNumbers) {
      if (!simpNumbers.includes(num)) {
        errors.push(`Angka '${num}' dari teks asli hilang atau berubah.`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }

  /**
   * Validasi Kata Negasi
   */
  static validateNegations(original: string, simplified: string): ValidationDetail {
    const errors: string[] = [];

    for (const word of NEGATION_WORDS) {
      const origHas = new RegExp(`\\b${word}\\b`, "i").test(original);
      const simpHas = new RegExp(`\\b${word}\\b`, "i").test(simplified);

      if (origHas && !simpHas) {
        errors.push(`Kata negasi '${word}' hilang pada teks simplifikasi.`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }
}