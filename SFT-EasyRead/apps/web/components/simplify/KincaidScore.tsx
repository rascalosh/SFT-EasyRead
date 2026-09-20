import { cx } from "@/components/shared/ui"

/** Potongan skor yang cukup untuk ditampilkan — tidak perlu seluruh metrik. */
export type KincaidReading = {
  fkId: number
  band: string | null
}

function formatFk(value: number) {
  return value.toFixed(1)
}

function Stat({
  label,
  reading,
  emphasize = false,
}: {
  label: string
  reading: KincaidReading
  emphasize?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className={cx("mt-0.5 font-mono text-xl font-semibold tabular-nums leading-none", emphasize && "text-brand")}>
        {formatFk(reading.fkId)}
      </p>
      {reading.band ? (
        <p className="mt-1 text-xs opacity-70">seperti bacaan {reading.band}</p>
      ) : (
        <p className="mt-1 text-xs opacity-60">makin rendah makin mudah</p>
      )}
    </div>
  )
}

/**
 * Skor Flesch-Kincaid Indonesia (FK-id). Angka lebih rendah = lebih mudah.
 * Dipakai di panel asli, bacaan mudah, dan inti singkat.
 */
export function KincaidScoreStrip({
  before,
  after,
  afterLabel,
}: {
  before: KincaidReading | null
  after?: KincaidReading | null
  afterLabel: string
}) {
  if (!before && !after) return null

  const delta =
    before && after ? Number((before.fkId - after.fkId).toFixed(1)) : null

  let deltaText: string | null = null
  let deltaTone: "good" | "warn" | "amber" | null = null
  if (delta != null) {
    if (delta >= 0.5) {
      deltaText = `Turun ${formatFk(delta)} — lebih mudah`
      deltaTone = "good"
    } else if (delta <= -0.5) {
      deltaText = `Naik ${formatFk(-delta)} — belum lebih mudah`
      deltaTone = "warn"
    } else {
      deltaText = "Hampir sama dengan teks asli"
      deltaTone = "amber"
    }
  }

  const toneClass =
    deltaTone === "good"
      ? "text-[var(--color-good)]"
      : deltaTone === "warn"
        ? "text-[var(--color-warn)]"
        : "opacity-80"

  return (
    <div className="rounded-2xl border border-current/15 px-4 py-3">
      <p className="text-xs font-semibold opacity-70">Skor Flesch-Kincaid</p>
      <div className="mt-2 flex flex-wrap gap-8">
        {before && <Stat label="Teks asli" reading={before} />}
        {after && <Stat label={afterLabel} reading={after} emphasize />}
      </div>
      {deltaText && (
        <p className={cx("mt-2 text-sm font-medium", toneClass)}>{deltaText}</p>
      )}
    </div>
  )
}

export function KincaidInline({ reading }: { reading: KincaidReading | null }) {
  if (!reading) return null
  return (
    <span className="text-xs tabular-nums opacity-70">
      Kincaid {formatFk(reading.fkId)}
      {reading.band ? ` · ${reading.band}` : ""}
    </span>
  )
}
