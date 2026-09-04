import Link from "next/link"
import { ArrowLeft, BookOpen } from "lucide-react"
import { AktivitasList } from "../../../../components/materi/AktivitasList"

const CONTOH = {
  title: "Perjuangan Bangsa Indonesia",
  paragraphs: [
    "Perjuangan bangsa Indonesia untuk merdeka sangat panjang dan penuh rintangan.",
    "Para pahlawan tidak menyerah meskipun banyak cobaan yang datang.",
    "Mereka berjuang demi masa depan yang lebih baik bagi generasi selanjutnya.",
    "Semangat persatuan menjadi kunci utama untuk meraih kemerdekaan.",
  ],
}

export default function DetailMateri() {
  const fullText = CONTOH.paragraphs.join(" ")

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex items-center gap-4">
        <Link
          href="/home"
          className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <h1 className="text-lg font-bold text-ink">Detail Materi</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
            <BookOpen className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink">{CONTOH.title}</h2>
            <div className="mt-3 space-y-3 text-ink-soft">
              {CONTOH.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="px-1 pb-3 pt-8 text-xs font-bold uppercase tracking-wide text-ink-soft">
        Pilih Aktivitas
      </p>

      <AktivitasList text={fullText} />
    </div>
  )
}