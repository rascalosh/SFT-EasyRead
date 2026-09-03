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
