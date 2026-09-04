"use client"

import { useEffect, useState } from "react"
import { Card, SectionTitle, cx } from "@/components/shared/ui"
import { IconSettings, IconBook, IconSpeaker, IconTextSize } from "@/components/shared/icons"
import SettingsToggle from "./SettingsToggle"
import {
  loadSettings,
  saveSettings,
  applyFontPreferences,
  wordSpacingFromLetter,
  getContrastOption,
  defaultSettings,
  UI_FONT_OPTIONS,
  READING_FONT_OPTIONS,
  READING_CONTRAST_OPTIONS,
  type ReadingSettings,
  type UiFontId,
  type ReadingFontId,
  type ReadingContrastId,
} from "@/lib/session"

export default function Settings() {
  // SSR + first client paint must match: never read localStorage in the initializer.
  const [settings, setSettings] = useState<ReadingSettings>(() => ({ ...defaultSettings }))
  const [ready, setReady] = useState(false)
  const contrast = getContrastOption(settings.contrastId)

  useEffect(() => {
    const loaded = loadSettings()
    setSettings({ ...loaded })
    applyFontPreferences(loaded)
    setReady(true)
  }, [])

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

          <div className={cx("space-y-4", !ready && "opacity-80")}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Kontras teks & latar bacaan
              </label>
              <p className="mb-2 text-xs text-ink-mute">
                Pilih kombinasi warna dengan kontras luminansi tinggi. Latar pastel + teks gelap.
              </p>
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Kombinasi warna teks dan latar bacaan"
              >
                {READING_CONTRAST_OPTIONS.map((option) => {
                  const selected = settings.contrastId === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update("contrastId", option.id as ReadingContrastId)}
                      className={cx(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                        selected
                          ? "border-brand outline outline-2 outline-brand -outline-offset-2"
                          : "border-line hover:border-brand/40",
                      )}
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-sm font-bold"
                        style={{ backgroundColor: option.background, color: option.text }}
                        aria-hidden
                      >
                        Aa
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {option.label}
                        </span>
                        <span
                          className="mt-0.5 block truncate rounded px-1.5 py-0.5 text-[11px]"
                          style={{ backgroundColor: option.background, color: option.text }}
                        >
                          Contoh teks bacaan
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <label className="mb-2 block text-sm font-semibold text-ink">Font Antarmuka (UI)</label>
              <select
                value={settings.uiFont}
                onChange={(e) => update("uiFont", e.target.value as UiFontId)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
              >
                {UI_FONT_OPTIONS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
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
                {READING_FONT_OPTIONS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
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

            <label className="mb-2 mt-4 block text-sm font-semibold text-ink">
              Jarak Huruf Default · {settings.letterSpacing.toFixed(2)}em
            </label>
            <input
              type="range"
              min={0.05}
              max={0.35}
              step={0.01}
              value={settings.letterSpacing}
              onChange={(e) => update("letterSpacing", +e.target.value)}
              className="w-full accent-[var(--color-brand)]"
            />
            <p className="mt-1.5 text-xs text-ink-mute">
              Target sekitar 0.12em (~35% lebar huruf). Jarak kata otomatis{" "}
              {wordSpacingFromLetter(settings.letterSpacing).toFixed(2)}em (3.5× jarak huruf).
            </p>

            <div className="mt-3 grid gap-2">
              <p className="text-xs font-medium text-ink-mute">Pratinjau teks bacaan</p>
              <p
                className="reading-area !mt-0 !max-w-none"
                style={{
                  fontSize: settings.fontSize,
                  letterSpacing: `${settings.letterSpacing}em`,
                  wordSpacing: `${wordSpacingFromLetter(settings.letterSpacing)}em`,
                  backgroundColor: contrast.background,
                  color: contrast.text,
                }}
              >
                Contoh teks bacaan dengan jarak huruf dan kata yang nyaman. Hindari huruf kapital beruntun;
                penekanan pakai <strong>tebal</strong>, bukan miring.
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
