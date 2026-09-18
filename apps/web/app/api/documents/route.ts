import { NextResponse } from "next/server"

import { getCurrentUser } from "@repo/web/proxy"
import { getDocuments, createDocument } from "@repo/web/services/document.service"

export async function GET() {
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documents = await getDocuments(user.id)

    return Response.json(documents)
}

export async function POST(request: Request) {
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const newDocument = await createDocument(user.id, {
        title: typeof body.title === "string" ? body.title : "Untitled document",
        sourceType: typeof body.sourceType === "string" ? body.sourceType : "text",
        originalText: typeof body.originalText === "string" ? body.originalText : "",
    })

    // Supabase mengembalikan galat di dalam envelope, bukan sebagai throw.
    // Tanpa pemeriksaan ini insert yang ditolak CHECK (mis. source_type tidak
    // sah) tetap dibalas 201 dan materi hilang diam-diam.
    if (newDocument.error) {
        console.error(newDocument.error)
        return NextResponse.json(
            { error: newDocument.error.message || "Failed to create document" },
            { status: 400 },
        )
    }

    return NextResponse.json(newDocument, { status: 201 })
}