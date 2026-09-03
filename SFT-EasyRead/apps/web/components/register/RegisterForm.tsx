"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@repo/db/client"

export function RegisterForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setMessage(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setIsSubmitting(true)

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
            router.push("/login")
            router.refresh()
            return
        }

        setMessage("Registration successful. Check your email to verify your account.")
        setIsSubmitting(false)
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
                    <p className="mt-2 text-slate-600">Register to start reading.</p>
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
                            minLength={6}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                            required
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Confirm password
                        <input
                            type="password"
                            minLength={6}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                            required
                        />
                    </label>
                </div>

                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                {message && <p className="text-sm text-green-700" role="status">{message}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Creating account..." : "Create account"}
                </button>
            </form>
        </main>
    )
}