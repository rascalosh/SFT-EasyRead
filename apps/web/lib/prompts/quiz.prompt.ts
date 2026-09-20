/** Versi prompt — ikut jadi kunci cache & disimpan di quizzes.prompt_version. */
export const QUIZ_PROMPT_VERSION = "quiz-v1"

export function buildQuizPrompt(text: string) {
  return `
Kamu adalah AI EasyRead yang membantu pelajar penyandang disleksia di Indonesia.

Buat TEPAT 3 pertanyaan pemahaman berdasarkan bacaan di bawah.

Satu pertanyaan untuk tiap kategori, berurutan:
1. "main_idea"  - menanyakan ide utama bacaan.
2. "explicit"   - menanyakan informasi yang tertulis jelas di bacaan.
3. "context"    - menanyakan makna atau maksud sesuai konteks bacaan.

Aturan:
- Gunakan Bahasa Indonesia yang sederhana dan kalimat pendek.
- Pertanyaan harus bisa dijawab hanya dari bacaan, jangan butuh pengetahuan luar.
- Jangan menyalin kalimat bacaan mentah-mentah sebagai pertanyaan.
- Hindari pertanyaan menjebak, negasi ganda, dan istilah sulit.
- "keywords" berisi 2-5 kata kunci inti jawaban, huruf kecil semua.
- "referenceAnswer" berisi jawaban ideal, maksimal 2 kalimat.

Bacaan:
${text}
`;
}
