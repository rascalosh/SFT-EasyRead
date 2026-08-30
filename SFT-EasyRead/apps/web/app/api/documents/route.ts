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

export async function POST() {
    const user = await getCurrentUser()
    const body = {
        title: "Test 2",
        sourceType: "text",
        originalText: "ANJAY MABAR KAWANNN",
    }

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const newDocument = await createDocument(user.id, body)

    return NextResponse.json(newDocument, { status: 201 })
}