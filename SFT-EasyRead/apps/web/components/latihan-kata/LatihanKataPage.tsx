"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Button, SectionTitle } from "@/components/shared/ui"
import { IconLetters, IconSpeaker, IconClose, IconPlay, IconTap } from "@/components/shared/icons"
import ScrollEdgeButton from "@/components/shared/ScrollEdgeButton"
import { demoTitle, syllableWords, type Syllable } from "@/lib/mock"
import { getActiveMaterial, loadSettings, defaultSettings, type ActiveMaterial } from "@/lib/session"
import { breakdownOf } from "@/lib/syllabify"
import { fetchSyllables, isOk } from "@/lib/api"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function SyllableBreakdown({ breakdown }: { breakdown: string }) {
  const parts = breakdown.split(/\s*-\s*/).filter(Boolean)
  return (
    <div
      className="mt-1 font-dyslexic font-bold"
      style={{
        fontSize: "calc(var(--reading-font-size) * 1.1)",
        wordSpacing: "normal",
      }}
    >
      {parts.map((part, i) => (
        <span key={`${i}-${part}`}>
          {i > 0 && (
            <span className="mx-0.5 inline-block" style={{ letterSpacing: 0 }} aria-hidden>
              -
            </span>
          )}
          {part}
        </span>
      ))}
    </div>
  )
}

/**
 * Pemecahan lokal memakai mesin aturan yang sama dengan server, jadi hasilnya
 * identik dan bisa tampil seketika tanpa menunggu jaringan. Panggilan API
 * menyusul hanya untuk melengkapi arti dari glossary.
 */
function localSyllable(word: string): Syllable {
  return {
    word,
    breakdown: breakdownOf(word),
    meaning: "Lihat kamus untuk arti.",
    checkedAgo: "Baru saja",
  }
}

function tokenize(text: string) {
  return text.split(/(\s+)/).map((t) => ({ raw: t, key: t.toLowerCase().replace(/[^a-z]/g, "") }))
}

export default function SyllableBreaker() {
  const settingsRef = useRef(defaultSettings)
  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<Syllable | null>(null)
  const [history, setHistory] = useState<Syllable[]>([])

  useEffect(() => {
    settingsRef.current = loadSettings()

    const active = getActiveMaterial()
    setMaterial(active)

    // Tanpa materi aktif, halaman tetap bisa dicoba memakai contoh bawaan.
    if (!active) {
      setSelected(syllableWords[0] ?? null)
      setHistory(syllableWords)
    }

    setReady(true)
  }, [])

  const title = material?.title ?? demoTitle
  const documentId = material?.id && UUID.test(material.id) ? material.id : null
  const rawText =
    material?.originalText?.trim() ||
    material?.paragraphs?.join(" ") ||
    syllableWords.map((s) => s.word).join(" ")
  const tokens = tokenize(rawText)

  // Kata yang sudah pernah diperiksa ditebalkan agar mudah ditemukan lagi.
  const checked = new Set(history.map((s) => s.word))

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = settingsRef.current.language
    u.rate = 0.7
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  const remember = (entry: Syllable) => {
    setHistory((prev) => {
      const rest = prev.filter((s) => s.word !== entry.word)
      return [{ ...entry, checkedAgo: "Baru saja" }, ...rest].slice(0, 20)
    })
  }

  const selectWord = (entry: Syllable) => {
    setSelected(entry)
    remember(entry)
  }

  const handleWordClick = async (key: string, raw: string) => {
    if (!key) return

    const word = raw.toLowerCase().replace(/[^a-z]/g, "")
    if (!word) return

    // Tampilkan hasil aturan lokal dulu supaya ketukan terasa instan.
    const optimistic = localSyllable(word)
    selectWord(optimistic)

    const result = await fetchSyllables([word], documentId)
    if (!isOk(result)) return

    const enriched = result.data.words[0]
    if (!enriched) return

    setSelected((current) => (current?.word === enriched.word ? enriched : current))
    setHistory((prev) => prev.map((s) => (s.word === enriched.word ? { ...enriched, checkedAgo: s.checkedAgo } : s)))
  }

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <IconLetters className="text-brand" /> Syllable Breaker
        </h1>
        <p className="text-sm text-ink-soft">
          Ketuk kata yang sulit untuk melihat pemecahan suku kata, cara pengucapan, dan arti sederhananya.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card variant="reading">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold opacity-70">
              <IconTap width={16} height={16} /> {title} · semua kata bisa diketuk
            </div>
            <p className="font-dyslexic">
              {tokens.map((t, i) =>
                /^\s+$/.test(t.raw) ? (
                  <span key={i}>{t.raw}</span>
                ) : t.key.length < 3 ? (
                  <span key={i}>{t.raw}</span>
                ) : (
                  <button
                    key={i}
                    onClick={() => void handleWordClick(t.key, t.raw)}
                    className={
                      checked.has(t.key)
                        ? "mx-0.5 rounded bg-[color-mix(in_srgb,var(--reading-fg)_14%,transparent)] px-1 font-bold hover:bg-brand hover:text-[var(--color-brand-ink)]"
                        : "mx-0.5 rounded px-0.5 font-medium hover:bg-[color-mix(in_srgb,var(--reading-fg)_10%,transparent)] transition-colors cursor-pointer"
                    }
                  >
                    {t.raw}
                  </button>
                )
              )}
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          {selected && (
            <Card variant="reading" className="border-brand">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide opacity-70">Kata Dipilih</span>
                <button
                  onClick={() => setSelected(null)}
                  className="opacity-60 hover:opacity-100"
                  aria-label="Tutup"
                >
                  <IconClose width={16} height={16} />
                </button>
              </div>
              <div className="font-dyslexic font-bold" style={{ fontSize: "calc(var(--reading-font-size) * 1.25)" }}>
                {selected.word}
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium opacity-70">Pemecahan Suku Kata</div>
                <SyllableBreakdown breakdown={selected.breakdown} />
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium opacity-70">Cara Pengucapan</div>
                <Button
                  variant="soft"
                  size="sm"
                  className="mt-1"
                  onClick={() => speak(selected.word)}
                >
                  <IconSpeaker width={15} height={15} /> Dengarkan
                </Button>
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium opacity-70">Arti Sederhana</div>
                <p className="mt-1 font-dyslexic text-sm opacity-80">{selected.meaning}</p>
              </div>
            </Card>
          )}

          <Card variant="reading">
            <SectionTitle title="Riwayat Kata yang Diperiksa" />
            {ready && history.length === 0 && (
              <p className="py-4 text-center text-sm opacity-60">
                Belum ada kata diperiksa. Ketuk kata di bacaan untuk memulai.
              </p>
            )}
            <ul className="divide-y divide-[color-mix(in_srgb,var(--reading-fg)_15%,transparent)]">
              {history.slice(0, 10).map((s) => (
                <li key={s.word} className="flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => selectWord(s)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-dyslexic font-bold">{s.word}</span>
                    <span className="block text-xs opacity-60">{s.checkedAgo}</span>
                  </button>
                  <button
                    onClick={() => speak(s.word)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--reading-fg)_10%,transparent)] hover:bg-brand hover:text-[var(--color-brand-ink)]"
                    aria-label={`Dengarkan ${s.word}`}
                  >
                    <IconPlay width={14} height={14} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
      <ScrollEdgeButton />
    </>
  )
}
