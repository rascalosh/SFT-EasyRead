import { NextResponse } from "next/server"
import { syllabifyWords } from "@repo/web/services/syllable.service"
import { getCurrentUser } from "@repo/web/proxy"

/** Pecah suku kata (rule-based) + arti dari glossary hasil simplify. */
export async function POST(request: Request) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const body = await request.json().catch(() => ({}))

		const rawWords: unknown[] = Array.isArray(body.words) ? body.words : []
		const words = rawWords
			.filter((word): word is string => typeof word === "string")
			.slice(0, 50)

		if (words.length === 0) {
			return NextResponse.json({ message: "words wajib diisi." }, { status: 400 })
		}

		const documentId = typeof body.documentId === "string" ? body.documentId : null

		return NextResponse.json({ words: await syllabifyWords(words, documentId) })
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: "Failed to syllabify" }, { status: 500 })
	}
}
