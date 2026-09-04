"use client"

import { useEffect, useState, useRef } from "react"
import { cx } from "@/components/shared/ui"
import { scanImage, isOk, type ApiOcr } from "@/lib/api"

type Rect = { x: number; y: number; w: number; h: number }

/**
 * Potong gambar sesuai area yang dipilih pengguna.
 *
 * `selection` berupa persen terhadap KOTAK penampung, sedangkan gambar dirender
 * `object-contain` sehingga bisa ada bilah kosong di kiri-kanan atau atas-bawah.
 * Offset itu harus dihitung, kalau tidak area yang terkirim akan bergeser.
 */
async function cropToFile(
    image: HTMLImageElement,
    container: HTMLElement,
    selection: Rect,
): Promise<File | null> {
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    if (!naturalWidth || !naturalHeight) return null

    const box = container.getBoundingClientRect()
    const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight)
    const shownWidth = naturalWidth * scale
    const shownHeight = naturalHeight * scale
    const offsetX = (box.width - shownWidth) / 2
    const offsetY = (box.height - shownHeight) / 2

    const toImageX = (percent: number) =>
        Math.max(0, Math.min(naturalWidth, ((percent / 100) * box.width - offsetX) / scale))
    const toImageY = (percent: number) =>
        Math.max(0, Math.min(naturalHeight, ((percent / 100) * box.height - offsetY) / scale))

    const left = toImageX(selection.x)
    const top = toImageY(selection.y)
    const width = toImageX(selection.x + selection.w) - left
    const height = toImageY(selection.y + selection.h) - top

    if (width < 8 || height < 8) return null

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(width)
    canvas.height = Math.round(height)

    const context = canvas.getContext("2d")
    if (!context) return null

    context.drawImage(image, left, top, width, height, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((value) => resolve(value), "image/png"),
    )

    return blob ? new File([blob], "pindaian.png", { type: "image/png" }) : null
}

export default function LensViewer({
    imageFile,
    onConfirm,
    onCancel,
}: {
    imageFile: File
    /** Menerima teks hasil OCR agar bisa disimpan sebagai isi materi. */
    onConfirm: (text: string) => void
    onCancel: () => void
}) {
    const [imageUrl] = useState(() => URL.createObjectURL(imageFile))
    const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
    const [selection, setSelection] = useState<Rect | null>(null)
    const [dragging, setDragging] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [scanError, setScanError] = useState<string | null>(null)
    const [ocr, setOcr] = useState<ApiOcr | null>(null)
    const [mode, setMode] = useState<"dyslexic" | "summary">("dyslexic")
    const containerRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    // Bebaskan object URL saat komponen dilepas supaya tidak bocor.
    useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl])

    const scanned = ocr !== null

    function relPos(clientX: number, clientY: number) {
        const rect = containerRef.current!.getBoundingClientRect()
        return {
            x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
            y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
        }
    }

    function onStart(clientX: number, clientY: number) {
        if (scanned || scanning) return
        const p = relPos(clientX, clientY)
        setAnchor(p)
        setSelection(null)
        setDragging(true)
    }

    function onMove(clientX: number, clientY: number) {
        if (!dragging || !anchor) return
        const p = relPos(clientX, clientY)
        setSelection({
            x: Math.min(anchor.x, p.x),
            y: Math.min(anchor.y, p.y),
            w: Math.abs(p.x - anchor.x),
            h: Math.abs(p.y - anchor.y),
        })
    }

    function onEnd() {
        setDragging(false)
    }

    async function handleScan() {
        if (!selection || !imageRef.current || !containerRef.current) return

        setScanning(true)
        setScanError(null)

        try {
            const cropped = await cropToFile(imageRef.current, containerRef.current, selection)

            if (!cropped) {
                setScanError("Area yang dipilih terlalu kecil. Coba pilih area yang lebih lebar.")
                return
            }

            const result = await scanImage(cropped)

            if ("unauthorized" in result) {
                setScanError("Sesi kamu habis. Masuk lagi untuk memindai teks.")
                return
            }

            if (!isOk(result)) {
                setScanError("Gagal memindai teks. Periksa koneksi lalu coba lagi.")
                return
            }

            if (!result.data.text.trim()) {
                setScanError("Tidak ada teks yang terbaca di area itu. Coba pilih area lain.")
                return
            }

            setOcr(result.data)
        } catch {
            setScanError("Gagal memindai teks. Periksa koneksi lalu coba lagi.")
        } finally {
            setScanning(false)
        }
    }

    const hasSelection = !!(selection && selection.w > 3 && selection.h > 3)

    const handles = selection
        ? [
              { top: `${selection.y}%`, left: `${selection.x}%` },
              { top: `${selection.y}%`, left: `${selection.x + selection.w}%` },
              { top: `${selection.y + selection.h}%`, left: `${selection.x}%` },
              { top: `${selection.y + selection.h}%`, left: `${selection.x + selection.w}%` },
          ]
        : []

    return (
        <div className="animate-[fade-in_200ms_ease-out_both]">

            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-ink">
                        {scanned ? "Hasil Pindaian" : "Pilih Area Teks"}
                    </p>
                    <p className="text-xs text-ink-mute">
                        {scanned
                            ? "Teks ditampilkan dalam format ramah disleksia"
                            : "Seret di atas foto untuk memilih area teks"}
                    </p>
                </div>
                {scanned && (
                    <button
                        onClick={() => { setOcr(null); setSelection(null); setScanError(null) }}
                        className="text-xs font-semibold text-brand hover:text-brand-strong transition-colors"
                    >
                        Pilih Ulang
                    </button>
                )}
            </div>

            {/* Image + selection canvas */}
            <div
                ref={containerRef}
                className={cx(
                    "relative w-full overflow-hidden rounded-xl border border-line select-none",
                    !scanned && !scanning && "cursor-crosshair",
                )}
                style={{ maxHeight: "44vh" }}
                onMouseDown={(e) => onStart(e.clientX, e.clientY)}
                onMouseMove={(e) => onMove(e.clientX, e.clientY)}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={(e) => {
                    const touch = e.touches[0]
                    if (touch) onStart(touch.clientX, touch.clientY)
                }}
                onTouchMove={(e) => {
                    e.preventDefault()
                    const touch = e.touches[0]
                    if (touch) onMove(touch.clientX, touch.clientY)
                }}
                onTouchEnd={onEnd}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- object URL dari berkas pengguna, bukan aset statis */}
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Foto pindaian"
                    draggable={false}
                    className="w-full object-contain pointer-events-none"
                    style={{ maxHeight: "44vh" }}
                />

                {/* Dim overlay */}
                {!scanned && (
                    <div className="absolute inset-0 bg-black/25 pointer-events-none" />
                )}

                {/* Selection */}
                {selection && (
                    <>
                        {/* Cut-out clear window */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                left: `${selection.x}%`,
                                top: `${selection.y}%`,
                                width: `${selection.w}%`,
                                height: `${selection.h}%`,
                                boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                                borderRadius: "3px",
                            }}
                        />
                        {/* Border */}
                        <div
                            className="absolute border-2 border-brand pointer-events-none"
                            style={{
                                left: `${selection.x}%`,
                                top: `${selection.y}%`,
                                width: `${selection.w}%`,
                                height: `${selection.h}%`,
                                borderRadius: "3px",
                            }}
                        />
                        {/* Corner handles */}
                        {handles.map((style, i) => (
                            <div
                                key={i}
                                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface-raised)] bg-brand pointer-events-none"
                                style={style}
                            />
                        ))}
                    </>
                )}

                {/* Hint */}
                {!hasSelection && !scanned && !scanning && (
                    <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
                        <span className="rounded-lg bg-black/60 px-4 py-1.5 text-xs text-white">
                            Seret untuk memilih area teks
                        </span>
                    </div>
                )}

                {/* Sedang memindai */}
                {scanning && (
                    <div className="absolute inset-0 grid place-items-center bg-black/45">
                        <span className="rounded-lg bg-black/70 px-4 py-2 text-xs font-medium text-white">
                            Memindai teks…
                        </span>
                    </div>
                )}
            </div>

            {/* Pesan galat */}
            {scanError && (
                <p className="mt-3 rounded-xl border border-[var(--color-warn)] bg-[var(--color-warn-soft)] px-4 py-2.5 text-sm text-ink-soft">
                    {scanError}
                </p>
            )}

            {/* Scan button */}
            {hasSelection && !scanned && (
                <button
                    onClick={() => void handleScan()}
                    disabled={scanning}
                    className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-[var(--color-brand-ink)] shadow-[var(--shadow-brand)] hover:bg-brand-strong transition-all disabled:opacity-60"
                >
                    {scanning ? "Memindai…" : "Pindai Teks di Area Ini"}
                </button>
            )}

            {/* OCR Result */}
            {ocr && (
                <div className="mt-4 rounded-xl border border-line bg-surface p-5 animate-[fade-in_250ms_ease-out_both]">

                    {/* Mode tabs */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setMode("dyslexic")}
                            className={cx(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                                mode === "dyslexic"
                                    ? "bg-brand text-[var(--color-brand-ink)]"
                                    : "text-ink-soft hover:text-ink hover:bg-[var(--color-line-soft)]",
                            )}
                        >
                            Font Dysleksia
                        </button>
                        <button
                            onClick={() => setMode("summary")}
                            className={cx(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                                mode === "summary"
                                    ? "bg-brand text-[var(--color-brand-ink)]"
                                    : "text-ink-soft hover:text-ink hover:bg-[var(--color-line-soft)]",
                            )}
                        >
                            Ringkasan AI
                        </button>
                    </div>

                    {mode === "dyslexic" ? (
                        <div
                            className="reading-area !rounded-xl !px-5 !py-4 !max-w-none"
                        >
                            {ocr.text}
                        </div>
                    ) : (
                        <div className="rounded-xl bg-[var(--color-brand-softer)] px-5 py-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">
                                Ringkasan AI
                            </p>
                            <p
                                className="text-sm text-ink-soft"
                                style={{
                                    fontFamily: "var(--font-reading)",
                                    lineHeight: 1.5,
                                    letterSpacing: "0.12em",
                                    wordSpacing: "0.42em",
                                }}
                            >
                                {ocr.summary}
                            </p>
                        </div>
                    )}

                    {ocr.warnings.length > 0 && (
                        <p className="mt-3 text-xs text-ink-mute">
                            Catatan: {ocr.warnings.join(", ")}.
                        </p>
                    )}

                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => onConfirm(ocr.text)}
                            className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-ink)] hover:bg-brand-strong shadow-[var(--shadow-brand)] transition-all"
                        >
                            Simpan Materi
                        </button>
                    </div>
                </div>
            )}

            {/* Cancel when not yet scanned */}
            {!scanned && (
                <button
                    onClick={onCancel}
                    className="mt-3 w-full rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] transition-colors"
                >
                    Batal
                </button>
            )}
        </div>
    )
}
