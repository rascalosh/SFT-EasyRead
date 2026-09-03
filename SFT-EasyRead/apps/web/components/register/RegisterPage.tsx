"use client"

import { useRouter } from "next/navigation"
import { RegisterForm } from "./RegisterForm"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, var(--color-brand-soft) 0%, var(--color-brand-softer) 50%, var(--color-brand-soft) 100%)" }}
    >
      <div className="w-full max-w-md bg-surface-raised rounded-2xl shadow-[var(--shadow-xl)] px-8 py-10 animate-[fade-in_350ms_ease-out_both]">
        <div className="flex items-center gap-3 mb-8">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-[var(--color-brand-ink)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </span>
          <span className="text-xl font-bold text-ink">
            EasyRead <span className="text-brand">AI</span>
          </span>
        </div>

        <h1 className="text-heading-1 text-ink mb-1">Daftar</h1>
        <p className="text-body text-ink-soft mb-7">Buat akun baru untuk mulai membaca.</p>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-ink-soft">
          Sudah punya akun?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-semibold text-brand hover:text-brand-strong transition-colors"
          >
            Masuk
          </button>
        </p>
      </div>
    </div>
  )
}
