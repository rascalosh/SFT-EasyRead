import { NextResponse } from "next/server"
import { simplifyStyleSchema, type SimplifyStyle } from "@repo/schemas/simplify"
import { getCachedSimplification, simplifyDocument } from "@repo/web/services/simplify.service"
import { getCurrentUser } from "@repo/web/proxy"
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@repo/web/lib/gemini"

/** `?style=plain|structured` — versi hasil yang dipilih di Pengaturan. Default plain. */
function styleFrom(req: Request): SimplifyStyle {
	const raw = new URL(req.url).searchParams.get("style")
	const parsed = simplifyStyleSchema.safeParse(raw)
	return parsed.success ? parsed.data : "plain"
}

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const { id } = await params
		const cached = await getCachedSimplification(id, user.id, styleFrom(req))

		if (!cached) {
			return NextResponse.json({ message: "Not found" }, { status: 404 })
		}

		return NextResponse.json({ ...cached, cached: true })
	} catch (error) {
		const message = error instanceof Error ? error.message : ""

		if (message === "Document not found") {
			return NextResponse.json({ message }, { status: 404 })
		}

		console.error(error)
		return NextResponse.json({ message: "Failed to load simplification" }, { status: 500 })
	}
}

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const { id } = await params
		const simplification = await simplifyDocument(id, user.id, styleFrom(req))
		return NextResponse.json(simplification, {
			status: simplification.cached ? 200 : 201,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : ""

		if (message === "Document not found") {
			return NextResponse.json({ message }, { status: 404 })
		}

		if (message === "Document text is empty") {
			return NextResponse.json({ message }, { status: 400 })
		}

		if (isRateLimited(error)) {
			return NextResponse.json(
				{ message: RATE_LIMIT_MESSAGE },
				{ status: 429 },
			)
		}

		console.error(error)
		return NextResponse.json({ message: "Failed to simplify document" }, { status: 500 })
	}
}
