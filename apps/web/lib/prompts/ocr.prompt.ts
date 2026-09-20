export const OCR_PROMPT_VERSION = "ocr-v1"

export function buildOcrPrompt() {
  return `
Kamu adalah mesin OCR untuk aplikasi baca EasyRead.

Baca SEMUA teks Bahasa Indonesia yang terlihat pada gambar ini.

Aturan untuk "text":
- Salin teks apa adanya, jangan menerjemahkan dan jangan menyederhanakan.
- Pertahankan nama orang, tempat, tanggal, dan angka persis seperti tertulis.
- Rapikan jadi paragraf yang wajar: gabungkan baris yang terpotong margin
  menjadi satu kalimat utuh, pisahkan antar paragraf dengan satu baris kosong.
- Buang nomor halaman, header, dan footer yang bukan bagian isi bacaan.
- Kalau tidak ada teks yang terbaca sama sekali, isi dengan string kosong.

Aturan untuk "summary":
- Satu paragraf ringkas Bahasa Indonesia sederhana berisi ide utama bacaan.
- Maksimal 60 kata. Kalau "text" kosong, isi dengan string kosong juga.

Aturan untuk "confidence":
- Angka 0 sampai 1 yang menggambarkan seberapa jelas teks terbaca.

Aturan untuk "warnings":
- Daftar singkat masalah gambar bila ada, misalnya "gambar buram",
  "teks terpotong", "tulisan tangan sulit dibaca", "gambar miring".
- Kosongkan bila gambar jelas.
`;
}
