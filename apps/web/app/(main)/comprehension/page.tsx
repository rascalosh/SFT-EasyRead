import { Suspense } from "react"
import ComprehensionCheck from "@/components/shared/ComprehensionCheck"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-ink">Reading Comprehension Check</h1>
          <p className="text-sm text-ink-mute">Memuat materi…</p>
        </div>
      }
    >
      <ComprehensionCheck />
    </Suspense>
  )
}
