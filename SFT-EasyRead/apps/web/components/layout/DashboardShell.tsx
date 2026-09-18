"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cx } from "@/components/shared/ui"
import { parentHref } from "@/lib/nav"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"

const DESKTOP_SIDEBAR = "(min-width: 1024px)"

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const showBack = pathname !== "/"

  useEffect(() => {
    if (window.matchMedia(DESKTOP_SIDEBAR).matches) {
      setSidebarOpen(true)
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia(DESKTOP_SIDEBAR).matches) return
    setSidebarOpen(false)
  }, [pathname])

  function goBack() {
    const queryId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("id")
        : null
    const pathId = pathname.match(/^\/material\/([^/]+)/)?.[1]
    router.push(parentHref(pathname, pathId ?? queryId))
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-canvas text-ink"
      style={{ ["--shell-sidebar" as string]: sidebarOpen ? "16rem" : "0px" }}
    >
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
              type="button"
              onClick={goBack}
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
