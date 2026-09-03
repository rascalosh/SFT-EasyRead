import { Suspense } from "react"
import SimplifyPage, { SimplifyPageShell } from "@/components/simplify/SimplifyPage"

export default function Page() {
  return (
    <Suspense fallback={<SimplifyPageShell subtitle="Memuat teks materi…" loading />}>
      <SimplifyPage />
    </Suspense>
  )
}
