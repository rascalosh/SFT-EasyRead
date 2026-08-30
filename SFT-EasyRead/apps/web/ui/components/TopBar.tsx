"use client"

import { usePathname } from "next/navigation"
import { screenFromPath, screenTitles } from "../nav"
import { IconBell, IconSidebar } from "./icons"
import { cx } from "./ui"
import Logo from "./Logo"

type Props = {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function TopBar({ sidebarOpen, onToggleSidebar }: Props) {
  const pathname = usePathname()
  const title = screenTitles[screenFromPath(pathname)] ?? "EasyRead AI"

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-[color-mix(in_srgb,var(--color-surface)_90%,transparent)] px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Tutup menu samping" : "Buka menu samping"}
          aria-pressed={sidebarOpen}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink-soft transition-colors hover:border-brand/50 hover:text-ink"
        >
          <IconSidebar width={18} height={18} />
        </button>

        <div className={cx(sidebarOpen ? "lg:hidden" : "")}>
          <Logo compact />
        </div>

        <span className="hidden text-sm font-medium text-ink-soft lg:inline">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-canvas text-ink-soft hover:text-ink transition-colors"
          aria-label="Notifikasi"
        >
          <IconBell width={18} height={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" aria-hidden />
        </button>
      </div>
    </header>
  )
}
