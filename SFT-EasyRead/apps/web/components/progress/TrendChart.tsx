"use client"

import { comprehensionTrend } from "@/lib/mock"

export type TrendPoint = { week: string; value: number }

/** `data` datang dari /api/progress; mock dipakai saat belum login. */
export default function TrendChart({ data }: { data?: TrendPoint[] }) {
  const w = 520, h = 170, pad = 28
  const max = 100
  const series = data && data.length > 1 ? data : comprehensionTrend
  const pts = series.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / (series.length - 1)
    const y = h - pad - (d.value / max) * (h - pad * 2)
    return { x, y, ...d }
  })
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const area = `${line} L${pts[pts.length - 1]!.x},${h - pad} L${pts[0]!.x},${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`Tren pemahaman ${series.length} minggu terakhir, dari ${pts[0]!.value}% ke ${pts[pts.length - 1]!.value}%`}>
      {[0, 25, 50, 75, 100].map((g) => {
        const y = h - pad - (g / max) * (h - pad * 2)
        return <line key={g} x1={pad} y1={y} x2={w - pad} y2={y} stroke="var(--color-line)" strokeWidth={1} />
      })}
      <path d={area} fill="var(--color-brand-soft)" opacity={0.7} />
      <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => (
        <g key={p.week}>
          <circle cx={p.x} cy={p.y} r={4.5} fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth={2.5} />
          <text x={p.x} y={h - 8} textAnchor="middle" className="fill-[var(--color-ink-mute)]" style={{ fontSize: 11 }}>{p.week}</text>
          <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-[var(--color-ink)]" style={{ fontSize: 11, fontWeight: 600 }}>{p.value}%</text>
        </g>
      ))}
    </svg>
  )
}
