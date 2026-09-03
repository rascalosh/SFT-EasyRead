"use client"

import { useState } from "react"
import { Card, SectionTitle } from "@/components/shared/ui"
import { IconSettings, IconBook, IconSpeaker, IconTextSize } from "@/components/shared/icons"
import SettingsToggle from "./SettingsToggle"
import { loadSettings, saveSettings, defaultSettings } from "@/lib/session"

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings)

  function update<K extends keyof typeof settings>(key: K, value: typeof settings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      return next
    })
  }

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
            <SettingsToggle
              on={settings.dyslexicFont}
              onToggle={() => update("dyslexicFont", !settings.dyslexicFont)}
              label="Font Ramah Disleksia"
              desc="Gunakan font khusus dengan bentuk huruf yang lebih mudah dibedakan."
            />
            <SettingsToggle
              on={true}
              onToggle={() => {}}
              label="Penggaris Fokus Digital"
              desc="Ketuk baris teks saat membaca untuk menyorot baris aktif."
            />
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <IconTextSize width={16} height={16} className="text-brand" /> Ukuran Teks Default · {settings.fontSize}px
            </label>
            <input
              type="range"
              min={16}
              max={30}
              value={settings.fontSize}
              onChange={(e) => update("fontSize", +e.target.value)}
              className="w-full accent-[var(--color-brand)]"
            />
            <p
              className="mt-3 rounded-lg bg-canvas p-3 text-ink"
              style={{ fontSize: settings.fontSize }}
            >
              <span className={settings.dyslexicFont ? "font-dyslexic" : ""}>Contoh teks bacaan.</span>
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<IconSpeaker width={18} height={18} />} title="Audio & Suara" />
          <div className="divide-y divide-line">
            <SettingsToggle
              on={settings.autoTts}
              onToggle={() => update("autoTts", !settings.autoTts)}
              label="Putar Text-to-Speech Otomatis"
              desc="Bacakan teks secara otomatis saat membuka bacaan baru."
            />
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <label className="mb-2 block text-sm font-semibold text-ink">Kecepatan Suara Default</label>
            <select
              value={settings.ttsSpeed}
              onChange={(e) => update("ttsSpeed", +e.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            >
              <option value={0.7}>Lambat (0.7x)</option>
              <option value={1.0}>Normal (1.0x)</option>
              <option value={1.3}>Cepat (1.3x)</option>
            </select>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <label className="mb-2 block text-sm font-semibold text-ink">Bahasa Bacaan</label>
            <select
              value={settings.language}
              onChange={(e) => update("language", e.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            >
              <option value="id-ID">Bahasa Indonesia</option>
              <option value="jv-ID" disabled>Bahasa Jawa (segera hadir)</option>
              <option value="su-ID" disabled>Bahasa Sunda (segera hadir)</option>
            </select>
          </div>
          <p className="mt-4 text-xs text-ink-mute">
            Pengaturan disimpan otomatis ke perangkat ini.
          </p>
        </Card>
      </div>
    </div>
  )
}
