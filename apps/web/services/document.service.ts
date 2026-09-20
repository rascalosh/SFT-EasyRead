import * as repository from "@repo/db/repositories/document"

export type CreateDocumentBody = {
    title?: string;
    sourceType?: string;
    originalText?: string;
};

export async function createDocument(userId: string, body: CreateDocumentBody) {
    return repository.createDocument({
        user_id: userId,
        title: body.title ?? "Untitled document",
        source_type: body.sourceType ?? "text",
        original_text: body.originalText ?? "",
        status: "ready",
    });
}

export async function getDocuments(userId: string) {
    return repository.getDocuments(userId)
}

export async function getDocumentById(id: string, userId: string) {
    return repository.getDocumentById(id, userId)
}

export async function updateDocument(id: string, userId: string, body: Record<string, unknown>) {
    return repository.updateDocument(id, userId, body)
}

export async function deleteDocument(id: string, userId: string) {
    return repository.deleteDocument(id, userId)
}