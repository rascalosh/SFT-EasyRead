import { NextResponse } from "next/server"
import { extractTextFromImage, OcrInputError } from "@repo/web/services/ocr.service"
import { getCurrentUser } from "@repo/web/proxy"
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@repo/web/lib/gemini"

/** Pindai teks dari gambar. Menerima multipart/form-data dengan field image. */
export async function POST(request: Request) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
	}

	try {
		const form = await request.formData()
		const image = form.get("image")

		if (!(image instanceof File)) {
			return NextResponse.json({ message: "Field image wajib diisi." }, { status: 400 })
		}

		return NextResponse.json(await extractTextFromImage(image))
	} catch (error) {
		if (error instanceof OcrInputError) {
			return NextResponse.json({ message: error.message }, { status: 400 })
		}

		if (isRateLimited(error)) {
			return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429 })
		}

		console.error(error)
		return NextResponse.json({ message: "Gagal memindai gambar." }, { status: 500 })
	}
}
