/** Bentuk payload simplify/summary dari API — longgar supaya cache lama tetap kebaca. */

export type ParagraphDifficulty = "easy" | "medium" | "hard"

export type ValidationStatus = "valid" | "fallback" | "pending" | "rejected"

export type SimplifyView = {
  text: string
  difficulty: ParagraphDifficulty | null
  mixedDifficulty: boolean
  validationStatus: ValidationStatus | null
  confidence: number | null
  originalScore: number | null
  simplifiedScore: number | null
}

export type SummaryView = {
  title: string | null
  summary: string
  points: string[]
  level: number | null
  band: string | null
  fkId: number | null
  freId: number | null
  sourceLevel: number | null
  sourceBand: string | null
  sourceFkId: number | null
  sourceFreId: number | null
  targetLevel: number | null
  validationStatus: ValidationStatus | null
  confidence: number | null
}

const DIFFICULTY_RANK: Record<ParagraphDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function unwrapRow(payload: unknown): Record<string, unknown> {
  const root = asRecord(payload)
  if (!root) return {}
  const data = asRecord(root.data)
  return data ?? root
}

function unwrapResult(row: Record<string, unknown>): Record<string, unknown> {
  return asRecord(row.result) ?? row
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asValidation(value: unknown): ValidationStatus | null {
  if (value === "valid" || value === "fallback" || value === "pending" || value === "rejected") {
    return value
  }
  return null
}

function asDifficulty(value: unknown): ParagraphDifficulty | null {
  if (value === "easy" || value === "medium" || value === "hard") return value
  return null
}

function paragraphText(paragraph: Record<string, unknown>): string {
  return asString(paragraph.simplified) ?? asString(paragraph.original) ?? ""
}

export function parseSimplifyPayload(payload: unknown): SimplifyView {
  const row = unwrapRow(payload)
  const result = unwrapResult(row)
  const paragraphs = Array.isArray(result.paragraphs) ? result.paragraphs : []
  const fromParagraphs = paragraphs
    .map((item) => paragraphText(asRecord(item) ?? {}))
    .filter(Boolean)
    .join("\n\n")

  const difficulties = paragraphs
    .map((item) => asDifficulty(asRecord(item)?.difficulty))
    .filter((item): item is ParagraphDifficulty => item !== null)

  const unique = [...new Set(difficulties)]
  const hardest = unique.reduce<ParagraphDifficulty | null>((current, next) => {
    if (!current) return next
    return DIFFICULTY_RANK[next] > DIFFICULTY_RANK[current] ? next : current
  }, null)

  return {
    text: fromParagraphs || asString(result.simplifiedText) || "",
    difficulty: hardest,
    mixedDifficulty: unique.length > 1,
    validationStatus: asValidation(row.validation_status),
    confidence: asNumber(row.confidence),
    originalScore: asNumber(row.original_readability_score),
    simplifiedScore: asNumber(row.simplified_readability_score),
  }
}

function parseDifficultyBlock(value: unknown) {
  const block = asRecord(value)
  if (!block) {
    return { level: null, band: null, fkId: null, freId: null }
  }
  return {
    level: asNumber(block.level),
    band: asString(block.band),
    fkId: asNumber(block.fkId),
    freId: asNumber(block.freId),
  }
}

export function parseSummaryPayload(payload: unknown): SummaryView {
  const row = unwrapRow(payload)
  const result = unwrapResult(row)
  const points = Array.isArray(result.bulletPoints)
    ? result.bulletPoints.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : []
  const difficulty = parseDifficultyBlock(result.difficulty)
  const source = parseDifficultyBlock(result.sourceDifficulty)

  return {
    title: asString(result.title),
    summary: asString(result.summary) ?? "",
    points,
    level: difficulty.level,
    band: difficulty.band,
    fkId: difficulty.fkId,
    freId: difficulty.freId,
    sourceLevel: source.level,
    sourceBand: source.band,
    sourceFkId: source.fkId,
    sourceFreId: source.freId,
    targetLevel: asNumber(result.targetLevel),
    validationStatus: asValidation(row.validation_status),
    confidence: asNumber(row.confidence),
  }
}

export function emptySimplifyView(): SimplifyView {
  return {
    text: "",
    difficulty: null,
    mixedDifficulty: false,
    validationStatus: null,
    confidence: null,
    originalScore: null,
    simplifiedScore: null,
  }
}

export function emptySummaryView(): SummaryView {
  return {
    title: null,
    summary: "",
    points: [],
    level: null,
    band: null,
    fkId: null,
    freId: null,
    sourceLevel: null,
    sourceBand: null,
    sourceFkId: null,
    sourceFreId: null,
    targetLevel: null,
    validationStatus: null,
    confidence: null,
  }
}

export type ReaderNote = {
  text: string
  tone: "good" | "warn" | "amber" | "neutral" | "error" | "brand"
}

const SCORE_GAP = 5

export function simplifyReaderNotes(view: SimplifyView | null | undefined): ReaderNote[] {
  if (!view) return []
  const notes: ReaderNote[] = []

  if (view.originalScore != null && view.simplifiedScore != null) {
    const delta = view.simplifiedScore - view.originalScore
    if (delta >= SCORE_GAP) notes.push({ text: "Lebih mudah dari teks asli", tone: "good" })
    else if (delta <= -SCORE_GAP) notes.push({ text: "Belum lebih mudah", tone: "warn" })
    else notes.push({ text: "Hampir sama dengan teks asli", tone: "amber" })
  } else if (view.difficulty === "easy") {
    notes.push({ text: "Lebih mudah dibaca", tone: "good" })
  } else if (view.difficulty === "medium") {
    notes.push({ text: "Masih agak sulit", tone: "amber" })
  } else if (view.difficulty === "hard") {
    notes.push({ text: "Masih sulit dibaca", tone: "warn" })
  } else {
    notes.push({ text: "Tekan Proses Ulang untuk cek", tone: "neutral" })
  }

  if (view.validationStatus === "valid") {
    notes.push({ text: "Isinya tetap sama", tone: "good" })
  } else if (view.validationStatus === "fallback") {
    notes.push({ text: "Sebagian tidak diubah, supaya artinya tetap sama", tone: "warn" })
  } else if (view.validationStatus === "rejected") {
    notes.push({ text: "Hasil AI tidak dipakai", tone: "error" })
  }

  return notes
}

function schoolPhrase(band: string | null, level: number | null): string | null {
  if (band) return `seperti bacaan ${band}`
  if (level == null) return null
  if (level <= 4) return "seperti bacaan SD"
  if (level <= 6) return "seperti bacaan SMP"
  if (level <= 8) return "seperti bacaan SMA"
  return "seperti bacaan kuliah"
}

export function summaryReaderNotes(view: SummaryView | null | undefined): string[] {
  if (!view) return []
  const notes: string[] = []
  const likeSchool = schoolPhrase(view.band, view.level)

  if (view.level != null) {
    if (view.level <= 4) {
      notes.push(likeSchool ? `Ringkasan ini mudah dibaca, ${likeSchool}.` : "Ringkasan ini mudah dibaca.")
    } else if (view.level <= 6) {
      notes.push(likeSchool ? `Ringkasan ini cukup mudah, ${likeSchool}.` : "Ringkasan ini cukup mudah.")
    } else {
      notes.push(likeSchool ? `Ringkasan ini masih cukup berat, ${likeSchool}.` : "Ringkasan ini masih cukup berat.")
    }
  }

  if (view.sourceLevel != null && view.level != null) {
    if (view.level < view.sourceLevel) notes.push("Lebih mudah dari teks asli.")
    else if (view.level > view.sourceLevel) notes.push("Belum lebih mudah dari teks asli.")
  }

  if (view.validationStatus === "pending") {
    notes.push("Masih lebih sulit dari yang kita harapkan.")
  }

  return notes
}
