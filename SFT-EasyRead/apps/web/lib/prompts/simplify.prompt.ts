export function buildSimplifyPrompt(text: string, feedback?: string[]) {
  let prompt = `Sederhanakan teks berikut agar lebih mudah dibaca. Pertahankan semua nama, angka, tanggal, dan makna negasi (seperti "tidak", "bukan", "belum"):\n\n"${text}"`;

  if (feedback && feedback.length > 0) {
    prompt += `\n\n[PERBAIKAN SANGAT PENTING]
Hasil simplifikasi sebelumnya gagal validasi karena:
${feedback.map((err) => `- ${err}`).join("\n")}

Tolong perbaiki kesalahan tersebut tanpa mengubah fakta asli lainnya.`;
  }

  return prompt;
}