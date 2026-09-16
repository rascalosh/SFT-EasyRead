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
    original_readability_score: number | null;
    simplified_readability_score: number | null;
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
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return data
}

/**
 * Ambil hasil terakhir untuk dokumen + operasi (tanpa filter hash).
 * `pipelineVersion` opsional: operasi "simplify" punya dua versi hasil dengan
 * bentuk `result` berbeda, jadi pemanggil yang butuh bentuk tertentu memfilter.
 */
export async function findLatestSimplification(
    documentId: string,
    operation: string,
    pipelineVersion?: string,
) {
    const supabase = await createClient()

    let query = supabase
        .from("simplifications")
        .select("*")
        .eq("document_id", documentId)
        .eq("operation", operation)

    if (pipelineVersion) query = query.eq("pipeline_version", pipelineVersion)

    const { data } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    return data
}

export async function createSimplification(payload: SimplificationInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("simplifications")
        .upsert(payload, {
            // Harus sama persis dengan unique(user_id, input_hash, operation, pipeline_version, model).
            onConflict: "user_id,input_hash,operation,pipeline_version,model",
        })
        .select()
        .single()

    if (error) throw error
    return data
}