import { z } from "zod";

export const simplifySchema = z.object({
  title: z.string(),
  paragraphs: z.array(
    z.object({
      original: z.string(),
      simplified: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      difficultWords: z.array(
        z.object({
          word: z.string(),
          explanation: z.string(),
        })
      ).default([]),
    })
  ),
});

export type SimplifyResult = z.infer<typeof simplifySchema>;

/** Versi hasil Simplify yang dipilih pengguna di Pengaturan. */
export const simplifyStyleSchema = z.enum(["plain", "structured"]);

export type SimplifyStyle = z.infer<typeof simplifyStyleSchema>;

/**
 * Versi 2 (terstruktur): satu dokumen Markdown ala jawaban asisten AI —
 * inti dulu, judul bagian, poin, kata kunci tebal, tabel perbandingan,
 * blok Catatan, dan ajakan di akhir. Dirender dengan react-markdown + GFM.
 */
export const structuredSimplifySchema = z.object({
  title: z.string(),
  markdown: z.string().min(1),
});

export type StructuredSimplifyResult = z.infer<typeof structuredSimplifySchema>;

/** Bentuk yang disimpan di kolom `simplifications.result` untuk versi 2. */
export type StructuredSimplifyStored = StructuredSimplifyResult & {
  format: "markdown";
};