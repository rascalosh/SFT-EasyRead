export class ReadabilityMetrics {
    /**
     * Memecah teks menjadi jumlah kalimat
     */
    static countSentences(text: string): number {
        // Pisahkan berdasarkan titik, tanda seru, atau tanda tanya
        const sentences = text.split(/[.!?]+/);
        return sentences.filter((s) => s.trim().length > 0).length;
    }

    /**
     * Memecah teks menjadi jumlah kata murni (tanpa tanda baca)
     */
    static countWords(text: string): number {
        // Hapus karakter selain huruf, angka, dan spasi
        const cleanText = text.replace(/[^\w\s]/g, "");
        const words = cleanText.trim().split(/\s+/);
        return words.filter((w) => w.length > 0).length;
    }

    /**
     * Menghitung estimasi suku kata bahasa Indonesia
     */
    static countSyllables(text: string): number {
        const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, "");
        const words = cleanText.trim().split(/\s+/);
        
        let totalSyllables = 0;

        for (const word of words) {
            if (word.length === 0) continue;
            // Setiap kelompok huruf vokal dihitung sebagai 1 suku kata
            const vowelGroups = word.match(/[aiueo]+/g);
            totalSyllables += vowelGroups ? vowelGroups.length : 1;
        }

        return totalSyllables;
    }

    /**
     * Formula Kalibrasi Flesch untuk Bahasa Indonesia
     */
    static calculateIndonesianScore(text: string): number {
        const totalSentences = this.countSentences(text);
        const totalWords = this.countWords(text);
        const totalSyllables = this.countSyllables(text);

        if (totalWords === 0 || totalSentences === 0) return 0;

        const wordsPerSentence = totalWords / totalSentences;
        const syllablesPerWord = totalSyllables / totalWords;

        const score = 
            277.0698 - 
            (0.9358 * wordsPerSentence) - 
            (77.9946 * syllablesPerWord);

        return Number(score.toFixed(2));
    }
}