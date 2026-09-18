"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, Button, cx } from "@/components/shared/ui"
import { IconPlay, IconPause, IconWave, IconSpeaker, IconBook } from "@/components/shared/icons"
import ScrollEdgeButton from "@/components/shared/ScrollEdgeButton"
import {
  saveSettingsEverywhere,
  TTS_SPEED_OPTIONS,
  ttsSpeedIndex,
} from "@/lib/session"
import { useReadingSettings } from "@/lib/use-reading-settings"
import { useActiveDocument } from "@/lib/use-active-document"
import { hrefFor } from "@/lib/nav"
import { useMaterialPassage } from "@/lib/use-material-passage"
import {
  tokenizeWords,
  utteranceTextFrom,
  wordIndexFromCharIndex,
  applySpeechSettings,
} from "@/lib/tts-sync"

function hasSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

export default function AudioVisualTracking() {
  const router = useRouter()
  const { material, loading, error } = useActiveDocument()
  const { settings, settingsRef } = useReadingSettings()
  const passage = useMaterialPassage(material)
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(() => ttsSpeedIndex(settings.ttsSpeed))
  const autoStartedRef = useRef<string | null>(null)
  const activeRef = useRef(0)
  const playingRef = useRef(false)
  const fromIndexRef = useRef(0)
  const utteranceGenRef = useRef(0)
  const modeRef = useRef<"boundary" | "word">("boundary")
  const keepAliveRef = useRef<number | null>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const activeWordRef = useRef<HTMLSpanElement | null>(null)

  const words = useMemo(() => tokenizeWords(passage.listenText), [passage.listenText])

  const speed = TTS_SPEED_OPTIONS[speedIdx] ?? TTS_SPEED_OPTIONS[1]
  const title = material?.title ?? "Materi"

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    setSpeedIdx(ttsSpeedIndex(settings.ttsSpeed))
  }, [settings.ttsSpeed])

  useEffect(() => {
    setActive(0)
    stopSpeech()
    setPlaying(false)
    autoStartedRef.current = null
  }, [material?.id])

  useEffect(() => {
    setActive(0)
    stopSpeech()
    setPlaying(false)
  }, [passage.source])

  useEffect(() => {
    activeWordRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    })
  }, [active])

  useEffect(() => {
    return () => stopSpeech()
  }, [])

  useEffect(() => {
    if (!material || words.length === 0) return
    if (!settings.autoTts) return
    if (autoStartedRef.current === material.id) return
    autoStartedRef.current = material.id
    const timer = window.setTimeout(() => {
      playingRef.current = true
      setPlaying(true)
      speakFrom(0)
    }, 120)
    return () => window.clearTimeout(timer)
  }, [material?.id, words.length, settings.autoTts])

  function clearTimers() {
    if (keepAliveRef.current != null) {
      window.clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
    if (fallbackTimerRef.current != null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }

  function stopSpeech() {
    clearTimers()
    utteranceGenRef.current += 1
    if (!hasSpeech()) return
    window.speechSynthesis.cancel()
  }

  function startKeepAlive() {
    if (keepAliveRef.current != null) window.clearInterval(keepAliveRef.current)
    keepAliveRef.current = window.setInterval(() => {
      if (!hasSpeech() || !playingRef.current) return
      if (!window.speechSynthesis.speaking) return
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }, 8000)
  }

  function applyVoice(u: SpeechSynthesisUtterance, rate = speed.value) {
    applySpeechSettings(u, settingsRef.current, rate)
  }

  function speakFrom(startIndex: number, rate = speed.value) {
    if (!hasSpeech() || words.length === 0) return

    const from = Math.min(Math.max(0, startIndex), words.length - 1)
    fromIndexRef.current = from
    setActive(from)
    activeRef.current = from
    modeRef.current = "boundary"

    stopSpeech()
    const gen = utteranceGenRef.current

    const text = utteranceTextFrom(words, from)
    const u = new SpeechSynthesisUtterance(text)
    applyVoice(u, rate)

    let gotBoundary = false

    u.onboundary = (event) => {
      if (gen !== utteranceGenRef.current) return
      const name = (event.name ?? "").toLowerCase()
      if (name && name !== "word") return
      gotBoundary = true
      if (fallbackTimerRef.current != null) {
        window.clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
      const next = wordIndexFromCharIndex(words, fromIndexRef.current, event.charIndex)
      setActive(next)
      activeRef.current = next
    }

    u.onend = () => {
      if (gen !== utteranceGenRef.current) return
      if (modeRef.current !== "boundary") return
      setActive(words.length - 1)
      activeRef.current = words.length - 1
      setPlaying(false)
      playingRef.current = false
      clearTimers()
    }

    u.onerror = () => {
      if (gen !== utteranceGenRef.current) return
      setPlaying(false)
      playingRef.current = false
      clearTimers()
    }

    window.speechSynthesis.speak(u)
    startKeepAlive()

    fallbackTimerRef.current = window.setTimeout(() => {
      if (gotBoundary || !playingRef.current || gen !== utteranceGenRef.current) return
      modeRef.current = "word"
      speakWordByWord(activeRef.current, rate)
    }, 650)
  }

  function speakWordByWord(startIndex: number, rate = speed.value) {
    if (!hasSpeech() || words.length === 0) return

    const from = Math.min(Math.max(0, startIndex), words.length - 1)
    modeRef.current = "word"
    stopSpeech()
    const gen = utteranceGenRef.current

    const speakOne = (index: number) => {
      if (gen !== utteranceGenRef.current || !playingRef.current) return
      if (index >= words.length) {
        setPlaying(false)
        playingRef.current = false
        return
      }

      setActive(index)
      activeRef.current = index

      const u = new SpeechSynthesisUtterance(words[index]!)
      applyVoice(u, rate)
      u.onend = () => {
        if (gen !== utteranceGenRef.current) return
        if (modeRef.current !== "word" || !playingRef.current) return
        speakOne(index + 1)
      }
      u.onerror = () => {
        if (gen !== utteranceGenRef.current) return
        setPlaying(false)
        playingRef.current = false
      }
      window.speechSynthesis.speak(u)
    }

    speakOne(from)
  }

  const speakToggle = () => {
    if (playing) {
      if (hasSpeech() && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause()
        if (window.speechSynthesis.paused) {
          setPlaying(false)
          playingRef.current = false
          clearTimers()
          return
        }
      }
      stopSpeech()
      setPlaying(false)
      playingRef.current = false
      return
    }

    setPlaying(true)
    playingRef.current = true
    // Jangan resume ucapan lama: `rate` tidak bisa diubah di tengah, jadi
    // selalu mulai ulang dari kata aktif dengan kecepatan yang dipilih.
    speakFrom(active)
  }

  const seekTo = (index: number) => {
    setActive(index)
    activeRef.current = index
    if (!playingRef.current) return
    playingRef.current = true
    setPlaying(true)
    speakFrom(index)
  }

  const handleSpeedChange = (idx: number) => {
    const option = TTS_SPEED_OPTIONS[idx]
    if (!option) return
    const nextRate = option.value
    setSpeedIdx(idx)
    saveSettingsEverywhere({ ...settingsRef.current, ttsSpeed: nextRate })
    if (playingRef.current) {
      speakFrom(activeRef.current, nextRate)
      return
    }
    // Kalau sedang jeda, buang ucapan yang ter-pause supaya Putar memakai rate baru.
    if (hasSpeech()) stopSpeech()
  }

  const progress = words.length === 0 ? 0 : Math.round(((active + 1) / words.length) * 100)

  const showPlayer = Boolean(material && words.length > 0)

  return (
    <>
      <div className={cx("space-y-6", showPlayer && "pb-40")}>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <IconWave className="text-brand" /> Multisensory Tracking
          </h1>
          <p className="text-sm text-ink-soft">
            Dengarkan narasi dan ikuti sorotan kata saat teks dibacakan.
          </p>
        </div>

        {loading ? (
          <Card>
            <p className="py-8 text-center text-sm text-ink-mute">Memuat materi dari akun…</p>
          </Card>
        ) : !showPlayer ? (
          <Card>
            <div className="flex flex-col items-center py-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                <IconBook width={22} height={22} />
              </span>
              <h2 className="mt-4 font-semibold text-ink">Belum ada materi untuk diikuti</h2>
              <p className="mt-1 max-w-md text-sm text-ink-soft">
                {error ?? "Buka materi dulu, lalu mulai Multisensory Tracking dari pemilih aktivitas."}
              </p>
              <Button className="mt-5" onClick={() => router.push(hrefFor("home"))}>
                Pilih Materi
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card variant="reading">
              <div className="mb-3 text-sm font-semibold opacity-70">
                {passage.label} · {title}
              </div>
              <div
                className="mb-4 flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label="Sumber bacaan"
              >
                {passage.options.map((option) => {
                  const selected = passage.source === option.value
                  const isGenerating = passage.generating === option.value
                  const busy = passage.generating !== null
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={busy && !isGenerating}
                      title={
                        option.disabled && !isGenerating
                          ? "Klik untuk membuat versi ini"
                          : undefined
                      }
                      onClick={() => {
                        if (busy) return
                        void passage.selectSource(option.value)
                      }}
                      className={cx(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        selected
                          ? "border-current bg-[color-mix(in_srgb,var(--reading-fg)_12%,transparent)]"
                          : "border-current/25 opacity-80 hover:opacity-100",
                        busy && !isGenerating && "cursor-not-allowed opacity-40 hover:opacity-40",
                      )}
                    >
                      {isGenerating ? `${option.label}…` : option.label}
                    </button>
                  )
                })}
              </div>
              {passage.generateError && (
                <p className="mb-4 text-sm text-error" role="alert">
                  {passage.generateError}
                </p>
              )}
              <p className="font-dyslexic max-w-3xl">
                {words.map((w, i) => (
                  <span
                    key={`${i}-${w}`}
                    ref={i === active ? activeWordRef : undefined}
                    onClick={() => seekTo(i)}
                    className={cx(
                      "scroll-mb-40 cursor-pointer rounded px-0.5 transition-colors",
                      i === active && "bg-brand font-bold text-[var(--color-brand-ink)]",
                      i < active && "opacity-45",
                    )}
                  >
                    {w}{" "}
                  </span>
                ))}
              </p>
            </Card>

            <p className="text-center text-sm text-ink-mute">
              Ketuk kata mana pun untuk memulai dari sana. Pilih Asli, Mudah, Terstruktur, atau Ringkasan bila sudah dibuat di Simplify.
            </p>
          </>
        )}
      </div>

      {showPlayer && (
        <div
          className="fixed bottom-0 right-0 z-20 border-t border-line/70 bg-[color-mix(in_srgb,var(--color-canvas)_92%,transparent)] backdrop-blur-md left-0 lg:left-[var(--shell-sidebar)] lg:transition-[left] lg:duration-300 lg:ease-out"
        >
          <div className="mx-auto max-w-5xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:px-8">
            <Card className="border-brand/20 p-3 shadow-[var(--shadow-md)] sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <Button
                  variant={playing ? "soft" : "primary"}
                  onClick={speakToggle}
                  className="w-full sm:w-32"
                >
                  {playing
                    ? <><IconPause width={16} height={16} /> Jeda</>
                    : <><IconPlay width={16} height={16} /> Putar</>}
                </Button>

                <label className="flex shrink-0 items-center gap-2 text-sm text-ink-soft">
                  <IconSpeaker width={16} height={16} className="text-brand" />
                  Kecepatan
                  <select
                    value={speedIdx}
                    onChange={(e) => handleSpeedChange(+e.target.value)}
                    className="rounded-lg border border-line bg-canvas px-2 py-1.5 text-sm text-ink"
                  >
                    {TTS_SPEED_OPTIONS.map((s, i) => (
                      <option key={s.value} value={i}>{s.label}</option>
                    ))}
                  </select>
                </label>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs text-ink-mute">
                    <span>Progress Pembacaan</span>
                    <span className="tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line-soft)]">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs tabular-nums text-ink-mute">
                    {active + 1} / {words.length} kata
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      <ScrollEdgeButton className={showPlayer ? "bottom-36" : undefined} />
    </>
  )
}
