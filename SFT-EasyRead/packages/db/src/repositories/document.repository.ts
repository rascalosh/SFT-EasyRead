import { createClient } from "../server";

export async function createDocument(data) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .insert(data)
        .select()
        .single();
} 

export async function getDocuments(userId) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
}

export async function getDocumentById(id, userId) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .eq("user_id", id)
        .single();
}

export async function updateDocument(id, userId, payload) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
}

export async function deleteDocument(id, userId) {
    const supabase = await createClient()

    return supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
}