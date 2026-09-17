import { Suspense } from "react"
import PenilaianPage from "@/components/penilaian/PenilaianPage"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-ink">Reading Assessment</h1>
          <p className="text-sm text-ink-mute">Memuat materi…</p>
        </div>
      }
    >
      <PenilaianPage />
    </Suspense>
  )
}
