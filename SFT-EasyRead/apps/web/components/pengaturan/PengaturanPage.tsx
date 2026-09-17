"use client"

import { useEffect, useState } from "react"
import { Card, SectionTitle, SegmentedControl, cx } from "@/components/shared/ui"
import { IconSettings, IconBook, IconSpeaker, IconTextSize, IconSparkle, IconMic } from "@/components/shared/icons"
import SettingsToggle from "./SettingsToggle"
import { FocusRulerSentences } from "@/components/shared/FocusRulerSentences"
import {
  loadSettings,
  saveSettingsEverywhere,
  syncSettingsFromServer,
  applyFontPreferences,
  wordSpacingFromLetter,
  getContrastOption,
  defaultSettings,
  UI_FONT_OPTIONS,
  READING_FONT_OPTIONS,
  READING_CONTRAST_OPTIONS,
  TTS_SPEED_OPTIONS,
  SIMPLIFY_STYLE_OPTIONS,
  ASSESSMENT_VIEW_OPTIONS,
  FOCUS_RULER_COLOR_OPTIONS,
  type ReadingSettings,
  type UiFontId,
  type ReadingFontId,
  type ReadingContrastId,
  type FocusRulerColorId,
} from "@/lib/session"

export default function Settings() {
  // SSR + first client paint must match: never read localStorage in the initializer.
  const [settings, setSettings] = useState<ReadingSettings>(() => ({ ...defaultSettings }))
  const [ready, setReady] = useState(false)
  const contrast = getContrastOption(settings.contrastId)

  useEffect(() => {
    // Render dulu dari perangkat supaya tidak berkedip, lalu timpa dengan
    // setelan milik akun begitu tiba (kalau pengguna sudah login).
    const loaded = loadSettings()
    setSettings({ ...loaded })
    applyFontPreferences(loaded)
    setReady(true)

    let active = true
    void syncSettingsFromServer().then((fromAccount) => {
      if (active && fromAccount) setSettings({ ...fromAccount })
    })

    return () => {
      active = false
    }
  }, [])

  function update<K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      saveSettingsEverywhere(next)
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
                Pilih kombinasi warna dengan kontras luminansi tinggi. Ada juga warna halaman web biasa: abu terang dan teks hitam.
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
              on={settings.focusRuler}
              onToggle={() => update("focusRuler", !settings.focusRuler)}
              label="Penggaris Fokus Digital"
              desc="Ketuk teks, atau panah atas/bawah, untuk menyorot. Pilih satu kalimat (sampai titik) atau satu baris saja."
            />
            {settings.focusRuler && (
              <div className="py-3">
                <p className="mb-2 text-sm font-semibold text-ink">Cara menyorot</p>
                <SegmentedControl
                  fullWidth
                  value={settings.focusRulerMode}
                  onChange={(mode) => update("focusRulerMode", mode)}
                  options={[
                    { value: "sentence", label: "Per kalimat" },
                    { value: "line", label: "Satu baris" },
                  ]}
                />
                <p className="mt-1.5 text-xs text-ink-mute">
                  {settings.focusRulerMode === "line"
                    ? "Hanya baris yang diketuk atau dipilih panah yang disorot, meski kalimatnya panjang."
                    : "Sorotan mengikuti kalimat sampai tanda titik. Geser dengan panah atas/bawah."}
                </p>

                <p className="mb-2 mt-4 text-sm font-semibold text-ink">Warna penggaris</p>
                <div
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
                  role="radiogroup"
                  aria-label="Warna penggaris fokus"
                >
                  {FOCUS_RULER_COLOR_OPTIONS.map((option) => {
                    const selected = settings.focusRulerColor === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update("focusRulerColor", option.id as FocusRulerColorId)}
                        className={cx(
                          "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                          selected
                            ? "border-brand outline outline-2 outline-brand -outline-offset-2"
                            : "border-line hover:border-brand/40",
                        )}
                      >
                        <span
                          className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-line"
                          style={{ backgroundColor: option.color }}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{option.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-ink-mute">
                            {option.desc}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                <label className="mb-2 mt-4 block text-sm font-semibold text-ink">
                  Kekentalan warna · {Math.round(settings.focusRulerOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={settings.focusRulerOpacity}
                  onChange={(e) => update("focusRulerOpacity", +e.target.value)}
                  className="w-full accent-[var(--color-brand)]"
                />
                <p className="mt-1.5 text-xs text-ink-mute">
                  Semakin kental, semakin jelas sorotannya. Turunkan jika teks terasa tertutup warna.
                </p>

                <p className="mt-3 text-xs font-medium text-ink-mute">Pratinjau penggaris</p>
                <div className="reading-area !mt-1 !max-w-none rounded-lg border border-line px-3 py-2">
                  <FocusRulerSentences
                    enabled
                    preview
                    mode={settings.focusRulerMode}
                    layoutKey={`${settings.focusRulerMode}-${settings.fontSize}-${settings.letterSpacing}-${settings.readingFont}-${settings.contrastId}-${settings.focusRulerColor}-${settings.focusRulerOpacity}`}
                    blocks={[
                      "Kalimat pertama disorot sampai titik, termasuk jika teksnya panjang dan turun ke baris berikutnya. Kalimat kedua tetap biasa dan tidak ikut disorot.",
                    ]}
                    className="!max-w-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-mute">
                  {settings.focusRulerMode === "line"
                    ? "Hanya satu baris yang disorot. Ketuk baris lain, atau panah atas/bawah."
                    : "Seluruh kalimat sampai titik disorot. Ketuk kalimat lain, atau panah atas/bawah."}
                </p>
              </div>
            )}
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
              {TTS_SPEED_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
            Pengaturan ini dipakai di semua halaman bacaan, Simplify, Syllable Breaker, Reading Assessment, dan Multisensory Tracking. Disimpan otomatis ke perangkat ini dan ke akunmu.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle icon={<IconSparkle width={18} height={18} />} title="Bentuk bacaan mudah" />
          <p className="mb-3 text-xs text-ink-mute">
            Pilih bentuk bacaan lengkap di halaman Simplify. Ini bukan inti singkat.
            Hasil tiap versi disimpan terpisah, jadi berganti versi tidak menghapus hasil yang sudah ada.
          </p>
          <div
            className="grid gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Bentuk bacaan mudah"
          >
            {SIMPLIFY_STYLE_OPTIONS.map((option) => {
              const selected = settings.simplifyStyle === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("simplifyStyle", option.id)}
                  className={cx(
                    "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    selected
                      ? "border-brand bg-brand-soft/60 outline outline-2 outline-brand -outline-offset-2"
                      : "border-line hover:border-brand/40",
                  )}
                >
                  <span
                    className={cx(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                      selected ? "border-brand" : "border-line",
                    )}
                    aria-hidden
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{option.desc}</span>
                    <span className="mt-2 block" aria-hidden>
                      {option.id === "plain" ? <PlainPreview /> : <StructuredPreview />}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle icon={<IconMic width={18} height={18} />} title="Reading Assessment" />
          <p className="mb-3 text-xs text-ink-mute">
            Pilih bagian yang tampil di halaman Reading Assessment.
          </p>
          <div
            className="grid gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Bagian Reading Assessment"
          >
            {ASSESSMENT_VIEW_OPTIONS.map((option) => {
              const selected = settings.assessmentView === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("assessmentView", option.id)}
                  className={cx(
                    "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    selected
                      ? "border-brand bg-brand-soft/60 outline outline-2 outline-brand -outline-offset-2"
                      : "border-line hover:border-brand/40",
                  )}
                >
                  <span
                    className={cx(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                      selected ? "border-brand" : "border-line",
                    )}
                    aria-hidden
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{option.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

/** Sketsa kecil bentuk hasil versi 1: beberapa paragraf pendek. */
function PlainPreview() {
  return (
    <span className="flex flex-col gap-1.5 rounded-lg border border-line bg-canvas p-2.5">
      <span className="h-1.5 w-11/12 rounded bg-ink/25" />
      <span className="h-1.5 w-4/5 rounded bg-ink/25" />
      <span className="mt-1 h-1.5 w-10/12 rounded bg-ink/25" />
      <span className="h-1.5 w-3/5 rounded bg-ink/25" />
    </span>
  )
}

/** Sketsa kecil bentuk hasil versi 2: inti, judul, poin, tabel, catatan. */
function StructuredPreview() {
  return (
    <span className="flex flex-col gap-1.5 rounded-lg border border-line bg-canvas p-2.5">
      <span className="h-1.5 w-11/12 rounded bg-ink/40" />
      <span className="mt-1 h-2 w-2/5 rounded bg-ink/60" />
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-ink/40" />
        <span className="h-1.5 w-3/5 rounded bg-ink/25" />
        <span className="h-1.5 w-1/6 rounded bg-brand/60" />
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-ink/40" />
        <span className="h-1.5 w-1/2 rounded bg-ink/25" />
      </span>
      <span className="mt-1 grid grid-cols-3 gap-px overflow-hidden rounded border border-line">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={cx("h-2.5", i < 3 ? "bg-ink/15" : "bg-canvas")} />
        ))}
      </span>
      <span className="mt-1 h-3 w-full rounded border-l-2 border-brand bg-brand-soft/70" />
    </span>
  )
}
