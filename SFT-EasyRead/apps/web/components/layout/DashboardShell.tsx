"use client"

import { useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cx } from "@/components/shared/ui"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const showBack = pathname !== "/"

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas text-ink">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={cx(
          "min-h-screen min-w-0 pt-14 transition-[margin-left] duration-300 ease-out",
          sidebarOpen ? "lg:ml-64" : "ml-0",
        )}
      >
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
