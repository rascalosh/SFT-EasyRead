import { NextResponse } from "next/server"
import { updateReadingSession } from "@repo/web/services/session.service"
import { getCurrentUser } from "@repo/web/proxy"

/** Perbarui durasi, posisi, dan pemakaian bantuan saat sesi selesai. */
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const { id } = await params
		const body = await request.json().catch(() => ({}))

		const updated = await updateReadingSession(id, user.id, {
			durationSeconds: body.durationSeconds,
			lastPosition: body.lastPosition,
			completed: body.completed,
			helpUsage: body.helpUsage,
		})

		return NextResponse.json(updated)
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: "Failed to update reading session" }, { status: 500 })
	}
}
