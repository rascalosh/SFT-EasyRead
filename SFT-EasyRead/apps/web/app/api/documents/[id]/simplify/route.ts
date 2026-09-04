import { NextResponse } from "next/server"
import { getCachedSimplification, simplifyDocument } from "@repo/web/services/simplify.service"
import { getCurrentUser } from "@repo/web/proxy"

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
		const cached = await getCachedSimplification(id, user.id)

		if (!cached) {
			return NextResponse.json({ message: "Not found" }, { status: 404 })
		}

		return NextResponse.json({ ...cached, cached: true })
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: "Failed to load simplification" }, { status: 500 })
	}
}

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
		const simplification = await simplifyDocument(id, user.id)
		return NextResponse.json(simplification, {
			status: simplification.cached ? 200 : 201,
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json({ message: "Failed to simplify document" }, { status: 500 })
	}
}
