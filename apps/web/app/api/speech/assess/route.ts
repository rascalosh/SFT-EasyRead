import { NextResponse } from "next/server"
import { assessReading } from "@repo/web/services/speech.service"
import { getCurrentUser } from "@repo/web/proxy"

/**
 * Hitung metrik membaca dari transkrip Web Speech API.
 * Audio mentah tidak pernah dikirim ke server - hanya teks hasil transkripsi.
 */
export async function POST(request: Request) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const body = await request.json().catch(() => ({}))
		return NextResponse.json(await assessReading(user.id, body))
	} catch (error) {
		if (error && typeof error === "object" && "issues" in error) {
			return NextResponse.json({ message: "Data asesmen tidak valid." }, { status: 400 })
		}

		console.error(error)
		return NextResponse.json({ message: "Failed to assess reading" }, { status: 500 })
	}
}
