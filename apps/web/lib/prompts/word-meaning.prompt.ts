export const WORD_MEANING_PROMPT_VERSION = "word-meaning-v1"

/**
 * Dipakai hanya saat kata TIDAK ada di glosarium hasil Simplify (lihat
 * services/syllable.service.ts). Satu kata per panggilan — dipicu on-demand
 * saat pengguna mengetuk kata di Syllable Breaker, jadi biayanya kecil.
 */
export function buildWordMeaningPrompt(word: string) {
    return `
Kamu adalah AI EasyRead yang menjelaskan arti kata untuk anak SD penyandang disleksia.

Jelaskan arti kata "${word}" dalam Bahasa Indonesia.

Aturan:
- Satu kalimat pendek saja (maksimal sekitar 12 kata).
- Bahasa sesederhana mungkin, seperti menjelaskan ke anak kelas 3-4 SD.
- Kalau kata itu bisa bermakna lebih dari satu, pilih makna yang paling umum.
- Kalau bukan kata Bahasa Indonesia yang dikenal (mis. nama, typo, kata asing),
  jawab dengan jujur, mis. "Kata ini tidak dikenali dalam Bahasa Indonesia."
- Jangan mengulang kata itu sendiri di awal jawaban (hindari "${word} adalah...").
`.trim()
}
