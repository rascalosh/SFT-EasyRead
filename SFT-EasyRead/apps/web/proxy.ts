import { updateSession } from "@repo/db/middleware"
import { createServerClient } from "@repo/db"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
    return updateSession(request)
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}

export async function getCurrentUser() {
    const supabase = await createServerClient()

    const {
        data: { user }, 
    } = await supabase.auth.getUser()

    return user
}