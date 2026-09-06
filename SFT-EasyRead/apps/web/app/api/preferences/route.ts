import { NextResponse } from "next/server"
import { getPreferences, savePreferences } from "@repo/web/services/preferences.service"
import { getCurrentUser } from "@repo/web/proxy"

export async function GET() {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		return NextResponse.json(await getPreferences(user.id))
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: "Failed to load preferences" }, { status: 500 })
	}
}

export async function PUT(request: Request) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const body = await request.json().catch(() => ({}))
		return NextResponse.json(await savePreferences(user.id, body))
	} catch (error) {
		if (error && typeof error === "object" && "issues" in error) {
			return NextResponse.json({ message: "Preferensi tidak valid." }, { status: 400 })
		}

		console.error(error)
		return NextResponse.json({ message: "Failed to save preferences" }, { status: 500 })
	}
}
