import { z } from "zod"

export const summarySchema = z.object({
    title: z.string(),
    
    summary: z.string(),

    bulletPoints: z
        .array(z.string())
        .min(3)
        .max(5)
});

export type SummaryResult = z.infer<typeof summarySchema>