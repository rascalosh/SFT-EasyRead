"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Button, SectionTitle } from "@/components/shared/ui"
import { IconLetters, IconSpeaker, IconClose, IconPlay, IconTap } from "@/components/shared/icons"
import { demoTitle, syllableWords, type Syllable } from "@/lib/mock"
import { getActiveMaterial, loadSettings, defaultSettings, type ActiveMaterial } from "@/lib/session"

// Kamus fallback kata sulit
const builtinDict = new Map(syllableWords.map((s) => [s.word.toLowerCase(), s]))

/** Hasilkan entri suku kata sederhana dari kata yang tidak ada di kamus. */
function makeSyllable(word: string): Syllable {
  // Pecah suku kata naif: pasangan konsonan-vokal
  const vowels = new Set("aiueo")
  let breakdown = ""
  let syllable = ""
  for (const ch of word.toLowerCase()) {
    syllable += ch
    if (vowels.has(ch) && syllable.length >= 2) {
      breakdown += (breakdown ? " - " : "") + syllable
      syllable = ""
    }
  }
  if (syllable) breakdown += (breakdown ? " - " : "") + syllable
  return { word, breakdown: breakdown || word, meaning: "Lihat kamus untuk arti.", checkedAgo: "Baru saja" }
}

function tokenize(text: string) {
  return text.split(/(\s+)/).map((t) => ({ raw: t, key: t.toLowerCase().replace(/[^a-z]/g, "") }))
}

export default function SyllableBreaker() {
  const settingsRef = useRef(defaultSettings)
  const [material, setMaterial] = useState<ActiveMaterial | null>(null)
  const [selected, setSelected] = useState<Syllable | null>(syllableWords[0] ?? null)
  const [history, setHistory] = useState<Syllable[]>(syllableWords)

  useEffect(() => {
    settingsRef.current = loadSettings()
    setMaterial(getActiveMaterial())
  }, [])

  const title = material?.title ?? demoTitle
  const rawText =
    material?.originalText?.trim() ||
    material?.paragraphs?.join(" ") ||
    syllableWords.map((s) => s.word).join(" ")
  const tokens = tokenize(rawText)

  // Bangun kamus: gabung bawaan + semua kata dari teks aktif jika >4 huruf
  const dict = new Map(builtinDict)

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = settingsRef.current.language
    u.rate = 0.7
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  const selectWord = (entry: Syllable) => {
    setSelected(entry)
    // tambah ke history jika belum ada
    setHistory((prev) => {
      if (prev.some((s) => s.word === entry.word)) return prev
      return [{ ...entry, checkedAgo: "Baru saja" }, ...prev.slice(0, 19)]
    })
  }

  const handleWordClick = (key: string, raw: string) => {
    if (!key) return
    const entry = dict.get(key) ?? makeSyllable(raw.toLowerCase().replace(/[^a-z]/g, ""))
    selectWord(entry)
  }

  return (
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
          <Card className="bg-[var(--reading-bg)] text-[var(--reading-fg)]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-mute">
              <IconTap width={16} height={16} className="text-brand" /> {title} · semua kata bisa diketuk
            </div>
            <p className="font-dyslexic leading-relaxed">
              {tokens.map((t, i) =>
                /^\s+$/.test(t.raw) ? (
                  <span key={i}>{t.raw}</span>
                ) : t.key.length < 3 ? (
                  <span key={i}>{t.raw}</span>
                ) : (
                  <button
                    key={i}
                    onClick={() => handleWordClick(t.key, t.raw)}
                    className={
                      dict.has(t.key)
                        ? "mx-0.5 rounded bg-brand-soft px-1 font-semibold text-brand-strong underline decoration-brand/40 decoration-2 underline-offset-4 hover:bg-brand hover:text-[var(--color-brand-ink)]"
                        : "mx-0.5 rounded px-0.5 hover:bg-[var(--color-line-soft)] hover:text-ink transition-colors cursor-pointer"
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
            <Card className="border-brand">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">Kata Dipilih</span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-ink-mute hover:text-ink"
                  aria-label="Tutup"
                >
                  <IconClose width={16} height={16} />
                </button>
              </div>
              <div className="font-dyslexic text-xl font-bold text-ink">{selected.word}</div>

              <div className="mt-4">
                <div className="text-xs font-medium text-ink-mute">Pemecahan Suku Kata</div>
                <div className="mt-1 font-dyslexic text-lg font-semibold tracking-wide text-brand-strong">
                  {selected.breakdown}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium text-ink-mute">Cara Pengucapan</div>
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
                <div className="text-xs font-medium text-ink-mute">Arti Sederhana</div>
                <p className="mt-1 text-sm text-ink-soft">{selected.meaning}</p>
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle title="Riwayat Kata yang Diperiksa" />
            <ul className="divide-y divide-line">
              {history.slice(0, 10).map((s) => (
                <li key={s.word} className="flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => selectWord(s)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-dyslexic font-medium text-ink">{s.word}</span>
                    <span className="block text-xs text-ink-mute">{s.checkedAgo}</span>
                  </button>
                  <button
                    onClick={() => speak(s.word)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-brand hover:bg-brand-soft"
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
  )
}
