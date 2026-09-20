/**
 * Markdown → teks polos. Dipakai di server (validasi angka/negasi, skor
 * keterbacaan) dan di klien (hitung kata, teks cadangan) untuk hasil
 * Simplify versi terstruktur. Tidak perlu parser penuh; cukup membuang
 * penanda format supaya kata dan angkanya tetap utuh.
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/\r\n?/g, "\n")
    // blok kode & kode sebaris: buang pagar/backtick, isi tetap
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    // gambar & tautan: sisakan teksnya
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // baris pemisah tabel |---|:---:|
    .replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/gm, "")
    // pipa tabel → spasi
    .replace(/^\s*\|/gm, "")
    .replace(/\|\s*$/gm, "")
    .replace(/\s*\|\s*/g, " · ")
    // judul, kutipan, daftar
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    // garis horizontal
    .replace(/^\s*([-*_])\s*(\1\s*){2,}$/gm, "")
    // tebal / miring / coret
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(?=\S)(.*?)(?<=\S)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    // rapikan spasi
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
