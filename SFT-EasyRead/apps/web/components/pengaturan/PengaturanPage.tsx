"use client"

import { useState } from "react"
import { Card, SectionTitle } from "@/components/shared/ui"
import { IconSettings, IconBook, IconSpeaker, IconTextSize } from "@/components/shared/icons"
import SettingsToggle from "./SettingsToggle"
import {
  loadSettings,
  saveSettings,
  applyFontPreferences,
  type ReadingSettings,
  type UiFontId,
  type ReadingFontId,
} from "@/lib/session"

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings)

  function update<K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      applyFontPreferences(next)
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
          <SectionTitle icon={<IconBook width={18} height={18} />} title="Tampilan & Font" />

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Font Antarmuka (UI)</label>
              <select
                value={settings.uiFont}
                onChange={(e) => update("uiFont", e.target.value as UiFontId)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
              >
                <option value="lexend">Lexend (sekarang)</option>
                <option value="opendyslexic">OpenDyslexic</option>
              </select>
              <p className="mt-1.5 text-xs text-ink-mute">
                Dipakai di menu, tombol, sidebar, dan label.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Font Teks Bacaan</label>
              <select
                value={settings.readingFont}
                onChange={(e) => update("readingFont", e.target.value as ReadingFontId)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
              >
                <option value="atkinson">Atkinson Hyperlegible (sekarang)</option>
                <option value="opendyslexic">OpenDyslexic</option>
              </select>
              <p className="mt-1.5 text-xs text-ink-mute">
                Dipakai di area bacaan, simplify, latihan kata, dan mode ramah disleksia.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-line border-t border-line">
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
            <div className="mt-3 grid gap-2">
              <p className="text-xs font-medium text-ink-mute">Pratinjau UI</p>
              <p
                className="rounded-lg bg-canvas p-3 text-ink font-sans"
                style={{ fontSize: Math.max(14, settings.fontSize - 4) }}
              >
                Tombol · Menu · Label antarmuka
              </p>
              <p className="text-xs font-medium text-ink-mute">Pratinjau teks bacaan</p>
              <p
                className="rounded-lg bg-canvas p-3 text-ink font-dyslexic"
                style={{ fontSize: settings.fontSize }}
              >
                Contoh teks bacaan dengan font ramah disleksia.
              </p>
            </div>
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
