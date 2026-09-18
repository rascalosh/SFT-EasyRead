"use client"

import { useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import { LoginForm } from "./LoginForm"

export default function LoginPage() {
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

        <h1 className="text-heading-1 text-ink mb-1">Masuk</h1>
        <p className="text-body text-ink-soft mb-7">Selamat datang kembali!</p>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-ink-soft">
          Belum punya akun?{" "}
          <button
            onClick={() => router.push("/register")}
            className="font-semibold text-brand hover:text-brand-strong transition-colors"
          >
            Daftar sekarang
          </button>
        </p>
      </div>
    </div>
  )
}
