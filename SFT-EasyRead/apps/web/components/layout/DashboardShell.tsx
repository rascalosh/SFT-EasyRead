"use client"

import { useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const showBack = pathname !== "/"

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Kembali
            </button>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
