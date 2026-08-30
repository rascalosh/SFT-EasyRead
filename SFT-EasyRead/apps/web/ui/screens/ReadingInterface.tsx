"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { hrefFor } from "../nav"
import { Card, Button, cx } from "../components/ui"
import { IconSparkle, IconSpeaker, IconTextSize, IconBook } from "../components/icons"
import { demoTitle, demoParagraphs } from "../data/mock"

const overlays = [
  { id: "cream", label: "Krem", value: "var(--color-overlay-cream)" },
  { id: "peach", label: "Persik", value: "var(--color-overlay-peach)" },
  { id: "mint", label: "Mint", value: "var(--color-overlay-mint)" },
  { id: "blue", label: "Biru", value: "var(--color-overlay-blue)" },
  { id: "lilac", label: "Lila", value: "var(--color-overlay-lilac)" },
]

export default function ReadingInterface() {
  const router = useRouter()
  const [dyslexic, setDyslexic] = useState(true)
  const [size, setSize] = useState(20)
  const [spacing, setSpacing] = useState(0.06)
  const [overlay, setOverlay] = useState(overlays[0]!.value)
  const [ruler, setRuler] = useState<number | null>(1)

  const lines = demoParagraphs

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{demoTitle}</h1>
          <p className="text-sm text-ink-soft">Tampilan ramah disleksia · ketuk baris untuk mengaktifkan penggaris fokus.</p>
        </div>
        <Button onClick={() => router.push(hrefFor("simplify"))}>
          <IconSparkle width={17} height={17} /> Simplify Text
        </Button>
      </div>

      <div
        className="rounded-[var(--radius-card)] border border-line p-6 sm:p-10 transition-colors"
        style={{ backgroundColor: overlay }}
      >
        <div
          className={cx("mx-auto max-w-2xl text-left", dyslexic && "font-dyslexic")}
          style={{ fontSize: size, lineHeight: 1.9, letterSpacing: `${spacing}em` }}
        >
          {lines.map((line, i) => (
            <p
              key={i}
              onClick={() => setRuler(ruler === i ? null : i)}
              className={cx(
                "-mx-3 cursor-pointer rounded-lg px-3 py-1.5 transition-colors",
                ruler === i ? "bg-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] shadow-[inset_0_-2px_0_var(--color-brand)]" : "hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]",
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Panel kontrol aksesibilitas */}
      <Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <IconBook width={16} height={16} className="text-brand" /> Font
            </label>
            <div className="inline-flex rounded-xl border border-line bg-canvas p-1">
              <button onClick={() => setDyslexic(true)} className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", dyslexic ? "bg-brand text-[var(--color-brand-ink)]" : "text-ink-soft")}>Ramah Disleksia</button>
              <button onClick={() => setDyslexic(false)} className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", !dyslexic ? "bg-brand text-[var(--color-brand-ink)]" : "text-ink-soft")}>Standar</button>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <IconTextSize width={16} height={16} className="text-brand" /> Ukuran Teks · {size}px
            </label>
            <input type="range" min={16} max={30} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--color-brand)]" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Jarak Huruf</label>
            <input type="range" min={0} max={0.16} step={0.01} value={spacing} onChange={(e) => setSpacing(+e.target.value)} className="w-full accent-[var(--color-brand)]" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Overlay Warna</label>
            <div className="flex flex-wrap gap-2">
              {overlays.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOverlay(o.value)}
                  aria-label={o.label}
                  aria-pressed={overlay === o.value}
                  className={cx("h-8 w-8 rounded-full border-2 transition-transform", overlay === o.value ? "scale-110 border-brand" : "border-line")}
                  style={{ backgroundColor: o.value }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Button variant="soft"><IconSpeaker width={17} height={17} /> Text-to-Speech</Button>
          <span className="text-sm text-ink-mute">Dengarkan teks sambil kata disorot secara real-time.</span>
          <Button variant="outline" className="ml-auto" onClick={() => router.push(hrefFor("tracking"))}>Buka Multisensory Tracking</Button>
        </div>
      </Card>
    </div>
  )
}
