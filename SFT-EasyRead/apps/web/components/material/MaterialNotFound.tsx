import Link from "next/link"
import { hrefFor } from "@/lib/nav"

export function MaterialNotFound() {
  return (
    <p className="text-ink-soft">
      Materi tidak ditemukan.{" "}
      <Link href={hrefFor("home")} className="font-semibold text-brand">
        Kembali ke Materi Baru
      </Link>
    </p>
  )
}
