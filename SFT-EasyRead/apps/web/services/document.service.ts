import * as repository from "@repo/db"

export async function createDocument(userId: string, body) {
    return repository.createDocument({
        user_id: userId, 
        title: body.title,
        source_type: body.sourceType,
        original_text: body.originalText,
        status: "ready"
    });
}

export async function getDocuments(userId) {
    return repository.getDocuments(userId)
}

export async function getDocumentById(id, userId) {
    return repository.getDocumentById(id, userId)
}

export async function updateDocument(id, userId, body) {
    return repository.updateDocument(id, userId, body)
}

export async function deleteDocument(id, userId) {
    return repository.deleteDocument(id, userId)
}