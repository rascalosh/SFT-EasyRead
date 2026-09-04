import { NextResponse } from "next/server"
import { getCurrentUser } from "@repo/web/proxy"
import { getCachedSummary, summarizeDocument } from "@repo/web/services/summary.service"

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const { id } = await params
		const cached = await getCachedSummary(id, user.id)

		if (!cached) {
			return NextResponse.json({ message: "Not found" }, { status: 404 })
		}

		return NextResponse.json({ ...cached, cached: true })
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: "Failed to load summary" }, { status: 500 })
	}
}

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser()

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
		}

		const { id } = await params
		const summary = await summarizeDocument(id, user.id)

		return NextResponse.json(summary, {
			status: summary.cached ? 200 : 201,
		})
	} catch (error) {
		console.error(error)

		return NextResponse.json(
			{ message: "Failed to summarize document" },
			{ status: 500 },
		)
	}
}
