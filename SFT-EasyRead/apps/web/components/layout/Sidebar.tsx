"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { hrefFor, screenFromPath } from "@/lib/nav"
import {
  listMaterials,
  readingHistory,
  user,
  type ReadingHistory,
} from "@/lib/mock"
import { cx } from "@/components/shared/ui"
import { IconPlus, IconClose, IconBook, IconSidebar, IconChevron } from "@/components/shared/icons"
import Logo from "./Logo"

type Props = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const active = screenFromPath(pathname)
  const selectedId = pathname.startsWith("/material/")
    ? pathname.slice("/material/".length)
    : null
  const [materials, setMaterials] = useState<ReadingHistory[]>(readingHistory)

  useEffect(() => {
    setMaterials(listMaterials())
  }, [pathname])

  return (
    <>
      {open && (
        <button
          aria-label="Tutup menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-[rgba(36,48,63,0.35)] lg:hidden"
        />
      )}

      <aside
        aria-label="Menu samping"
        className={cx(
          "z-40 flex w-64 shrink-0 flex-col",
          "border-r border-line bg-surface",
          "fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:h-screen",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:hidden",
        )}
      >
        <div className="flex items-center justify-between px-3 py-4">
          <Link
            href={hrefFor("home")}
            className="flex-1 rounded-lg px-2 py-1 text-left hover:bg-[var(--color-line-soft)] transition-colors"
          >
            <Logo />
          </Link>
          <button
            onClick={onClose}
            aria-label="Tutup sidebar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-[var(--color-line-soft)] hover:text-ink transition-colors lg:hidden"
          >
            <IconClose width={16} height={16} />
          </button>
          <button
            onClick={onClose}
            aria-label="Ciutkan sidebar"
            className="hidden lg:grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-[var(--color-line-soft)] hover:text-ink transition-colors"
          >
            <IconSidebar width={16} height={16} />
          </button>
        </div>

        <div className="px-3 pb-3">
          <Link
            href={hrefFor("home")}
            onClick={onClose}
            aria-current={active === "home" ? "page" : undefined}
            className={cx(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
              active === "home"
                ? "bg-brand text-[var(--color-brand-ink)] shadow-[var(--shadow-brand)]"
                : "bg-brand-soft text-brand-strong hover:bg-brand hover:text-[var(--color-brand-ink)]",
            )}
          >
            <IconPlus width={16} height={16} aria-hidden />
            Materi Baru
          </Link>
        </div>

        <div className="mx-3 mb-1 border-t border-line" />

        <div className="flex-1 overflow-y-auto px-3 py-1">
          <p className="px-2 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
            Materi Terbaru
          </p>
          <ul className="space-y-0.5">
            {materials.map((material) => {
              const isActive = selectedId === material.id
              return (
                <li key={material.id}>
                  <Link
                    href={hrefFor("material", material.id)}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cx(
                      "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors duration-100",
                      isActive
                        ? "bg-brand-soft text-brand-strong"
                        : "text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink",
                    )}
                  >
                    <span
                      className={cx(
                        "mt-px shrink-0",
                        isActive ? "text-brand" : "text-ink-mute group-hover:text-ink-soft",
                      )}
                    >
                      <IconBook width={15} height={15} aria-hidden />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-sm font-medium leading-tight">
                        {material.title}
                      </span>
                      <span className="block text-[11px] text-ink-mute mt-0.5">{material.meta}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <Link
          href={hrefFor("settings")}
          onClick={onClose}
          className="m-3 flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 hover:border-brand/40 transition-colors"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-[var(--color-brand-ink)]">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
          </div>
          <IconChevron width={14} height={14} className="shrink-0 text-ink-mute" />
        </Link>
      </aside>
    </>
  )
}
