/**
 * Alignment transkrip vs teks acuan — rule-based, tanpa AI.
 *
 * PLAN.md tegas: Gemini tidak dipakai untuk menghitung hasil asesmen maupun
 * memberi feedback dasar. Semua angka di sini deterministik dan feedbacknya
 * dari template, bukan diagnosis.
 */

import type { AlignmentStatus, SpeechScore } from "@repo/schemas/speech"

export type AlignedWord = {
    position: number
    expectedWord: string | null
    spokenWord: string | null
    status: AlignmentStatus
}

export type AlignmentMetrics = {
    alignment: AlignedWord[]
    correctWords: number
    substitutions: number
    omissions: number
    insertions: number
    repetitions: number
    wordAccuracy: number
    wordErrorRate: number
    wordsPerMinute: number
    referenceWordCount: number
    spokenWordCount: number
}

/** Buang tanda baca, samakan huruf kecil — "Merdeka!" dan "merdeka" sama. */
export function tokenizeWords(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
}

/**
 * Jarak edit level kata (Levenshtein) dengan backtrace, supaya tiap kata dapat
 * label correct/substitution/omission/insertion.
 *
 * Biaya dibuat bilangan bulat (×100) agar perbandingan di backtrace persis.
 * Menyisipkan kata yang mengulang kata sebelumnya dihargai sedikit lebih murah
 * (99, bukan 100). Tanpa pembobotan itu, membaca "untuk untuk merdeka" untuk
 * teks "untuk merdeka sangat" berbiaya sama antara "dua kata salah ucap" dan
 * "satu pengulangan + satu kata terlewat", lalu tie-break memilih yang pertama
 * sehingga pengulangan dan kata terlewat tidak pernah terdeteksi — padahal
 * keduanya justru indikator yang dinilai di proposal.
 */
const COST = 100
const REPEAT_INSERT_COST = 99

function align(reference: string[], spoken: string[]): AlignedWord[] {
    const rows = reference.length
    const cols = spoken.length

    // Biaya menyisipkan spoken[j - 1].
    const insertCost = (j: number) =>
        j >= 2 && spoken[j - 1] === spoken[j - 2] ? REPEAT_INSERT_COST : COST

    // dp[i][j] = biaya minimal menyelaraskan reference[0..i) dengan spoken[0..j).
    const dp: number[][] = Array.from({ length: rows + 1 }, () =>
        new Array<number>(cols + 1).fill(0),
    )

    for (let i = 1; i <= rows; i++) dp[i]![0] = i * COST
    for (let j = 1; j <= cols; j++) dp[0]![j] = dp[0]![j - 1]! + insertCost(j)

    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            const same = reference[i - 1] === spoken[j - 1]

            dp[i]![j] = Math.min(
                dp[i - 1]![j - 1]! + (same ? 0 : COST),
                dp[i - 1]![j]! + COST,
                dp[i]![j - 1]! + insertCost(j),
            )
        }
    }

    const result: AlignedWord[] = []
    let i = rows
    let j = cols

    while (i > 0 || j > 0) {
        const expected = i > 0 ? reference[i - 1]! : null
        const said = j > 0 ? spoken[j - 1]! : null
        const same = i > 0 && j > 0 && expected === said

        if (i > 0 && j > 0 && dp[i]![j] === dp[i - 1]![j - 1]! + (same ? 0 : COST)) {
            result.push({
                position: 0,
                expectedWord: expected,
                spokenWord: said,
                status: same ? "correct" : "substitution",
            })
            i--
            j--
        } else if (j > 0 && dp[i]![j] === dp[i]![j - 1]! + insertCost(j)) {
            // Kata terucap yang tidak ada di teks acuan.
            result.push({ position: 0, expectedWord: null, spokenWord: said, status: "insertion" })
            j--
        } else {
            // Kata di teks acuan tidak terucap.
            result.push({ position: 0, expectedWord: expected, spokenWord: null, status: "omission" })
            i--
        }
    }

    return result.reverse().map((word, index) => ({ ...word, position: index }))
}

/**
 * Sisipan yang mengulang kata tetangga bukan kesalahan baca, melainkan
 * pengulangan — indikator kelancaran yang dihitung terpisah di proposal.
 */
function markRepetitions(alignment: AlignedWord[]): AlignedWord[] {
    return alignment.map((word, index) => {
        if (word.status !== "insertion" || !word.spokenWord) return word

        const previous = alignment[index - 1]
        const next = alignment[index + 1]
        const echoesPrevious = previous?.spokenWord === word.spokenWord
        const echoesNext = next?.expectedWord === word.spokenWord

        return echoesPrevious || echoesNext ? { ...word, status: "repetition" as const } : word
    })
}

export function alignReading(
    referenceText: string,
    transcript: string,
    durationSeconds: number,
): AlignmentMetrics {
    const reference = tokenizeWords(referenceText)
    const spoken = tokenizeWords(transcript)
    const alignment = markRepetitions(align(reference, spoken))

    const count = (status: AlignmentStatus) =>
        alignment.filter((word) => word.status === status).length

    const correctWords = count("correct")
    const substitutions = count("substitution")
    const omissions = count("omission")
    const insertions = count("insertion")
    const repetitions = count("repetition")

    const referenceWordCount = reference.length
    const minutes = durationSeconds / 60

    return {
        alignment,
        correctWords,
        substitutions,
        omissions,
        insertions,
        repetitions,
        referenceWordCount,
        spokenWordCount: spoken.length,
        wordAccuracy: referenceWordCount ? correctWords / referenceWordCount : 0,
        wordErrorRate: referenceWordCount
            ? (substitutions + omissions + insertions) / referenceWordCount
            : 0,
        wordsPerMinute: minutes > 0 ? spoken.length / minutes : 0,
    }
}

/** Label kualitatif dari skor, supaya catatan tidak lagi lepas dari angkanya. */
export function noteForScore(score: number) {
    if (score >= 85) return "Sangat Baik"
    if (score >= 70) return "Baik"
    if (score >= 55) return "Cukup"
    return "Perlu Latihan"
}

function clampScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Lima sumbu penilaian yang dirender <ScoreMeter /> di VoiceAssessment.
 * Urutan dan label dijaga persis seperti sebelumnya agar tampilan tidak berubah.
 */
export function scoresFromMetrics(
    metrics: AlignmentMetrics,
    longPauses: number,
): SpeechScore[] {
    const words = Math.max(1, metrics.referenceWordCount)
    const wpm = metrics.wordsPerMinute

    // Kecepatan nyaman membaca nyaring untuk pelajar: sekitar 80–140 kpm.
    // Di bawah atau di atas pita itu, skor turun bertahap.
    const speed =
        wpm <= 0 ? 0 : wpm < 80 ? (wpm / 80) * 100 : wpm > 140 ? Math.max(40, 100 - (wpm - 140) * 1.2) : 100

    const accuracy = metrics.wordAccuracy * 100
    const fluency = 100 - ((metrics.repetitions + longPauses) / words) * 100 * 3
    const pauses = 100 - (longPauses / words) * 100 * 6
    const repetition = 100 - (metrics.repetitions / words) * 100 * 6

    const raw: [string, number][] = [
        ["Kelancaran Membaca", fluency],
        ["Kecepatan Membaca", speed],
        ["Jeda", pauses],
        ["Pengulangan Kata", repetition],
        ["Akurasi Pengucapan", accuracy],
    ]

    return raw.map(([label, value]) => {
        const score = clampScore(value)
        return { label, score, note: noteForScore(score) }
    })
}

export function averageScore(scores: SpeechScore[]) {
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((total, s) => total + s.score, 0) / scores.length)
}
