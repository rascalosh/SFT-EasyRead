"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@repo/db/client"

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = Boolean(email.trim() && password.length >= 6 && password === confirm && !isSubmitting)

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsSubmitting(false)
        return
      }

      if (data.session) {
        router.push("/")
        router.refresh()
        return
      }

      setMessage("Pendaftaran berhasil. Cek email untuk verifikasi akun, lalu masuk.")
      setIsSubmitting(false)
    } catch {
      setError("Tidak bisa mendaftar. Periksa koneksi dan pengaturan Supabase.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-ink mb-2">Email</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
            className="w-full rounded-xl border border-line bg-surface-raised pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink-mute outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-[var(--color-brand)]/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-2">Password</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            autoComplete="new-password"
            className="w-full rounded-xl border border-line bg-surface-raised pl-10 pr-11 py-3 text-sm text-ink placeholder:text-ink-mute outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-[var(--color-brand)]/20"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink transition-colors"
            aria-label={showPass ? "Sembunyikan sandi" : "Tampilkan sandi"}
          >
            {showPass ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-2">Konfirmasi Password</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ulangi password"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className={[
              "w-full rounded-xl border bg-surface-raised pl-10 pr-11 py-3 text-sm text-ink placeholder:text-ink-mute outline-none transition-all duration-150 focus:ring-2",
              mismatch
                ? "border-error focus:border-error focus:ring-[var(--color-error)]/20"
                : "border-line focus:border-brand focus:ring-[var(--color-brand)]/20",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink transition-colors"
            aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
          >
            {showConfirm ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {mismatch && <p className="mt-1.5 text-xs text-error">Password tidak cocok.</p>}
      </div>

      {error && <p className="text-sm text-[var(--color-error)]" role="alert">{error}</p>}
      {message && <p className="text-sm text-[var(--color-good)]" role="status">{message}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={[
          "w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-150 mt-2",
          canSubmit
            ? "bg-brand text-[var(--color-brand-ink)] shadow-[var(--shadow-brand)] hover:bg-brand-strong"
            : "bg-[var(--color-disabled)] text-[var(--color-disabled-fg)] cursor-not-allowed",
        ].join(" ")}
      >
        {isSubmitting ? "Mendaftar…" : "Daftar"}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  )
}
