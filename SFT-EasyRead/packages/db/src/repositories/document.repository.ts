import { createClient } from "../server";

export type DocumentInsert = {
    user_id: string;
    title: string;
    source_type: string;
    original_text: string;
    status: string;
};

export type DocumentUpdate = Partial<DocumentInsert>;

export async function createDocument(data: DocumentInsert) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .insert(data)
        .select()
        .single();
}

export async function getDocuments(userId: string) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
}

export async function getDocumentById(id: string, userId: string) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();
}

export async function updateDocument(id: string, userId: string, payload: DocumentUpdate) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
}

export async function deleteDocument(id: string, userId: string) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .single()
}