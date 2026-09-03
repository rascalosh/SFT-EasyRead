"use client"

import { useState } from "react"
import { Card, SectionTitle } from "@/components/shared/ui"
import { IconSettings, IconBook, IconSpeaker, IconTextSize } from "@/components/shared/icons"
import SettingsToggle from "./SettingsToggle"

export default function Settings() {
  const [dyslexicFont, setDyslexicFont] = useState(true)
  const [autoTTS, setAutoTTS] = useState(false)
  const [ruler, setRuler] = useState(true)
  const [size, setSize] = useState(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <IconSettings className="text-brand" /> Pengaturan
        </h1>
        <p className="text-sm text-ink-soft">Sesuaikan pengalaman membaca agar paling nyaman untukmu.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={<IconBook width={18} height={18} />} title="Tampilan Membaca" />
          <div className="divide-y divide-line">
            <SettingsToggle on={dyslexicFont} onToggle={() => setDyslexicFont((v) => !v)} label="Font Ramah Disleksia" desc="Gunakan font khusus dengan bentuk huruf yang lebih mudah dibedakan." />
            <SettingsToggle on={ruler} onToggle={() => setRuler((v) => !v)} label="Penggaris Fokus Digital" desc="Sorot baris yang sedang dibaca agar tidak mudah lompat." />
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <IconTextSize width={16} height={16} className="text-brand" /> Ukuran Teks Default · {size}px
            </label>
            <input type="range" min={16} max={30} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--color-brand)]" />
            <p className="mt-3 rounded-lg bg-canvas p-3 text-ink" style={{ fontSize: size }}>
              <span className={dyslexicFont ? "font-dyslexic" : ""}>Contoh teks bacaan.</span>
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<IconSpeaker width={18} height={18} />} title="Audio & Suara" />
          <div className="divide-y divide-line">
            <SettingsToggle on={autoTTS} onToggle={() => setAutoTTS((v) => !v)} label="Putar Text-to-Speech Otomatis" desc="Bacakan teks secara otomatis saat membuka bacaan baru." />
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <label className="mb-2 block text-sm font-semibold text-ink">Kecepatan Suara Default</label>
            <select className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
              <option>Lambat (0.7x)</option>
              <option>Normal (1.0x)</option>
              <option>Cepat (1.3x)</option>
            </select>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <label className="mb-2 block text-sm font-semibold text-ink">Bahasa Bacaan</label>
            <select className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
              <option>Bahasa Indonesia</option>
              <option>Bahasa Jawa (segera hadir)</option>
              <option>Bahasa Sunda (segera hadir)</option>
            </select>
          </div>
        </Card>
      </div>
    </div>
  )
}
