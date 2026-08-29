"use client"

import { useState } from "react"
import { Card, Button, ProgressBar, StatusPill, cx } from "../components/ui"
import { IconClipboard, IconSparkle, IconArrow, IconCheck, IconInfo } from "../components/icons"
import { demoTitle, demoParagraphs, quizQuestions } from "../data/mock"

type Analysis = {
  ok: boolean
  ide: number
  eksplisit: number
  konteks: number
  feedback: string
}

// Simulasi analisis LLM: mencocokkan kata kunci + panjang jawaban.
function analyze(answer: string, keywords: string[]): Analysis {
  const text = answer.toLowerCase()
  const hits = keywords.filter((k) => text.includes(k)).length
  const idea = Math.min(2, hits)
  const eksplisit = text.trim().split(/\s+/).filter(Boolean).length >= 6 ? 2 : text.trim() ? 1 : 0
  const konteks = hits >= 2 ? 2 : hits === 1 ? 1 : 0
  const total = idea + eksplisit + konteks
  const ok = total >= 4
  return {
    ok,
    ide: idea,
    eksplisit,
    konteks,
    feedback: ok
      ? "Jawabanmu sudah mencakup ide utama bacaan dengan baik. Pertahankan!"
      : "Jawabanmu sudah dekat. Coba sebutkan kata kunci utama dari bacaan dan tambahkan sedikit detail konteks.",
  }
}

export default function ComprehensionCheck({ embedded = false }: { embedded?: boolean }) {
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)

  const q = quizQuestions[idx]!

  const submit = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(analyze(answer, q.keywords))
      setLoading(false)
    }, 800)
  }

  const next = () => {
    if (idx < quizQuestions.length - 1) {
      setIdx(idx + 1)
      setAnswer("")
      setResult(null)
    }
  }

  const rows: [string, number][] = result
    ? [["Ide Utama", result.ide], ["Informasi Eksplisit", result.eksplisit], ["Kesesuaian Konteks", result.konteks]]
    : []

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <IconClipboard className="text-brand" /> Reading Comprehension Check
          </h1>
          <p className="text-sm text-ink-soft">Jawab pertanyaan berikut berdasarkan bacaan yang kamu baca.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand">Bacaan yang kamu baca</div>
            <div className="mt-1 font-semibold text-ink">{demoTitle}</div>
            <div className="reading-area mt-3">{demoParagraphs.slice(0, 2).join(" ")}</div>
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">Pertanyaan {idx + 1} dari {quizQuestions.length}</span>
              <span className="text-ink-mute">{Math.round(((idx + 1) / quizQuestions.length) * 100)}%</span>
            </div>
            <ProgressBar value={((idx + 1) / quizQuestions.length) * 100} />

            <h2 className="mt-5 text-lg font-semibold text-ink">{idx + 1}. {q.prompt}</h2>
            <p className="mt-1 text-sm text-ink-mute">Jawab dengan kalimatmu sendiri.</p>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={500}
              rows={5}
              placeholder="Ketik jawabanmu di sini…"
              className="mt-3 w-full resize-none rounded-xl border border-line bg-canvas p-3 text-[15px] text-ink outline-none focus:border-brand"
            />
            <div className="mb-4 mt-1 text-right text-xs text-ink-mute">{answer.length} / 500</div>

            <div className="flex items-center gap-2 rounded-lg bg-canvas p-2.5 text-xs text-ink-soft">
              <IconInfo width={15} height={15} className="text-brand" /> Tips: coba jawab dengan kata-katamu sendiri, bukan menyalin bacaan.
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="ghost" disabled={idx === 0} onClick={() => { setIdx(idx - 1); setAnswer(""); setResult(null) }}>Sebelumnya</Button>
              {result ? (
                <Button onClick={next} disabled={idx === quizQuestions.length - 1}>
                  Selanjutnya <IconArrow width={15} height={15} />
                </Button>
              ) : (
                <Button onClick={submit} disabled={!answer.trim() || loading}>
                  {loading ? "Menganalisis…" : "Periksa Jawaban"}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className={cx("h-full", result && (result.ok ? "border-[var(--color-good)]" : "border-[var(--color-warn)]"))}>
            <div className="flex items-center gap-2 font-semibold text-ink">
              <IconSparkle width={17} height={17} className="text-brand" /> Hasil Analisis AI
            </div>

            {!result ? (
              <div className="mt-6 grid min-h-52 place-items-center text-center text-sm text-ink-mute">
                {loading ? "AI sedang menganalisis jawabanmu…" : "Hasil penilaian akan muncul setelah kamu memeriksa jawaban."}
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl bg-canvas p-4 text-center">
                  <div className="mb-2 flex justify-center"><StatusPill ok={result.ok} /></div>
                  <p className="text-sm text-ink-soft">{result.ok ? "Kamu memahami ide utama bacaan." : "Pemahamanmu masih bisa ditingkatkan."}</p>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-mute">Rincian Penilaian</div>
                  <ul className="space-y-2.5">
                    {rows.map(([label, val]) => (
                      <li key={label}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-ink">{label}</span>
                          <span className="flex items-center gap-1 tabular-nums text-ink-soft">
                            {val}/2 {val === 2 && <IconCheck width={13} height={13} className="text-[var(--color-good)]" />}
                          </span>
                        </div>
                        <ProgressBar value={(val / 2) * 100} tone={val === 2 ? "good" : val === 1 ? "brand" : "warn"} />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-brand-soft p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-brand-strong"><IconSparkle width={14} height={14} /> Feedback AI</div>
                  <p className="font-dyslexic text-sm text-ink-soft">{result.feedback}</p>
                </div>

                <p className="text-xs text-ink-mute">Hasil ini akan disimpan ke Progress & Achievement sebagai indikator perkembangan pemahamanmu.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
