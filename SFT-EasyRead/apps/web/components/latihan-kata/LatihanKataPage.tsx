"use client"

import { useState } from "react"
import { Card, Button, SectionTitle } from "@/components/shared/ui"
import { IconLetters, IconSpeaker, IconClose, IconPlay, IconTap } from "@/components/shared/icons"
import { demoTitle, demoParagraphs, syllableWords, type Syllable } from "@/lib/mock"

// Kata pada teks yang punya data suku kata bisa diklik.
const dict = new Map(syllableWords.map((s) => [s.word.toLowerCase(), s]))
const tokens = demoParagraphs.join(" ").split(" ")

export default function SyllableBreaker() {
  const [selected, setSelected] = useState<Syllable | null>(syllableWords[0] ?? null)

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = "id-ID"
      u.rate = 0.7
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <IconLetters className="text-brand" /> Syllable Breaker
        </h1>
        <p className="text-sm text-ink-soft">Ketuk kata yang sulit untuk melihat pemecahan suku kata, cara pengucapan, dan arti sederhananya.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-[var(--color-overlay-cream)]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-mute">
              <IconTap width={16} height={16} className="text-brand" /> {demoTitle} · kata bergaris bawah bisa diketuk
            </div>
            <p className="font-dyslexic">
              {tokens.map((w, i) => {
                const key = w.toLowerCase().replace(/[^a-z]/g, "")
                const entry = dict.get(key)
                return entry ? (
                  <button
                    key={i}
                    onClick={() => setSelected(entry)}
                    className="mx-0.5 rounded bg-brand-soft px-1 font-semibold text-brand-strong underline decoration-brand/40 decoration-2 underline-offset-4 hover:bg-brand hover:text-[var(--color-brand-ink)]"
                  >
                    {w}
                  </button>
                ) : (
                  <span key={i}>{w} </span>
                )
              })}
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Pop-up detail kata */}
          {selected && (
            <Card className="border-brand">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">Kata Sulit</span>
                <button onClick={() => setSelected(null)} className="text-ink-mute hover:text-ink" aria-label="Tutup"><IconClose width={16} height={16} /></button>
              </div>
              <div className="font-dyslexic text-xl font-bold text-ink">{selected.word}</div>

              <div className="mt-4">
                <div className="text-xs font-medium text-ink-mute">Pemecahan Suku Kata</div>
                <div className="mt-1 font-dyslexic text-lg font-semibold tracking-wide text-brand-strong">{selected.breakdown}</div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium text-ink-mute">Cara Pengucapan</div>
                <Button variant="soft" size="sm" className="mt-1" onClick={() => speak(selected.word)}>
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
              {syllableWords.map((s) => (
                <li key={s.word} className="flex items-center gap-3 py-2.5">
                  <button onClick={() => setSelected(s)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-dyslexic font-medium text-ink">{s.word}</span>
                    <span className="block text-xs text-ink-mute">{s.checkedAgo}</span>
                  </button>
                  <button onClick={() => speak(s.word)} className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-brand hover:bg-brand-soft" aria-label={`Dengarkan ${s.word}`}>
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
