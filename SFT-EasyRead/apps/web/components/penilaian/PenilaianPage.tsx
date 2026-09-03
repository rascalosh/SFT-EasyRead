"use client"

import { useState, type ReactNode } from "react"
import { Card, Tabs } from "@/components/shared/ui"
import { IconMic, IconClipboard } from "@/components/shared/icons"
import ComprehensionCheck from "@/components/shared/ComprehensionCheck"
import VoiceAssessment from "./VoiceAssessment"

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

      {type === "suara" ? <VoiceAssessment /> : <ComprehensionCheck embedded />}
    </div>
  )
}
