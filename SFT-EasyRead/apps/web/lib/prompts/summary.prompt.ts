/** Batas kata per kalimat yang diminta ke model. */
export const MAX_WORDS_PER_SENTENCE = 12

/** Level kesulitan yang dituju pada skala 1–10 milik lib/readability. */
export const DEFAULT_TARGET_LEVEL = 4

export type SummaryMode = "prose" | "terse"

export type SummaryPromptOptions = {
  mode?: SummaryMode
  targetLevel?: number
  sourceLevel?: number
}

/**
 * Prompt lama cuma bilang "Bahasa Indonesia sederhana" — terukur, 82%
 * perbaikan keterbacaannya datang dari kalimat yang dipendekkan dan kosakata
 * nyaris tidak tersentuh. Karena itu aturan kosakata di sini dibuat eksplisit.
 */
const SHARED_RULES = `
Aturan wajib:
- Tulis kalimat pendek. Maksimal ${MAX_WORDS_PER_SENTENCE} kata per kalimat.
- Satu kalimat memuat satu gagasan. Pecah kalimat majemuk jadi beberapa kalimat.
- Ganti kata panjang (4 suku kata atau lebih) dengan kata sehari-hari yang lebih pendek.
  Contoh: "mengimplementasikan" -> "memakai", "mengoptimalkan" -> "membuat lebih baik",
  "signifikan" -> "besar", "berkelanjutan" -> "terus berjalan".
- JANGAN ganti nama orang, nama tempat, nama lembaga, atau istilah yang tidak punya
  padanan sehari-hari. Menyederhanakan nama berarti menghilangkan fakta.
- Pertahankan semua angka, tanggal, dan satuan persis seperti di sumber.
- Jangan menambah informasi yang tidak ada di sumber.
- Pakai kalimat aktif. Hindari bentuk pasif berbelit.
`.trim()

function targetBlock(options: SummaryPromptOptions): string {
  const target = options.targetLevel ?? DEFAULT_TARGET_LEVEL
  const source =
    options.sourceLevel !== undefined
      ? `Teks sumber ada di level ${options.sourceLevel}. `
      : ""

  return `${source}Ringkasanmu harus turun ke level ${target} atau lebih rendah pada skala kesulitan baca 1-10 (1 = paling mudah).`
}

export function buildSummaryPrompt(text: string, options: SummaryPromptOptions = {}) {
  const mode = options.mode ?? "prose"

  // Meringkas catatan/daftar pendek jadi prosa terukur MENAIKKAN levelnya
  // (catatan rapat naik +2), jadi bentuk ringkasnya dipertahankan.
  const shape =
    mode === "terse"
      ? `
Teks sumber sudah berbentuk catatan atau daftar poin pendek.
PERTAHANKAN bentuk ringkas itu. JANGAN ubah jadi paragraf prosa —
mengubahnya jadi kalimat panjang membuat teks lebih sulit dibaca, bukan lebih mudah.
Buang butir yang berulang atau tidak penting, gabungkan yang mirip, dan
pertahankan gaya telegrafis yang pendek.
`.trim()
      : `
Teks sumber berupa paragraf. Ubah kalimat panjang dan berbelit menjadi
rangkaian kalimat pendek yang mudah dibaca, tanpa mengubah maknanya.
`.trim()

  return `
Kamu adalah AI EasyRead. Pembacamu adalah orang dengan disleksia:
kalimat panjang dan kata banyak suku kata membuat mereka cepat lelah.

Buat ringkasan teks Bahasa Indonesia berikut agar mudah dipahami.

${targetBlock(options)}

${shape}

${SHARED_RULES}

Isi jawaban:
- "title": judul singkat, maksimal 6 kata.
- "summary": ringkasan utuh, maksimal 120 kata.
- "bulletPoints": 3 sampai 5 butir. Tiap butir satu kalimat pendek yang berdiri sendiri.

Kembalikan JSON dengan format yang diminta.

Teks:
${text}
`.trim()
}

/**
 * Prompt putaran revisi. Diberi umpan balik konkret — kalimat mana yang masih
 * terlalu panjang, kata mana yang masih berat — bukan sekadar "sederhanakan
 * lagi". Tanpa daftar ini model mengembalikan teks yang nyaris sama.
 */
export function buildSummaryRevisionPrompt(input: {
  sourceText: string
  previousSummary: string
  previousBullets: string[]
  currentLevel: number
  targetLevel: number
  longSentences: string[]
  hardWords: string[]
  mode?: SummaryMode
  inventedNumbers?: string[]
}) {
  const {
    sourceText, previousSummary, previousBullets, currentLevel, targetLevel,
    longSentences, hardWords, mode = "prose", inventedNumbers = [],
  } = input

  const sentenceNotes = longSentences.length
    ? `Kalimat ini masih lebih dari ${MAX_WORDS_PER_SENTENCE} kata — pecah jadi beberapa kalimat:\n${longSentences
        .map((s) => `- "${s}"`)
        .join("\n")}`
    : "Panjang kalimat sudah cukup baik. Pertahankan."

  const wordNotes = hardWords.length
    ? `Kata ini masih terlalu panjang — ganti dengan kata sehari-hari yang lebih pendek (kecuali kalau itu nama atau istilah tanpa padanan):\n${hardWords
        .map((w) => `- ${w}`)
        .join("\n")}`
    : "Kosakata sudah cukup sederhana. Pertahankan."

  const shape =
    mode === "terse"
      ? "Pertahankan bentuk catatan/daftar pendek. Jangan ubah jadi paragraf prosa."
      : "Pertahankan bentuk paragraf pendek."

  const numberNotes = inventedNumbers.length
    ? `\nPENTING — angka ini muncul di ringkasan tapi tidak ada di teks sumber: ${inventedNumbers.join(
        ", ",
      )}. Hapus atau perbaiki supaya sama persis dengan sumber.\n`
    : ""

  return `
Ringkasan berikut masih perlu diperbaiki.
${numberNotes}
Level saat ini: ${currentLevel} dari 10. Target: ${targetLevel} atau lebih rendah.

Ringkasan sebelumnya:
"""
${previousSummary}
"""

Butir sebelumnya:
${previousBullets.map((b) => `- ${b}`).join("\n")}

${sentenceNotes}

${wordNotes}

${shape}

${SHARED_RULES}

Perbaiki ringkasan itu supaya lebih mudah dibaca. Semua fakta, angka, tanggal,
dan nama harus tetap sama dengan teks sumber di bawah. Jangan menghapus
informasi penting hanya untuk memperpendek.

Kembalikan JSON dengan format yang diminta.

Teks sumber:
${sourceText}
`.trim()
}
