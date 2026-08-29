"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@repo/db/client"

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
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
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                    <p className="mt-2 text-slate-600">Sign in to continue reading.</p>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                            required
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                            required
                        />
                    </label>
                </div>

                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </main>
    )
}