import { NextResponse } from "next/server"
import { startReadingSession } from "@repo/web/services/session.service"
import { getCurrentUser } from "@repo/web/proxy"

/** Catat sesi membaca baru saat materi dibuka. */
export async function POST(request: Request) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const body = await request.json().catch(() => ({}))
		const documentId = typeof body.documentId === "string" ? body.documentId : ""

		if (!documentId) {
			return NextResponse.json({ message: "documentId wajib diisi." }, { status: 400 })
		}

		const session = await startReadingSession(documentId, user.id)
		return NextResponse.json(session, { status: 201 })
	} catch (error) {
		const message = error instanceof Error ? error.message : ""

		if (message === "Document not found") {
			return NextResponse.json({ message }, { status: 404 })
		}

		console.error(error)
		return NextResponse.json({ message: "Failed to start reading session" }, { status: 500 })
	}
}
