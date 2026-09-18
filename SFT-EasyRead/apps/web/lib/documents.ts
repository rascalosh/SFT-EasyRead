export type ApiDocument = {
  id: string
  title?: string
  original_text?: string | null
  created_at?: string | null
}

type DocumentResult =
  | { document: ApiDocument }
  | { unauthorized: true }
  | { error: true }

type DocumentListResult =
  | { documents: ApiDocument[] }
  | { unauthorized: true; documents: [] }
  | { error: true; documents: [] }

export type UploadedDocument = {
  title: string
  sourceType: "text" | "pdf"
  text: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

export function extractDocument(payload: unknown): ApiDocument | null {
  const root = asRecord(payload)
  if (!root) return null
  const data = asRecord(root.data) ?? root
  return typeof data.id === "string" ? (data as ApiDocument) : null
}

export function extractDocumentList(payload: unknown): ApiDocument[] {
  const root = asRecord(payload)
  const rows = root && Array.isArray(root.data) ? root.data : payload
  if (!Array.isArray(rows)) return []
  return rows.filter((item): item is ApiDocument => {
    const row = asRecord(item)
    return typeof row?.id === "string"
  })
}

export async function createUserDocument(input: {
  title: string
  originalText: string
  sourceType?: string
}): Promise<DocumentResult> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      sourceType: input.sourceType ?? "text",
      originalText: input.originalText,
    }),
  })

  if (response.status === 401) return { unauthorized: true as const }
  if (!response.ok) return { error: true as const }

  const document = extractDocument(await response.json())
  return document ? { document } : { error: true as const }
}

export async function uploadDocument(file: File): Promise<
  | { upload: UploadedDocument }
  | { unauthorized: true }
  | { error: true; message?: string }
> {
  const form = new FormData()
  form.append("file", file)

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: form,
  })

  if (response.status === 401) return { unauthorized: true as const }

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; title?: string; sourceType?: "text" | "pdf"; text?: string }
    | null

  if (!response.ok || !payload?.text || !payload.title || !payload.sourceType) {
    console.error("Document upload failed", {
      status: response.status,
      message: payload?.error,
    })
    return { error: true as const, message: payload?.error }
  }

  return {
    upload: {
      title: payload.title,
      sourceType: payload.sourceType,
      text: payload.text,
    },
  }
}

export async function fetchUserDocuments(): Promise<DocumentListResult> {
  const response = await fetch("/api/documents")
  if (response.status === 401) return { unauthorized: true as const, documents: [] }
  if (!response.ok) return { error: true as const, documents: [] }
  return { documents: extractDocumentList(await response.json()) }
}

export async function fetchUserDocument(id: string): Promise<DocumentResult> {
  const response = await fetch(`/api/documents/${id}`)
  if (response.status === 401) return { unauthorized: true as const }
  if (!response.ok) return { error: true as const }
  const document = extractDocument(await response.json())
  return document ? { document } : { error: true as const }
}

export async function updateUserDocumentTitle(
  id: string,
  title: string,
): Promise<
  | { ok: true }
  | { unauthorized: true }
  | { error: true }
> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (response.status === 401) return { unauthorized: true as const }
  if (!response.ok) return { error: true as const }
  return { ok: true as const }
}

export async function deleteUserDocument(id: string) {
  const response = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  })

  if (response.status === 401) return { unauthorized: true as const }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: unknown }
      | null
    return {
      error: true as const,
      message: typeof payload?.error === "string" ? payload.error : undefined,
    }
  }

  return { deleted: true as const }
}
