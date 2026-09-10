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