export function buildSummaryPrompt(text: string) {
  return `
Kamu adalah AI EasyRead.

Buat ringkasan teks Bahasa Indonesia agar mudah dipahami oleh pembaca dengan kesulitan membaca seperti disleksia.

Aturan:
- Ringkasan maksimal 120 kata.
- Gunakan Bahasa Indonesia sederhana.
- Pertahankan fakta, nama orang, tempat, tanggal, dan angka.
- Fokus hanya pada ide utama.

Kembalikan JSON dengan format yang diminta.

Teks:
${text}
`;
}