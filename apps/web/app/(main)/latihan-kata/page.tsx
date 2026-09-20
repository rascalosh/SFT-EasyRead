import { Suspense } from "react"
import LatihanKataPage from "@/components/latihan-kata/LatihanKataPage"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-ink">Latihan Kata</h1>
          <p className="text-sm text-ink-mute">Memuat materi…</p>
        </div>
      }
    >
      <LatihanKataPage />
    </Suspense>
  )
}
