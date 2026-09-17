"use client"

import { usePathname } from "next/navigation"
import { screenFromPath, screenTitles } from "@/lib/nav"
import { IconSidebar } from "@/components/shared/icons"

type Props = {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function TopBar({ sidebarOpen, onToggleSidebar }: Props) {
  const pathname = usePathname()
  const title = screenTitles[screenFromPath(pathname)] ?? "EasyRead AI"

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--color-surface)_90%,transparent)] px-3 backdrop-blur">
      <button
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Tutup menu samping" : "Buka menu samping"}
        aria-pressed={sidebarOpen}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-[var(--color-line-soft)] hover:text-ink"
      >
        <IconSidebar width={18} height={18} />
      </button>

      <span className="min-w-0 truncate font-semibold text-ink" aria-current="page">
        {title}
      </span>
    </header>
  )
}
