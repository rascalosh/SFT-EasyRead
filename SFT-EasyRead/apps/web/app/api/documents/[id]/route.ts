import { NextResponse } from "next/server";
import { getDocumentById } from "@repo/web/services/document.service"
import { getCurrentUser } from "@repo/web/proxy";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" })
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