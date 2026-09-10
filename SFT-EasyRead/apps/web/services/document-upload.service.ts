import mammoth from "mammoth"
import { PDFParse } from "pdf-parse"
import path from "node:path"
import fs from "node:fs"

const pdfWorkerPath = [
    path.resolve(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs"),
    path.resolve(process.cwd(), "../../node_modules/pdf-parse/dist/worker/pdf.worker.mjs"),
].find((candidate) => fs.existsSync(candidate))

if (pdfWorkerPath) PDFParse.setWorker(pdfWorkerPath)

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const MAX_DOCUMENT_CHARACTERS = 500_000

const EXTENSION_TO_SOURCE = {
    txt: "text",
    docx: "text",
    pdf: "pdf",
} as const

export type UploadedDocument = {
    title: string
    sourceType: "text" | "pdf"
    text: string
}

export class DocumentUploadError extends Error {}

function extensionOf(name: string) {
    return name.toLowerCase().split(".").pop() ?? ""
}

function normalizeText(text: string) {
    return text
        .replaceAll(String.fromCharCode(0), "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/g, "").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

export async function extractDocumentText(file: File): Promise<UploadedDocument> {
    if (file.size === 0) {
        throw new DocumentUploadError("File yang diunggah kosong.")
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
        throw new DocumentUploadError("Ukuran dokumen maksimal 10 MB.")
    }

    const extension = extensionOf(file.name)
    if (!Object.hasOwn(EXTENSION_TO_SOURCE, extension)) {
        throw new DocumentUploadError("Format dokumen harus TXT, DOCX, atau PDF.")
    }

    const supportedExtension = extension as keyof typeof EXTENSION_TO_SOURCE

    const buffer = Buffer.from(await file.arrayBuffer())
    let text: string

    try {
        if (supportedExtension === "txt") {
            text = buffer.toString("utf8")
        } else if (supportedExtension === "docx") {
            text = (await mammoth.extractRawText({ buffer })).value
        } else {
            const parser = new PDFParse({ data: buffer })
            try {
                text = (await parser.getText()).text
            } finally {
                await parser.destroy()
            }
        }
    } catch (error) {
        console.error("Document text extraction failed", {
            fileName: file.name,
            mimeType: file.type,
            extension: supportedExtension,
            size: file.size,
            error,
        })
        const fileKind = supportedExtension === "pdf" ? "PDF" : "DOCX"
        throw new DocumentUploadError(
            `${fileKind} tidak valid, rusak, atau dilindungi password. Coba buka dan simpan ulang file tersebut lalu upload kembali.`,
        )
    }

    const normalizedText = normalizeText(text)
    if (!normalizedText) {
        if (supportedExtension === "pdf") {
            throw new DocumentUploadError(
                "PDF ini tidak memiliki lapisan teks. Gunakan Upload Foto untuk memindai halaman PDF sebagai gambar.",
            )
        }

        throw new DocumentUploadError("Tidak ada teks yang bisa dibaca dari dokumen ini.")
    }

    if (normalizedText.length > MAX_DOCUMENT_CHARACTERS) {
        throw new DocumentUploadError("Teks dokumen terlalu panjang. Maksimal 500.000 karakter.")
    }

    return {
        title: file.name.replace(/\.[^.]+$/, "") || "Dokumen baru",
        sourceType: EXTENSION_TO_SOURCE[supportedExtension] === "pdf" ? "pdf" : "text",
        text: normalizedText,
    }
}
