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

/**
 * Versi 2 — "terstruktur". Bukan menulis ulang paragraf per paragraf, tapi
 * menyusun ulang isi teks menjadi penjelasan berformat Markdown seperti
 * jawaban Gemini/Claude/ChatGPT: inti dulu, judul bagian, poin, kata kunci
 * tebal, tabel untuk perbandingan, blok Catatan, dan ajakan di akhir.
 * Fakta (nama, angka, tanggal, negasi) tetap wajib sama dengan sumber.
 */
const STRUCTURED_FORMAT_RULES = `
Panduan format (wajib diikuti, dalam urutan ini):

1. Langsung pada Inti (Bottom-Line Up Front).
   Paragraf pertama langsung berisi jawaban utama, ringkasan, atau definisi
   dari keseluruhan teks — 1 sampai 3 kalimat pendek — sebelum masuk ke detail.

2. Gunakan Hierarki Visual.
   Pecah isi teks menjadi bagian-bagian dengan judul "## " untuk sub-topik
   dan "### " untuk bagian yang lebih kecil. Jangan pakai "# " (judul level 1).
   Judul singkat, maksimal 6 kata, tanpa titik di akhir.

3. Hindari Teks Menumpuk (Wall of Text).
   Jelaskan komponen, langkah, atau kriteria dengan daftar berpoin ("- ")
   atau daftar bernomor ("1. "). Paragraf biasa maksimal 3 kalimat.

4. Tebalkan Kata Kunci.
   Beri **cetak tebal** pada istilah teknis, nama konsep, dan poin utama
   supaya mudah dipindai. Maksimal 2 sampai 3 frasa tebal per paragraf/poin.

5. Gunakan Tabel untuk Perbandingan.
   Jika teks membandingkan dua hal atau lebih (pro/kontra, perbedaan,
   sebelum/sesudah, jenis-jenis), sajikan dalam tabel Markdown (GFM).
   Jika tidak ada yang dibandingkan, JANGAN memaksakan tabel.

6. Beri Penekanan pada Hal Krusial.
   Sorot peringatan, pengecualian, tips penting, atau contoh nyata dari teks
   dengan blok kutipan yang diawali label tebal, misalnya:
   > **Catatan:** ...   atau   > **Contoh:** ...   atau   > **Penting:** ...

7. Akhiri dengan Keterlibatan (Call to Action).
   Tutup dengan satu kalimat ramah yang menawarkan langkah selanjutnya,
   misalnya mencoba kuis, membaca ulang bagian tertentu, atau mendengarkan
   teksnya. Jangan bertanya hal yang tidak bisa dijawab pembaca di aplikasi.
`.trim()

const STRUCTURED_LANGUAGE_RULES = `
Aturan bahasa (pembaca adalah orang dengan disleksia):
- Bahasa Indonesia. Kalimat pendek, maksimal 12 kata per kalimat.
- Satu kalimat, satu gagasan. Pakai kalimat aktif dan kata sehari-hari.
- Ganti kata panjang (4 suku kata atau lebih) dengan padanan yang lebih pendek,
  KECUALI nama orang, tempat, lembaga, dan istilah tanpa padanan.
- Pertahankan SEMUA nama, angka, tanggal, satuan, dan makna negasi
  ("tidak", "bukan", "belum", "jangan", "tanpa", "tak") persis seperti sumber.
- Jangan menambah fakta, angka, atau contoh yang tidak ada di teks sumber.
  Contoh nyata hanya boleh diambil dari teks itu sendiri.
- Jangan pakai huruf miring, garis bawah, HURUF KAPITAL beruntun, emoji,
  atau blok kode. Penekanan hanya dengan cetak tebal.
- Jangan tulis kata "Markdown", jangan bungkus jawaban dengan \`\`\`.
`.trim()

export function buildStructuredSimplifyPrompt(text: string, feedback?: string[]) {
  let prompt = `
Kamu adalah AI EasyRead. Susun ulang teks di bawah menjadi penjelasan yang
mudah dibaca dan dipahami, dengan gaya seperti asisten AI menjelaskan sesuatu.

${STRUCTURED_FORMAT_RULES}

${STRUCTURED_LANGUAGE_RULES}

Isi jawaban (JSON sesuai skema):
- "title": judul singkat untuk teks ini, maksimal 6 kata.
- "markdown": seluruh penjelasan dalam format Markdown (GFM) sesuai panduan di atas.

Teks sumber:
"""
${text}
"""
`.trim()

  if (feedback && feedback.length > 0) {
    prompt += `

[PERBAIKAN SANGAT PENTING]
Hasil sebelumnya gagal validasi karena:
${feedback.map((err) => `- ${err}`).join("\n")}

Perbaiki kesalahan itu. Semua angka dan kata negasi dari teks sumber harus
muncul kembali persis, tanpa mengubah fakta lainnya. Tetap ikuti panduan format.`
  }

  return prompt
}