import { NextResponse } from "next/server"
import { evaluateAnswer } from "@repo/web/services/quiz.service"
import { getCurrentUser } from "@repo/web/proxy"

/** Nilai satu jawaban bebas, lalu upsert ke quiz_answers. */
export async function POST(request: Request) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const body = await request.json().catch(() => ({}))
		const questionId = typeof body.questionId === "string" ? body.questionId : ""
		const answer = typeof body.answer === "string" ? body.answer.trim() : ""

		if (!questionId || !answer) {
			return NextResponse.json(
				{ message: "questionId dan answer wajib diisi." },
				{ status: 400 },
			)
		}

		const analysis = await evaluateAnswer(questionId, user.id, answer)
		return NextResponse.json(analysis)
	} catch (error) {
		const message = error instanceof Error ? error.message : ""

		if (message === "Question not found" || message === "Document not found") {
			return NextResponse.json({ message }, { status: 404 })
		}

		console.error(error)
		return NextResponse.json({ message: "Failed to evaluate answer" }, { status: 500 })
	}
}
