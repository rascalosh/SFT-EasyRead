import { z } from "zod";

export const simplifySchema = z.object({
  title: z.string(),
  simplifiedText: z.string(),
  difficultWords: z.array(
    z.object({
      word: z.string(),
      explanation: z.string(),
    })
  ),
});

export type SimplifyResult = z.infer<typeof simplifySchema>;