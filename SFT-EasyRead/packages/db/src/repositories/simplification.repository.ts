import { createClient } from "@repo/db/server"

export type CacheLookupInput = {
    documentId: string;
    operation: string;
    inputHash: string;
    pipelineVersion: string;
    model: string;
};

export type SimplificationInsert = {
    document_id: string;
    user_id: string;
    operation: string;
    result: unknown;
    provider: string;
    model: string;
    pipeline_version: string;
    confidence: number | null;
    processing_time_ms: number;
    validation_status: string;
    input_hash: string;
};

export async function findCachedSimplification({
    documentId,
    operation,
    inputHash,
    pipelineVersion,
    model,
}: CacheLookupInput) {
    const supabase = await createClient()

    const { data } = await supabase
        .from("simplifications")
        .select("*")
        .eq("document_id", documentId)
        .eq("operation", operation)
        .eq("input_hash", inputHash)
        .eq("pipeline_version", pipelineVersion)
        .eq("model", model)
        .maybeSingle();

    return data
}

export async function createSimplification(payload: SimplificationInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("simplifications")
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}