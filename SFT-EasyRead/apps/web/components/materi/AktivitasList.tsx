"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, Headphones } from "lucide-react"
import { SyllableBreakerModal } from "./SyllableBreakerModal"
import { MultisensoryModal } from "./MultisensoryModal"

export function AktivitasList({ text }: { text: string }) {
  const [syllableOpen, setSyllableOpen] = useState(false)
  const [multiOpen, setMultiOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Simplify */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-500">
            <Sparkles className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h3 className="text-lg font-bold text-ink">Simplify &amp; Ringkasan</h3>
          <p className="mt-1 text-sm text-ink-soft">AI menyederhanakan teks</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
            Teks dipecah jadi kalimat pendek dan ringkas agar lebih mudah dipahami. Tersedia juga ringkasan poin utama.
          </p>
          <Link href="/simplify" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
            Mulai →
          </Link>
        </div>

        {/* Multisensory */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <Headphones className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h3 className="text-lg font-bold text-ink">Multisensory Tracking</h3>
          <p className="mt-1 text-sm text-ink-soft">Dengar, lihat, ikuti</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
            Setiap kata disorot saat dibacakan. Bantu otak menyinkronkan bunyi dan tulisan secara bersamaan.
          </p>
            <button onClick={() => setMultiOpen(true)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
            Mulai →
          </button>
        </div>

        {/* Latihan Kata (Syllable) → buka modal */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600">
            <span className="text-sm font-bold">AP</span>
          </div>
          <h3 className="text-lg font-bold text-ink">Latihan Kata (Syllable)</h3>
          <p className="mt-1 text-sm text-ink-soft">Pecah suku kata</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
            Kata panjang dipecah jadi suku kata kecil. Latih pengucapan satu suku kata per ketukan.
          </p>
          <button
            onClick={() => setSyllableOpen(true)}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-600"
          >
            Mulai →
          </button>
        </div>
      </div>

      <SyllableBreakerModal open={syllableOpen} onClose={() => setSyllableOpen(false)} text={text} />
      <MultisensoryModal open={multiOpen} onClose={() => setMultiOpen(false)} text={text} />    </>
  )
}