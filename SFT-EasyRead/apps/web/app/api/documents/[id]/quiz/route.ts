import { NextResponse } from "next/server"
import { getOrCreateQuiz } from "@repo/web/services/quiz.service"
import { getCurrentUser } from "@repo/web/proxy"

/** Ambil kuis dokumen; dibuat lewat Gemini bila belum ada. */
export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const { id } = await params
		const quiz = await getOrCreateQuiz(id, user.id)

		return NextResponse.json(quiz, { status: quiz.cached ? 200 : 201 })
	} catch (error) {
		const message = error instanceof Error ? error.message : ""

		if (message === "Document not found") {
			return NextResponse.json({ message }, { status: 404 })
		}

		if (message === "Document text is empty") {
			return NextResponse.json({ message }, { status: 400 })
		}

		console.error(error)
		return NextResponse.json({ message: "Failed to build quiz" }, { status: 500 })
	}
}
