import { Suspense } from "react"
import SimplifyPage, { SimplifyLoadingState } from "@/components/simplify/SimplifyPage"

export default function Page() {
  return (
    <Suspense fallback={<SimplifyLoadingState />}>
      <SimplifyPage />
    </Suspense>
  )
}
