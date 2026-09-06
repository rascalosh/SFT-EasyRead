import { NextResponse } from "next/server"

import { getCurrentUser } from "@repo/web/proxy"
import {
	DocumentUploadError,
	extractDocumentText,
} from "@repo/web/services/document-upload.service"

export const runtime = "nodejs"

export async function POST(request: Request) {
	const user = await getCurrentUser()

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const form = await request.formData()
		const file = form.get("file")

		if (!(file instanceof File)) {
			return NextResponse.json(
				{ error: "Field file wajib diisi." },
				{ status: 400 },
			)
		}

		return NextResponse.json(await extractDocumentText(file))
	} catch (error) {
		if (error instanceof DocumentUploadError) {
			console.warn("Document upload rejected", {
				message: error.message,
			})
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		console.error(error)
		return NextResponse.json(
			{ error: "Dokumen gagal diproses." },
			{ status: 500 },
		)
	}
}
