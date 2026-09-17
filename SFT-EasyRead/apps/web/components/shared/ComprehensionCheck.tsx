"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, Button, ProgressBar, ProgressRing, StatusPill, Alert, cx } from "@/components/shared/ui"
import {
  IconClipboard,
  IconSparkle,
  IconArrow,
  IconArrowLeft,
  IconCheck,
  IconInfo,
  IconBook,
  IconMic,
  IconMicOff,
  IconSpeaker,
  IconSpeakerOff,
  IconRefresh,
} from "@/components/shared/icons"
import { logActivity, type ActiveMaterial } from "@/lib/session"
import { fetchQuiz, submitQuizAnswer, isOk } from "@/lib/api"
import { useActiveDocument } from "@/lib/use-active-document"
import { useReadingSettings } from "@/lib/use-reading-settings"
import { useSpeaker } from "@/lib/use-speaker"
import { useDictation } from "@/lib/use-dictation"
import { hrefFor } from "@/lib/nav"
import { ReadingPassage } from "@/components/penilaian/ReadingPassage"
import { useMaterialPassage } from "@/lib/use-material-passage"

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

const MAX_ANSWER = 500

export default function ComprehensionCheck({
  embedded = false,
  material: materialProp,
  onSwitchToVoice,
}: {
  embedded?: boolean
  material?: ActiveMaterial | null
  onSwitchToVoice?: () => void
}) {
  const router = useRouter()
  const own = useActiveDocument({ skip: materialProp !== undefined })
  const material = materialProp !== undefined ? materialProp : own.material
  const materialLoading = materialProp !== undefined ? false : own.loading
  const materialError = materialProp !== undefined ? null : own.error

  const { settingsRef } = useReadingSettings()
  const speaker = useSpeaker(settingsRef)

  const [serverQuestions, setServerQuestions] = useState<Question[] | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [results, setResults] = useState<(Analysis | null)[]>([])
  const [checking, setChecking] = useState(false)
  const [finished, setFinished] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const documentId = material?.id && UUID.test(material.id) ? material.id : null

  const appendDictation = useCallback(
    (text: string) => {
      setAnswers((prev) => {
        const next = [...prev]
        const current = next[idx] ?? ""
        const joined = current ? `${current} ${text}` : text
        next[idx] = joined.slice(0, MAX_ANSWER)
        return next
      })
    },
    [idx],
  )
  const dictation = useDictation(settingsRef, appendDictation)

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
    setSubmitError(null)
    setServerQuestions(null)
    setIdx(0)
    setAnswers([])
    setResults([])
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
  const passage = useMaterialPassage(material)
  const questions = serverQuestions ?? []
  const total = questions.length
  // Sebelum effect pertama berjalan, soal masih null; jangan sempat menampilkan
  // "belum ada pertanyaan" sekejap sebelum status memuat.
  const preparing = quizLoading || (documentId !== null && serverQuestions === null && !quizError)
  const q = questions[idx]
  const answer = answers[idx] ?? ""
  const result = results[idx] ?? null
  const answeredCount = results.filter(Boolean).length
  const okCount = results.filter((r) => r?.ok).length
  const isLast = idx === total - 1

  const setAnswer = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[idx] = value.slice(0, MAX_ANSWER)
      return next
    })
  }

  const quiet = () => {
    speaker.stop()
    dictation.stop()
  }

  const goTo = (target: number) => {
    quiet()
    setSubmitError(null)
    setIdx(Math.min(Math.max(0, target), Math.max(0, total - 1)))
  }

  const submit = async () => {
    if (!q?.id || !answer.trim()) return

    quiet()
    setChecking(true)
    setSubmitError(null)

    const response = await submitQuizAnswer(q.id, answer.trim())
    setChecking(false)

    if (!isOk(response)) {
      setSubmitError("Jawaban belum bisa dinilai. Periksa koneksi internet, lalu tekan Periksa Jawaban lagi.")
      return
    }

    setResults((prev) => {
      const next = [...prev]
      next[idx] = response.data
      return next
    })
  }

  const finishQuiz = () => {
    quiet()
    const passed = okCount * 2 >= total
    logActivity({
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      activity: "Kuis Pemahaman",
      materialTitle: title,
      result: `${okCount}/${total} Paham`,
      status: passed ? "Paham" : "Belum Paham",
    })
    setFinished(true)
  }

  const restart = () => {
    quiet()
    setIdx(0)
    setAnswers([])
    setResults([])
    setSubmitError(null)
    setFinished(false)
  }

  const questionKey = `question-${idx}`

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <IconClipboard className="text-brand" /> Kuis Pemahaman
          </h1>
          <p className="text-sm text-ink-soft">Jawab pertanyaan berikut berdasarkan bacaan yang kamu baca.</p>
        </div>
      )}

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
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <ReadingPassage
            title={title}
            paragraphs={passage.paragraphs}
            markdown={passage.markdown}
            label={passage.label}
            collapsible
            defaultOpen={false}
            speaking={speaker.speaking && speaker.speakingKey === "passage"}
            onToggleListen={speaker.supported ? () => speaker.toggle(passage.listenText, "passage") : undefined}
            listenLabel="Dengarkan"
            source={passage.source}
            onSourceChange={(next) => {
              speaker.stop()
              passage.setSource(next)
            }}
            sourceOptions={passage.options}
          />

          {finished ? (
            <Card className="animate-fade-in border-[var(--color-good)]/50">
              <div className="flex flex-col items-center gap-6 md:flex-row">
                <div className="relative shrink-0">
                  <ProgressRing
                    value={total ? (okCount / total) * 100 : 0}
                    size={136}
                    tone={okCount * 2 >= total ? "good" : "brand"}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-bold tabular-nums text-ink">
                      {okCount}<span className="text-lg text-ink-mute">/{total}</span>
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-ink-mute">paham</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Kuis selesai</p>
                  <h2 className="mt-1 text-heading-2 text-ink">
                    {okCount === total
                      ? "Hebat, semua jawabanmu tepat!"
                      : okCount * 2 >= total
                        ? "Bagus, kamu memahami sebagian besar bacaan."
                        : "Terus berlatih, kamu sudah selangkah lebih maju."}
                  </h2>
                  <p className="mt-2 font-dyslexic">
                    {okCount === total
                      ? "Coba bacaan lain yang sedikit lebih panjang untuk tantangan berikutnya."
                      : "Baca ulang bagian yang masih terasa sulit, lalu coba kuisnya lagi."}
                  </p>
                </div>
              </div>

              <ul className="mt-6 divide-y divide-line border-t border-line">
                {questions.map((item, i) => {
                  const r = results[i]
                  return (
                    <li key={item.id ?? i} className="flex items-start justify-between gap-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFinished(false)
                          goTo(i)
                        }}
                        className="min-w-0 flex-1 text-left text-sm text-ink hover:text-brand"
                      >
                        <span className="mr-1.5 font-semibold">{i + 1}.</span>
                        {item.prompt}
                      </button>
                      <span className="shrink-0">{r ? <StatusPill ok={r.ok} /> : null}</span>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={restart}>
                  <IconRefresh width={16} height={16} /> Ulangi kuis
                </Button>
                {onSwitchToVoice && (
                  <Button variant="outline" onClick={onSwitchToVoice}>
                    <IconMic width={16} height={16} /> Coba baca nyaring
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => router.push(hrefFor("material", documentId ?? undefined))}
                >
                  <IconBook width={16} height={16} /> Kembali ke materi
                </Button>
              </div>
            </Card>
          ) : preparing ? (
            <Card>
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <span className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-brand border-t-transparent" aria-hidden />
                <div>
                  <p className="font-semibold text-ink">Menyiapkan pertanyaan dari bacaanmu…</p>
                  <p className="mt-1 text-sm text-ink-mute">Sebentar saja.</p>
                </div>
              </div>
            </Card>
          ) : quizError || !q ? (
            <Card>
              <Alert tone="warn" title="Kuis belum siap">
                {quizError ?? "Belum ada pertanyaan untuk materi ini."}
              </Alert>
              <Button className="mt-4" variant="soft" onClick={() => setReloadToken((n) => n + 1)}>
                <IconRefresh width={15} height={15} /> Coba lagi
              </Button>
            </Card>
          ) : (
            <Card className="animate-fade-in" key={idx}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">
                  Pertanyaan {idx + 1} dari {total}
                </span>
                <ol className="flex items-center gap-1.5" aria-label="Kemajuan kuis">
                  {questions.map((item, i) => {
                    const r = results[i]
                    return (
                      <li key={item.id ?? i}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          aria-label={`Pertanyaan ${i + 1}${r ? (r.ok ? ", paham" : ", belum paham") : ""}`}
                          aria-current={i === idx ? "step" : undefined}
                          disabled={!r && i > answeredCount}
                          className={cx(
                            "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            i === idx
                              ? "bg-brand text-[var(--color-brand-ink)] shadow-[var(--shadow-brand)]"
                              : r
                                ? r.ok
                                  ? "bg-[var(--color-good-soft)] text-[var(--color-good)]"
                                  : "bg-[var(--color-warn-soft)] text-[var(--color-warn)]"
                                : "bg-[var(--color-line-soft)] text-ink-mute",
                          )}
                        >
                          {r ? <IconCheck width={13} height={13} /> : i + 1}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
              <ProgressBar value={(answeredCount / total) * 100} tone="good" className="mt-3" />

              <div className="mt-6 rounded-xl bg-brand-soft/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-dyslexic !text-[calc(var(--reading-font-size)*1.05)] font-semibold text-ink">
                    {q.prompt}
                  </h2>
                  {speaker.supported && (
                    <Button
                      type="button"
                      size="sm"
                      variant={speaker.speaking && speaker.speakingKey === questionKey ? "primary" : "outline"}
                      onClick={() => speaker.toggle(q.prompt, questionKey)}
                      aria-pressed={speaker.speaking && speaker.speakingKey === questionKey}
                      className="shrink-0"
                    >
                      {speaker.speaking && speaker.speakingKey === questionKey ? (
                        <><IconSpeakerOff width={15} height={15} /> Berhenti</>
                      ) : (
                        <><IconSpeaker width={15} height={15} /> Dengarkan</>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {result ? (
                <div className="mt-5 space-y-5 animate-fade-in">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Jawabanmu</p>
                    <p className="mt-1.5 rounded-xl border border-line bg-canvas px-4 py-3 font-dyslexic !text-base">
                      {answer}
                    </p>
                  </div>

                  <div
                    className={cx(
                      "rounded-xl border p-4",
                      result.ok
                        ? "border-[var(--color-good)]/40 bg-[var(--color-good-soft)]"
                        : "border-[var(--color-warn)]/40 bg-[var(--color-warn-soft)]",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill ok={result.ok} />
                      <span className="text-sm font-medium text-ink">
                        {result.ok ? "Kamu menangkap inti bacaan." : "Hampir. Lihat catatan di bawah."}
                      </span>
                    </div>

                    <p className="mt-3 font-dyslexic !text-base">{result.feedback}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button variant="ghost" disabled={idx === 0} onClick={() => goTo(idx - 1)}>
                      <IconArrowLeft width={15} height={15} /> Sebelumnya
                    </Button>
                    {isLast ? (
                      <Button size="lg" onClick={finishQuiz} disabled={answeredCount < total}>
                        Lihat hasil akhir <IconArrow width={16} height={16} />
                      </Button>
                    ) : (
                      <Button size="lg" onClick={() => goTo(idx + 1)}>
                        Pertanyaan berikutnya <IconArrow width={16} height={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {submitError && (
                    <Alert tone="warn" onClose={() => setSubmitError(null)}>
                      {submitError}
                    </Alert>
                  )}
                  {dictation.error && (
                    <Alert tone="warn" onClose={dictation.clearError}>
                      {dictation.error}
                    </Alert>
                  )}

                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={`answer-${idx}`} className="text-sm font-semibold text-ink">
                        Jawabanmu
                      </label>
                      {dictation.supported && (
                        <Button
                          type="button"
                          size="sm"
                          variant={dictation.listening ? "primary" : "soft"}
                          onClick={() => {
                            if (dictation.listening) {
                              dictation.stop()
                              return
                            }
                            speaker.stop()
                            dictation.start()
                          }}
                          aria-pressed={dictation.listening}
                        >
                          {dictation.listening ? (
                            <>
                              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                                <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                              </span>
                              Mendengarkan… tekan untuk berhenti
                            </>
                          ) : (
                            <><IconMic width={15} height={15} /> Jawab dengan suara</>
                          )}
                        </Button>
                      )}
                    </div>
                    <textarea
                      id={`answer-${idx}`}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      maxLength={MAX_ANSWER}
                      rows={5}
                      disabled={checking}
                      placeholder={
                        dictation.listening
                          ? "Silakan bicara, kata-katamu akan muncul di sini…"
                          : "Ketik jawabanmu di sini, atau tekan Jawab dengan suara."
                      }
                      className={cx(
                        "font-dyslexic w-full resize-y rounded-xl border bg-canvas p-4 !text-[calc(var(--reading-font-size)*0.9)] text-ink outline-none transition-all",
                        "placeholder:opacity-50 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60",
                        dictation.listening ? "border-brand ring-2 ring-brand/20" : "border-line",
                      )}
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-ink-mute">
                      <span className="flex items-center gap-1.5">
                        <IconInfo width={14} height={14} className="shrink-0 text-brand" />
                        Pakai kata-katamu sendiri. Tidak perlu sama persis dengan bacaan.
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">{answer.length}/{MAX_ANSWER}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button variant="ghost" disabled={idx === 0} onClick={() => goTo(idx - 1)}>
                      <IconArrowLeft width={15} height={15} /> Sebelumnya
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => void submit()}
                      disabled={!answer.trim() || checking || dictation.listening}
                      loading={checking}
                    >
                      {checking ? "Menilai jawaban…" : (<><IconSparkle width={16} height={16} /> Periksa Jawaban</>)}
                    </Button>
                  </div>
                  {dictation.listening && (
                    <p className="text-xs text-ink-mute">
                      <IconMicOff width={12} height={12} className="mr-1 inline" aria-hidden />
                      Hentikan dulu mode suara sebelum memeriksa jawaban.
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
