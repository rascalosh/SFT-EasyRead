import { NextResponse } from "next/server"
import { getProgress } from "@repo/web/services/progress.service"
import { getCurrentUser } from "@repo/web/proxy"

export async function GET() {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		return NextResponse.json(await getProgress(user.id))
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: "Failed to load progress" }, { status: 500 })
	}
}
