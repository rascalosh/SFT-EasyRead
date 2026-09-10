import { NextResponse } from "next/server";
import { getDocumentById, deleteDocument, updateDocument } from "@repo/web/services/document.service"
import { getCurrentUser } from "@repo/web/proxy";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { data, error } = await getDocumentById(id, user.id)

    if (error) {
        return NextResponse.json(
            { error: error.message || "Document not found" },
            { status: 404 }
        )
    }
    
    return NextResponse.json(data)
}

export async function DELETE(
    _request: Request, 
    { params }: { params: Promise<{ id: string}> } 
) {
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { error } = await deleteDocument(id, user.id)

    if (error) {
        return NextResponse.json(
            { error: error.message || "Failed to delete document" },
            { status: error.code === "PGRST116" ? 404 : 500 }
        )
    }

    return NextResponse.json(
        { message: "DELETED" }, 
        { status: 200 }
    )
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const payload: Record<string, unknown> = {}
    if (typeof body.title === "string") payload.title = body.title
    if (typeof body.sourceType === "string") payload.source_type = body.sourceType
    if (typeof body.originalText === "string") payload.original_text = body.originalText
    if (typeof body.status === "string") payload.status = body.status

    const { data, error } = await updateDocument(id, user.id, payload)

    if (error) {
        return NextResponse.json(
            { error: error.message || "Failed to update document" },
            { status: 400 }
        )
    }

    return NextResponse.json(data)
}