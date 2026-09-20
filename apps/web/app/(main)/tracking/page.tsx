import { Suspense } from "react"
import AudioVisualTracking from "@/components/tracking/TrackingPage"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-ink">Multisensory Tracking</h1>
          <p className="text-sm text-ink-mute">Memuat materi…</p>
        </div>
      }
    >
      <AudioVisualTracking />
    </Suspense>
  )
}
