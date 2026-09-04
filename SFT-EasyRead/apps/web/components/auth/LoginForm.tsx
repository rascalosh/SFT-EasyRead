"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@repo/db/client"
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    router.push("/home")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-xl shadow-brand-500/10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <BookOpen className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <span className="text-xl font-bold text-ink">
            EasyRead <span className="text-brand-600">AI</span>
          </span>
        </div>

        {/* Judul */}
        <div>
          <h1 className="text-3xl font-bold text-ink">Masuk</h1>
          <p className="mt-1 text-ink-soft">Selamat datang kembali!</p>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft"
                strokeWidth={1.8}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-3 text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                required
              />
            </div>
          </div>

          {/* Kata Sandi */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft"
                strokeWidth={1.8}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-11 text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : "Masuk"}
          {!isSubmitting && <ArrowRight className="h-5 w-5" strokeWidth={2} />}
        </button>

        <p className="text-center text-sm text-ink-soft">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Daftar sekarang
          </Link>
        </p>
      </form>
    </main>
  )
}