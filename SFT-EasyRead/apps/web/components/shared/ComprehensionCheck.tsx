"use client"

import { useEffect, useState } from "react"
import { Card, Button, ProgressBar, StatusPill, cx } from "@/components/shared/ui"
import { IconClipboard, IconSparkle, IconArrow, IconCheck, IconInfo } from "@/components/shared/icons"
import { demoTitle, demoParagraphs, quizQuestions } from "@/lib/mock"
import { getActiveMaterial, logActivity, type ActiveMaterial } from "@/lib/session"
import { fetchQuiz, submitQuizAnswer, isOk } from "@/lib/api"

type Analysis = {
  ok: boolean
  ide: number
  eksplisit: number
  konteks: number
  feedback: string
}

/** Soal bisa datang dari server (punya id) atau dari fallback lokal (id null). */
type Question = {
  id: string | null
  prompt: string
  keywords: string[]
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Analisis lokal berbasis kata kunci + panjang jawaban.
 * Dipakai hanya sebagai cadangan saat pengguna belum login atau API gagal.
 */
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

/**
 * Buat pertanyaan sederhana dari teks aktif jika tersedia.
 * Ambil 3 kalimat pertama sebagai pertanyaan implisit.
 */
function buildQuestions(paragraphs: string[]): Question[] {
  const sentences = paragraphs
    .join(" ")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, 3)

  if (sentences.length < 2) return quizQuestions.map((q) => ({ id: null, ...q }))

  return sentences.map((s) => ({
    id: null,
    prompt: `Apa yang dimaksud dengan: "${s.slice(0, 80)}…"?`,
    // kata-kata konten (>4 huruf) jadi kunci
    keywords: s.toLowerCase().match(/\b\w{5,}\b/g) ?? [],
  }))
}

export default function ComprehensionCheck({ embedded = false }: { embedded?: boolean }) {
  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [serverQuestions, setServerQuestions] = useState<Question[] | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const active = getActiveMaterial()
    setMaterial(active)

    // Materi mock (id bukan UUID) tidak punya baris di database, jadi kuisnya
    // tetap dibuat lokal.
    if (!active?.id || !UUID.test(active.id)) return

    let alive = true
    setQuizLoading(true)

    void fetchQuiz(active.id).then((quiz) => {
      if (!alive) return

      if (isOk(quiz) && quiz.data.questions.length > 0) {
        setServerQuestions(
          quiz.data.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            keywords: q.keywords,
          })),
        )
        setIdx(0)
      }

      setQuizLoading(false)
    })

    return () => {
      alive = false
    }
  }, [])

  const title = material?.title ?? demoTitle
  const paragraphs =
    material?.paragraphs?.length
      ? material.paragraphs
      : material?.originalText?.trim()
        ? [material.originalText]
        : demoParagraphs
  const questions = serverQuestions ?? buildQuestions(paragraphs)
  const q = questions[idx]!

  const submit = async () => {
    setLoading(true)
    setResult(null)

    let r: Analysis | null = null

    if (q.id) {
      const response = await submitQuizAnswer(q.id, answer)
      if (isOk(response)) r = response.data
    }

    // Belum login, materi mock, atau server gagal → nilai secara lokal.
    if (!r) r = analyze(answer, q.keywords)

    setResult(r)
    setLoading(false)

    if (idx === questions.length - 1) {
      logActivity({
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        activity: "Kuis Pemahaman",
        materialTitle: title,
        result: r.ok ? "Paham" : "Belum Paham",
        status: r.ok ? "Paham" : "Belum Paham",
      })
      setFinished(true)
    }
  }

  const next = () => {
    if (idx < questions.length - 1) {
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
            <div className="mt-1 font-semibold text-ink">{title}</div>
            <div className="reading-area mt-3">{paragraphs.slice(0, 2).join(" ")}</div>
          </Card>

          {finished ? (
            <Card className="border-[var(--color-good)] bg-[var(--color-good-soft)] text-center py-10">
              <div className="flex justify-center mb-3">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-good)] text-white">
                  <IconCheck width={28} height={28} />
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink">Kuis Selesai!</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Kamu sudah menjawab semua {questions.length} pertanyaan. Hasil tersimpan di Progress.
              </p>
              <Button
                className="mt-5"
                onClick={() => { setIdx(0); setAnswer(""); setResult(null); setFinished(false) }}
              >
                Ulangi Kuis
              </Button>
            </Card>
          ) : (
            <Card>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-ink">Pertanyaan {idx + 1} dari {questions.length}</span>
                <span className="text-ink-mute">{Math.round(((idx + 1) / questions.length) * 100)}%</span>
              </div>
              <ProgressBar value={((idx + 1) / questions.length) * 100} />

              <h2 className="mt-5 text-lg font-semibold text-ink">
                {quizLoading ? "Menyiapkan pertanyaan dari bacaanmu…" : `${idx + 1}. ${q.prompt}`}
              </h2>
              <p className="mt-1 text-sm text-ink-mute">Jawab dengan kalimatmu sendiri.</p>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={500}
                rows={5}
                disabled={quizLoading}
                placeholder="Ketik jawabanmu di sini…"
                className="mt-3 w-full resize-none rounded-xl border border-line bg-canvas p-3 text-[15px] text-ink outline-none focus:border-brand"
              />
              <div className="mb-4 mt-1 text-right text-xs text-ink-mute">{answer.length} / 500</div>

              <div className="flex items-center gap-2 rounded-lg bg-canvas p-2.5 text-xs text-ink-soft">
                <IconInfo width={15} height={15} className="text-brand" /> Tips: coba jawab dengan kata-katamu sendiri, bukan menyalin bacaan.
              </div>

              <div className="mt-4 flex justify-between">
                <Button
                  variant="ghost"
                  disabled={idx === 0}
                  onClick={() => { setIdx(idx - 1); setAnswer(""); setResult(null) }}
                >
                  Sebelumnya
                </Button>
                {result ? (
                  <Button onClick={next} disabled={idx === questions.length - 1}>
                    Selanjutnya <IconArrow width={15} height={15} />
                  </Button>
                ) : (
                  <Button onClick={submit} disabled={!answer.trim() || loading || quizLoading}>
                    {loading ? "Menganalisis…" : "Periksa Jawaban"}
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className={cx("h-full", result && (result.ok ? "border-[var(--color-good)]" : "border-[var(--color-warn)]"))}>
            <div className="flex items-center gap-2 font-semibold text-ink">
              <IconSparkle width={17} height={17} className="text-brand" /> Hasil Analisis AI
            </div>

            {!result ? (
              <div className="mt-6 grid min-h-52 place-items-center text-center text-sm text-ink-mute">
                {loading
                  ? "AI sedang menganalisis jawabanmu…"
                  : "Hasil penilaian akan muncul setelah kamu memeriksa jawaban."}
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl bg-canvas p-4 text-center">
                  <div className="mb-2 flex justify-center"><StatusPill ok={result.ok} /></div>
                  <p className="text-sm text-ink-soft">
                    {result.ok ? "Kamu memahami ide utama bacaan." : "Pemahamanmu masih bisa ditingkatkan."}
                  </p>
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
                  <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-brand-strong">
                    <IconSparkle width={14} height={14} /> Feedback AI
                  </div>
                  <p className="font-dyslexic text-sm text-ink-soft">{result.feedback}</p>
                </div>

                <p className="text-xs text-ink-mute">
                  Hasil ini tersimpan di Progress & Achievement sebagai indikator perkembangan pemahamanmu.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
