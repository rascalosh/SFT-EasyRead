/**
 * Keterbacaan teks Bahasa Indonesia: Flesch-Kincaid dengan koreksi Hardjasujana.
 *
 * Konstanta Flesch/FK dikalibrasi untuk bahasa Inggris (~1,5 suku kata per
 * kata). Kata Bahasa Indonesia rata-rata ~2,7 suku kata, jadi dipakai mentah
 * FK tak pernah turun di bawah ~17 dan Reading Ease selalu negatif.
 *
 * Hardjasujana menetapkan koreksinya: jumlah suku kata dikalikan 0,6 sebelum
 * masuk rumus, dari temuan bahwa rasio suku kata Inggris : Indonesia = 6 : 10.
 * Faktor ini dipakai luas untuk Grafik Fry dalam penjenjangan buku teks sekolah.
 *
 * Setelah dikoreksi keduanya masuk akal: pada korpus EasyRead FRE-id jatuh di
 * 0–100 tanpa dijepit, dan FK-id terbaca sebagai jenjang kelas (catatan rapat
 * 2,8; esai padat 16,3).
 *
 * CATATAN: faktor 0,6 terdokumentasi untuk Grafik Fry. Menerapkannya ke
 * Flesch/FK adalah perluasan yang masuk akal — kedua rumus memakai
 * suku-kata-per-kata sebagai penggerak kesulitan kata — tapi itu penalaran
 * kami, bukan terbitan Hardjasujana. Sebutkan kalau dipakai di laporan.
 */

import { syllabify } from "@repo/web/lib/syllabify"

/** Rasio suku kata Inggris : Indonesia = 6 : 10 (Hardjasujana). */
export const SYLLABLE_ADJUSTMENT = 0.6

/** Konstanta Flesch-Kincaid Grade Level asli. */
const FK_ASL = 0.39
const FK_ASW = 11.8
const FK_BASE = 15.59

/** Konstanta Flesch Reading Ease asli. */
const FRE_BASE = 206.835
const FRE_ASL = 1.015
const FRE_ASW = 84.6

/**
 * Pemetaan FK-id ke level 1–10 untuk ditampilkan ke pengguna.
 * FK-id 3 -> 1, FK-id 7 -> 4 (ambang target tim), FK-id 15 -> 10.
 */
const LEVEL_FK_MIN = 3
const LEVEL_FK_MAX = 15

export const LEVEL_MIN = 1
export const LEVEL_MAX = 10

const LONG_WORD_SYLLABLES = 3
const HARD_WORD_SYLLABLES = 4

/** Label level, disandarkan ke jenjang sekolah Indonesia. */
const BANDS: Record<number, string> = {
    1: "SD awal", 2: "SD awal", 3: "SD akhir", 4: "SD akhir",
    5: "SMP", 6: "SMP", 7: "SMA", 8: "SMA",
    9: "perguruan tinggi", 10: "perguruan tinggi",
}

/** Singkatan yang titiknya BUKAN akhir kalimat. */
const ABBREVIATIONS = new Set([
    "dll", "dsb", "dst", "yg", "tsb", "sbb", "hal", "no", "nomor", "rp",
    "drs", "dr", "ir", "prof", "sdr", "kpd", "ttd", "jl", "gg", "kec",
    "kel", "kab", "prov", "telp", "ext", "vol", "ed", "cet", "terj",
    "pen", "hlm", "pt", "cv", "tbk", "swt", "saw",
])

/** Cukup sekian karakter sebelum titik untuk menguji singkatan terpanjang. */
const LOOKBEHIND = 40

const SENTENCE_END = /([.!?]+|\n{2,})(\s+|$)/g
const WORD = /[A-Za-z]+(?:-[A-Za-z]+)?/g

export type Difficulty = {
    /** 1–10 untuk ditampilkan ke pengguna. */
    level: number
    band: string
    /** Flesch-Kincaid terkoreksi Indonesia. Makin tinggi makin sulit. */
    fkId: number
    /** Flesch Reading Ease terkoreksi Indonesia. Makin tinggi makin mudah. */
    freId: number
    wordsPerSentence: number
    /** Mentah, belum dikali 0,6 — supaya angka aslinya tidak hilang. */
    syllablesPerWord: number
    longWordRatio: number
    words: number
    sentences: number
}

/**
 * Pecah teks jadi kalimat, sadar singkatan.
 *
 * Baris daftar ("- poin", "1. poin") sering tanpa titik; tiap baris dihitung
 * satu kalimat supaya dokumen berbentuk daftar tidak terbaca sebagai satu
 * kalimat raksasa dan levelnya melonjak palsu.
 */
export function splitSentences(text: string, options?: { minWords?: number }): string[] {
    const minWords = options?.minWords ?? 3
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const sentences: string[] = []
    let buffer = ""
    let cursor = 0

    SENTENCE_END.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = SENTENCE_END.exec(normalized)) !== null) {
        const end = match.index + match[0].length
        buffer += normalized.slice(cursor, end)
        cursor = end

        // Hanya ekor pendek sebelum titik yang diperlukan; memakai seluruh
        // prefiks membuat pemeriksaan ini O(n) per kalimat -> O(n^2) total.
        const head = normalized.slice(Math.max(0, match.index - LOOKBEHIND), match.index)
        const lastWord = head.split(/[\s(]/).pop()?.replace(/\.+$/, "").toLowerCase() ?? ""
        if (ABBREVIATIONS.has(lastWord)) continue

        const candidate = buffer.trim()
        buffer = ""
        if (candidate) sentences.push(candidate)
    }

    const tail = (buffer + normalized.slice(cursor)).trim()
    if (tail) sentences.push(tail)

    const exploded: string[] = []
    for (const sentence of sentences) {
        const lines = sentence.split("\n").map((line) => line.trim()).filter(Boolean)
        if (lines.length > 1 && lines.every((line) => line.length < 200)) {
            exploded.push(...lines)
        } else if (lines.length) {
            exploded.push(lines.join(" "))
        }
    }

    return exploded.filter((s) => countWords(s) >= minWords)
}

function countWords(text: string): number {
    return text.match(WORD)?.length ?? 0
}

function wordsOf(text: string): string[] {
    return text.match(WORD) ?? []
}

/** Jumlah suku kata, memakai pemecah yang sama dengan fitur Syllable Breaker. */
export function countSyllables(word: string): number {
    return Math.max(syllabify(word).length, 1)
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits
    return Math.round(value * factor) / factor
}

/** FK-id dari kata per kalimat dan suku kata per kata (mentah, belum dikali 0,6). */
export function fleschKincaidId(wordsPerSentence: number, syllablesPerWord: number): number {
    return FK_ASL * wordsPerSentence + FK_ASW * SYLLABLE_ADJUSTMENT * syllablesPerWord - FK_BASE
}

/** FRE-id dari kata per kalimat dan suku kata per kata (mentah, belum dikali 0,6). */
export function fleschReadingEaseId(wordsPerSentence: number, syllablesPerWord: number): number {
    return FRE_BASE - FRE_ASL * wordsPerSentence - FRE_ASW * SYLLABLE_ADJUSTMENT * syllablesPerWord
}

/** Skala FK-id ke level 1–10 yang ditampilkan ke pengguna. */
export function levelFromFk(fkId: number): number {
    const scaled =
        LEVEL_MIN +
        ((LEVEL_MAX - LEVEL_MIN) * (fkId - LEVEL_FK_MIN)) / (LEVEL_FK_MAX - LEVEL_FK_MIN)
    return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, Math.round(scaled)))
}

/** Hitung keterbacaan teks Indonesia. */
export function measureDifficulty(text: string): Difficulty {
    const sentences = splitSentences(text)
    const words = wordsOf(text)

    if (words.length === 0) {
        return {
            level: LEVEL_MIN, band: BANDS[LEVEL_MIN]!, fkId: 0, freId: 100,
            wordsPerSentence: 0, syllablesPerWord: 0, longWordRatio: 0,
            words: 0, sentences: 0,
        }
    }

    const syllables = words.map(countSyllables)
    const totalSentences = Math.max(sentences.length, 1)

    const wordsPerSentence = words.length / totalSentences
    const syllablesPerWord = syllables.reduce((sum, n) => sum + n, 0) / words.length
    const longWordRatio =
        syllables.filter((n) => n >= LONG_WORD_SYLLABLES).length / words.length

    const fkId = fleschKincaidId(wordsPerSentence, syllablesPerWord)
    const freId = fleschReadingEaseId(wordsPerSentence, syllablesPerWord)

    const level = levelFromFk(fkId)

    return {
        level,
        band: BANDS[level]!,
        fkId: round(fkId, 2),
        freId: round(freId, 1),
        wordsPerSentence: round(wordsPerSentence, 2),
        syllablesPerWord: round(syllablesPerWord, 3),
        longWordRatio: round(longWordRatio, 3),
        words: words.length,
        sentences: sentences.length,
    }
}

/** Kalimat yang melebihi batas kata — umpan balik konkret untuk revisi. */
export function offendingSentences(text: string, maxWords: number): string[] {
    return splitSentences(text).filter((s) => countWords(s) > maxWords)
}

/**
 * Kata terpanjang yang layak diganti — umpan balik konkret untuk revisi.
 *
 * Diperiksa per kalimat: kata pertama tiap kalimat selalu berhuruf kapital
 * karena posisinya, bukan karena nama diri. Memindai teks sebagai satu aliran
 * membuat setiap kata sulit yang mengawali kalimat luput dari daftar revisi.
 */
export function hardWords(text: string, limit = 10): string[] {
    const seen = new Map<string, number>()

    for (const sentence of splitSentences(text)) {
        let atSentenceStart = true

        for (const raw of sentence.split(/\s+/)) {
            const cleaned = raw.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")
            if (!cleaned) continue

            // Penanda butir ("-", "•") bukan kata; kata sesudahnyalah yang
            // mengawali kalimat, jadi kapitalnya karena posisi.
            const isProperNoun = !atSentenceStart && /^[A-Z]/.test(cleaned)
            atSentenceStart = false
            if (isProperNoun) continue

            const count = countSyllables(cleaned)
            if (count >= HARD_WORD_SYLLABLES) seen.set(cleaned.toLowerCase(), count)
        }
    }

    return [...seen.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word]) => word)
}

/**
 * Apakah teks sumber sudah ringkas (catatan/daftar berkalimat pendek).
 *
 * Penting: pada dokumen semacam ini, meringkas jadi prosa justru MENAIKKAN
 * level kesulitan — terukur pada benchmark, catatan rapat naik +2 level.
 */
export function isAlreadyTerse(text: string): boolean {
    const { wordsPerSentence } = measureDifficulty(text)
    return wordsPerSentence > 0 && wordsPerSentence <= 10
}

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
