"use client"

import { useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import { RegisterForm } from "./RegisterForm"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, var(--color-brand-soft) 0%, var(--color-brand-softer) 50%, var(--color-brand-soft) 100%)" }}
    >
      <div className="w-full max-w-md bg-surface-raised rounded-2xl shadow-[var(--shadow-xl)] px-8 py-10 animate-[fade-in_350ms_ease-out_both]">
        <div className="mb-8">
          <Logo markSize={44} />
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
