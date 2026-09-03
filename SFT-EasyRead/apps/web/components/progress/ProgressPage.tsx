"use client"

import { useEffect, useState } from "react"
import { Card, SectionTitle, Tabs, Badge, ScoreMeter, StatusPill, Button } from "@/components/shared/ui"
import { IconChart, IconTrophy, IconArrow, IconTarget, IconPlay } from "@/components/shared/icons"
import {
  progressStats, readingScores, achievements, practiceRecs,
  type ReadingHistory,
} from "@/lib/mock"
import { getActivityLog, type SessionActivity } from "@/lib/session"
import TrendChart from "./TrendChart"

type Mode = "standar" | "personalized"

export default function ProgressAchievement() {
  const [mode, setMode] = useState<Mode>("standar")
  const [activity, setActivity] = useState<SessionActivity[]>([])

  useEffect(() => {
    setActivity(getActivityLog())
  }, [])

  // Merge session activity dengan mock activity (session lebih baru)
  const allActivity = [
    ...activity.map((a) => ({
      date: a.date,
      activity: a.activity,
      mode: "Standar" as const,
      task: a.materialTitle,
      result: a.result,
      status: a.status,
    })),
    ...([
      { date: "20 Mei 2026", activity: "Kuis Pemahaman", mode: "Standar" as const, task: "Perjuangan Bangsa Indonesia", result: "86%", status: "Paham" as const },
      { date: "19 Mei 2026", activity: "Penilaian Membaca", mode: "Personalized" as const, task: "Manfaat Membaca Setiap Hari", result: "88%", status: "Paham" as const },
      { date: "18 Mei 2026", activity: "Kuis Pemahaman", mode: "Standar" as const, task: "Teknologi di Masa Depan", result: "58%", status: "Belum Paham" as const },
      { date: "16 Mei 2026", activity: "Penilaian Membaca", mode: "Personalized" as const, task: "Sejarah Indonesia", result: "82%", status: "Paham" as const },
    ]),
  ].slice(0, 20)

  const paham = allActivity.filter((a) => a.status === "Paham").length
  const belumPaham = allActivity.filter((a) => a.status === "Belum Paham").length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <IconChart className="text-brand" /> Progress & Achievement
          </h1>
          <p className="text-sm text-ink-soft">Pantau perkembangan membacamu dari waktu ke waktu.</p>
        </div>
        <Tabs<Mode>
          value={mode}
          onChange={setMode}
          tabs={[{ id: "standar", label: "Standar" }, { id: "personalized", label: "Personalized" }]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {progressStats.map((s) => (
          <Card key={s.label}>
            <div className="text-sm text-ink-mute">{s.label}</div>
            <div className="mt-1 text-2xl font-bold text-ink">{s.value}</div>
            <div className="mt-0.5 text-xs text-ink-soft">{s.note}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {mode === "standar" ? (
            <Card>
              <SectionTitle icon={<IconChart width={18} height={18} />} title="Tren Pemahaman (4 Minggu Terakhir)" />
              <TrendChart />
              <div className="mt-4 flex flex-wrap gap-3">
                <Badge tone="good">Paham: {paham} sesi</Badge>
                <Badge tone="warn">Belum Paham: {belumPaham} sesi</Badge>
                <Badge tone="brand">Perlu Review: {belumPaham > 0 ? belumPaham : 0} topik</Badge>
              </div>
            </Card>
          ) : (
            <Card>
              <SectionTitle icon={<IconChart width={18} height={18} />} title="Ringkasan Kemampuan Membaca" />
              <div className="grid gap-4 sm:grid-cols-2">
                {readingScores.map((s) => (
                  <ScoreMeter key={s.label} label={s.label} score={s.score} note={s.note} />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle
              title="Riwayat Perkembangan Terbaru"
              action={
                <button className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-strong">
                  Lihat Semua <IconArrow width={15} height={15} />
                </button>
              }
            />
            {allActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-mute">
                Belum ada aktivitas. Selesaikan kuis atau penilaian untuk melihat riwayat.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-ink-mute">
                      <th className="pb-2 pr-3 font-medium">Tanggal</th>
                      <th className="pb-2 pr-3 font-medium">Aktivitas</th>
                      <th className="hidden pb-2 pr-3 font-medium sm:table-cell">Bacaan</th>
                      <th className="pb-2 pr-3 font-medium">Skor</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {allActivity.map((a, i) => (
                      <tr key={i} className="text-ink-soft">
                        <td className="py-3 pr-3 whitespace-nowrap">{a.date}</td>
                        <td className="py-3 pr-3">{a.activity}</td>
                        <td className="hidden max-w-40 truncate py-3 pr-3 sm:table-cell">{a.task}</td>
                        <td className="py-3 pr-3 font-semibold tabular-nums text-ink">{a.result}</td>
                        <td className="py-3"><StatusPill ok={a.status === "Paham"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle icon={<IconTrophy width={18} height={18} />} title="Pencapaian Terbaru" />
            <ul className="space-y-3">
              {achievements.map((a) => (
                <li key={a.title} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-good-soft)] text-[var(--color-good)]">
                    <IconTrophy width={18} height={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink">{a.title}</div>
                    <div className="text-xs text-ink-soft">{a.body}</div>
                    <div className="mt-0.5 text-xs text-ink-mute">Diraih {a.date}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle icon={<IconTarget width={18} height={18} />} title="Rekomendasi Latihan" />
            <ul className="space-y-2">
              {practiceRecs.map((r) => (
                <li key={r.title} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{r.title}</div>
                    <div className="truncate text-xs text-ink-soft">{r.body}</div>
                  </div>
                  <Button size="sm" variant="soft"><IconPlay width={13} height={13} /> Mulai</Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
