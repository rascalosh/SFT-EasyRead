import { NextResponse } from "next/server"

import { getCurrentUser } from "@repo/web/proxy"
import { getDocuments } from "@repo/web/services/document.service"

export async function GET() {
    const user = await getCurrentUser()
    
    const documents = await getDocuments(user.id)

    return Response.json(documents)
}