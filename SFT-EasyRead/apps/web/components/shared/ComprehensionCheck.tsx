"use client"

import { useEffect, useState } from "react"
import { Card, Button, ProgressBar, StatusPill, cx } from "@/components/shared/ui"
import { IconClipboard, IconSparkle, IconArrow, IconCheck, IconInfo, IconBook } from "@/components/shared/icons"
import { logActivity, type ActiveMaterial } from "@/lib/session"
import { fetchQuiz, submitQuizAnswer, isOk } from "@/lib/api"
import { useActiveDocument } from "@/lib/use-active-document"
import { hrefFor } from "@/lib/nav"
import { useRouter } from "next/navigation"

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

export default function ComprehensionCheck({
  embedded = false,
  material: materialProp,
}: {
  embedded?: boolean
  material?: ActiveMaterial | null
}) {
  const router = useRouter()
  const own = useActiveDocument({ skip: materialProp !== undefined })
  const material = materialProp !== undefined ? materialProp : own.material
  const materialLoading = materialProp !== undefined ? false : own.loading
  const materialError = materialProp !== undefined ? null : own.error

  const [serverQuestions, setServerQuestions] = useState<Question[] | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const documentId = material?.id && UUID.test(material.id) ? material.id : null

  useEffect(() => {
    if (!documentId) {
      setServerQuestions(null)
      setQuizError(null)
      setQuizLoading(false)
      return
    }

    let alive = true
    setQuizLoading(true)
    setQuizError(null)
    setServerQuestions(null)
    setIdx(0)
    setAnswer("")
    setResult(null)
    setFinished(false)

    void fetchQuiz(documentId).then((quiz) => {
      if (!alive) return

      if (isOk(quiz) && quiz.data.questions.length > 0) {
        setServerQuestions(
          quiz.data.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            keywords: q.keywords,
          })),
        )
      } else {
        setQuizError(
          "error" in quiz && "message" in quiz && typeof quiz.message === "string"
            ? quiz.message
            : "Kuis belum bisa dibuat dari bacaan ini. Coba lagi nanti.",
        )
      }

      setQuizLoading(false)
    })

    return () => {
      alive = false
    }
  }, [documentId, reloadToken])

  const title = material?.title ?? "Materi"
  const paragraphs =
    material?.paragraphs?.length
      ? material.paragraphs
      : material?.originalText?.trim()
        ? [material.originalText]
        : []
  const questions = serverQuestions ?? []
  const q = questions[idx]

  const submit = async () => {
    if (!q?.id) return

    setLoading(true)
    setResult(null)

    const response = await submitQuizAnswer(q.id, answer)
    if (!isOk(response)) {
      setResult(null)
      setLoading(false)
      setQuizError("Gagal menilai jawaban. Periksa koneksi lalu coba lagi.")
      return
    }

    const r = response.data
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
          {materialLoading ? (
            <Card>
              <p className="py-8 text-center text-sm text-ink-mute">Memuat materi dari akun…</p>
            </Card>
          ) : !material ? (
            <Card>
              <div className="flex flex-col items-center py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                  <IconBook width={22} height={22} />
                </span>
                <h2 className="mt-4 font-semibold text-ink">Belum ada materi untuk dikuis</h2>
                <p className="mt-1 max-w-md text-sm text-ink-soft">
                  {materialError ?? "Buka materi dari beranda dulu. Kuis dibuat dari teks yang tersimpan di akun."}
                </p>
                <Button className="mt-5" onClick={() => router.push(hrefFor("home"))}>
                  Pilih Materi
                </Button>
              </div>
            </Card>
          ) : (
            <>
          <Card>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand">Bacaan yang kamu baca</div>
            <div className="mt-1 font-semibold text-ink">{title}</div>
            <div className="reading-area mt-3">
              {paragraphs.slice(0, 2).join(" ") || "Teks bacaan belum tersedia untuk materi ini."}
            </div>
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
          ) : quizLoading ? (
            <Card>
              <p className="py-8 text-center text-sm text-ink-mute">Menyiapkan pertanyaan dari bacaanmu…</p>
            </Card>
          ) : quizError || !q ? (
            <Card>
              <p className="text-sm text-ink-soft">{quizError ?? "Belum ada pertanyaan untuk materi ini."}</p>
              <Button className="mt-4" variant="soft" onClick={() => setReloadToken((n) => n + 1)}>
                Coba lagi
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
                {`${idx + 1}. ${q.prompt}`}
              </h2>
              <p className="mt-1 text-sm text-ink-mute">Jawab dengan kalimatmu sendiri.</p>

              {quizError && (
                <p className="mt-3 rounded-xl border border-[var(--color-warn)] bg-[var(--color-warn-soft)] px-3 py-2 text-xs text-ink-soft">
                  {quizError}
                </p>
              )}

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
                  <Button onClick={() => void submit()} disabled={!answer.trim() || loading}>
                    {loading ? "Menganalisis…" : "Periksa Jawaban"}
                  </Button>
                )}
              </div>
            </Card>
          )}
            </>
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
