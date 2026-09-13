"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, Tabs, Button } from "@/components/shared/ui"
import { IconMic, IconClipboard, IconBook } from "@/components/shared/icons"
import ComprehensionCheck from "@/components/shared/ComprehensionCheck"
import VoiceAssessment from "./VoiceAssessment"
import { useActiveDocument } from "@/lib/use-active-document"
import { hrefFor } from "@/lib/nav"

type AssessType = "suara" | "kuis"

const typeInfo: Record<AssessType, { title: string; desc: string; icon: ReactNode }> = {
  suara: {
    title: "Personalized Reading Assessment",
    desc: "Baca teks dengan suara nyaring. Sistem menilai kelancaran, kecepatan, jeda, pengulangan, dan akurasi pengucapan.",
    icon: <IconMic width={18} height={18} />,
  },
  kuis: {
    title: "Kuis Pemahaman",
    desc: "Jawab pertanyaan dengan kalimatmu sendiri. AI menilai apakah kamu Paham atau Belum Paham dari isi bacaan.",
    icon: <IconClipboard width={18} height={18} />,
  },
}

export default function PenilaianPage() {
  const router = useRouter()
  const { material, loading, error } = useActiveDocument()
  const [type, setType] = useState<AssessType>("suara")
  const info = typeInfo[type]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <IconMic className="text-brand" /> Penilaian Membaca
        </h1>
        <p className="text-sm text-ink-soft">Pilih tipe penilaian untuk mengukur kemampuan dan pemahaman membacamu.</p>
      </div>

      <Tabs<AssessType>
        value={type}
        onChange={setType}
        tabs={[
          { id: "suara", label: "Penilaian Suara" },
          { id: "kuis", label: "Kuis Pemahaman" },
        ]}
      />

      <Card className="flex items-start gap-3 bg-brand-soft">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-[var(--color-brand-ink)]">
          {info.icon}
        </span>
        <div>
          <h2 className="font-semibold text-ink">{info.title}</h2>
          <p className="text-sm text-ink-soft">{info.desc}</p>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="py-8 text-center text-sm text-ink-mute">Memuat materi dari akun…</p>
        </Card>
      ) : !material ? (
        <Card>
          <div className="flex flex-col items-center py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
              <IconBook width={22} height={22} />
            </span>
            <h2 className="mt-4 font-semibold text-ink">Belum ada materi untuk dinilai</h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              {error ?? "Buka materi dulu, lalu mulai Penilaian Membaca dari pemilih aktivitas."}
            </p>
            <Button className="mt-5" onClick={() => router.push(hrefFor("home"))}>
              Pilih Materi
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {error && (
            <p className="text-sm text-ink-mute" role="status">
              {error}
            </p>
          )}
          {type === "suara" ? (
            <VoiceAssessment material={material} />
          ) : (
            <ComprehensionCheck embedded material={material} />
          )}
        </>
      )}
    </div>
  )
}
