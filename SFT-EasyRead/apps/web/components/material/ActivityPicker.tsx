import { IconSparkle, IconWave, IconLetters, IconMic } from "@/components/shared/icons"
import { ActivityCard, type ActivityTool } from "./ActivityCard"
import { hrefFor } from "@/lib/nav"

const tools: Omit<ActivityTool, "href">[] = [
  {
    id: "simplify",
    icon: <IconSparkle width={26} height={26} />,
    title: "Simplify & Ringkasan",
    subtitle: "AI menyederhanakan teks",
    body: "Teks dipecah jadi kalimat pendek dan ringkas agar lebih mudah dipahami. Tersedia juga ringkasan poin utama.",
    color: {
      bg: "bg-brand-soft",
      text: "text-brand-strong",
      border: "border-brand/20 hover:border-brand/60",
    },
  },
  {
    id: "tracking",
    icon: <IconWave width={26} height={26} />,
    title: "Multisensory Tracking",
    subtitle: "Dengar, lihat, ikuti",
    body: "Setiap kata disorot saat dibacakan. Bantu otak menyinkronkan bunyi dan tulisan secara bersamaan.",
    color: {
      bg: "bg-[var(--color-lavender-soft)]",
      text: "text-[var(--color-lavender)]",
      border: "border-[var(--color-lavender)]/20 hover:border-[var(--color-lavender)]/50",
    },
  },
  {
    id: "syllable",
    icon: <IconLetters width={26} height={26} />,
    title: "Latihan Kata (Syllable)",
    subtitle: "Pecah suku kata",
    body: "Kata panjang dipecah jadi suku kata kecil. Latih pengucapan satu suku kata per ketukan.",
    color: {
      bg: "bg-[var(--color-amber-soft)]",
      text: "text-[var(--color-amber)]",
      border: "border-[var(--color-amber)]/20 hover:border-[var(--color-amber)]/50",
    },
  },
  {
    id: "assessment",
    icon: <IconMic width={26} height={26} />,
    title: "Penilaian Membaca",
    subtitle: "Rekam suara & kuis",
    body: "Baca nyaring untuk dinilai kelancarannya, atau jawab kuis pemahaman dari bacaan materi ini.",
    color: {
      bg: "bg-[var(--color-good-soft)]",
      text: "text-[var(--color-good)]",
      border: "border-[var(--color-good)]/20 hover:border-[var(--color-good)]/50",
    },
  },
]

export function ActivityPicker({ materialId }: { materialId: string }) {
  return (
    <div>
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-mute">
        Pilih aktivitas
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <ActivityCard
            key={tool.id}
            tool={{
              ...tool,
              href: hrefFor(tool.id, materialId),
            }}
          />
        ))}
      </div>
    </div>
  )
}
