"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, Button, Tabs } from "@/components/shared/ui"
import { IconMic, IconClipboard, IconBook } from "@/components/shared/icons"
import ComprehensionCheck from "@/components/shared/ComprehensionCheck"
import VoiceAssessment from "./VoiceAssessment"
import { useActiveDocument } from "@/lib/use-active-document"
import { useReadingSettings } from "@/lib/use-reading-settings"
import { hrefFor } from "@/lib/nav"
import type { AssessmentView } from "@/lib/session"

type AssessType = "suara" | "kuis"

const ASSESS_TABS: { id: AssessType; label: string }[] = [
  { id: "suara", label: "Penilaian Suara" },
  { id: "kuis", label: "Kuis Pemahaman" },
]

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

function typeFromView(view: AssessmentView): AssessType {
  return view === "quiz" ? "kuis" : "suara"
}

export default function PenilaianPage() {
  const router = useRouter()
  const { material, loading, error } = useActiveDocument()
  const { settings } = useReadingSettings()
  const showBoth = settings.assessmentView === "both"
  const [type, setType] = useState<AssessType>(() => typeFromView(settings.assessmentView))
  const [voiceBusy, setVoiceBusy] = useState(false)

  useEffect(() => {
    if (showBoth) return
    setType(typeFromView(settings.assessmentView))
  }, [settings.assessmentView, showBoth])

  // Kembali ke atas saat berpindah mode supaya langkah pertama langsung terlihat.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [type])

  const locked = voiceBusy
  const info = typeInfo[type]
  const active = showBoth ? type : typeFromView(settings.assessmentView)

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
        <IconMic className="text-brand" /> Reading Assessment
      </h1>

      {showBoth && (
        <Tabs<AssessType>
          value={type}
          onChange={(next) => {
            if (locked) return
            setType(next)
          }}
          tabs={ASSESS_TABS}
        />
      )}

      {locked && showBoth && (
        <p className="text-xs text-ink-mute" role="status">
          Selesaikan atau batalkan rekaman dulu sebelum berpindah.
        </p>
      )}

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
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-brand border-t-transparent" aria-hidden />
            <p className="text-sm text-ink-mute">Memuat materi dari akun…</p>
          </div>
        </Card>
      ) : !material ? (
        <Card>
          <div className="flex flex-col items-center py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
              <IconBook width={22} height={22} />
            </span>
            <h2 className="mt-4 font-semibold text-ink">Belum ada materi untuk dinilai</h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              {error ?? "Buka materi dulu, lalu mulai Reading Assessment dari pemilih aktivitas."}
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
          {active === "suara" ? (
            <VoiceAssessment
              material={material}
              onBusyChange={setVoiceBusy}
              onContinueToQuiz={showBoth ? () => setType("kuis") : undefined}
            />
          ) : (
            <ComprehensionCheck
              embedded
              material={material}
              onSwitchToVoice={showBoth ? () => setType("suara") : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}
