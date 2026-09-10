"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@repo/db/client"
import { hrefFor, screenFromPath } from "@/lib/nav"
import { fetchUserDocuments, updateUserDocumentTitle, deleteUserDocument } from "@/lib/documents"
import {
  getSessionMaterials,
  updateSessionMaterialTitle,
  removeSessionMaterial,
  type ReadingHistory,
} from "@/lib/mock"
import { getActiveMaterial, setActiveMaterial } from "@/lib/session"
import { Button, cx } from "@/components/shared/ui"

/** Nama sementara sebelum sesi Supabase terbaca (atau saat belum login). */
const GUEST_NAME = "Pengguna"
import {
  IconPlus,
  IconClose,
  IconBook,
  IconSidebar,
  IconChevron,
  IconSettings,
  IconMoreVertical,
  IconEdit,
  IconTrash,
} from "@/components/shared/icons"
import Logo from "./Logo"

type Props = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const active = screenFromPath(pathname)
  const selectedId = pathname.startsWith("/material/")
    ? pathname.slice("/material/".length)
    : null
  const [materials, setMaterials] = useState<ReadingHistory[]>([])
  const [displayName, setDisplayName] = useState(GUEST_NAME)
  const [materialsLoaded, setMaterialsLoaded] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [pendingEdit, setPendingEdit] = useState<ReadingHistory | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [savingTitle, setSavingTitle] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ReadingHistory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let active = true

    fetchUserDocuments()
      .then((result) => {
        if (!active) return
        if ("unauthorized" in result) {
          // Jangan tampilkan materi mock palsu — hanya yang ada di session lokal
          setMaterials(getSessionMaterials())
          setMaterialsLoaded(true)
          return
        }
        if ("error" in result) {
          setMaterials(getSessionMaterials())
          setMaterialsLoaded(true)
          return
        }
        setMaterials(result.documents.map((document) => ({
          id: document.id,
          title: document.title ?? "Tanpa judul",
          meta: "Tersimpan di akun",
          progress: 0,
          pages: 0,
        })))
        setMaterialsLoaded(true)
      })
      .catch(() => {
        if (!active) return
        setMaterials(getSessionMaterials())
        setMaterialsLoaded(true)
      })

    return () => {
      active = false
    }
  }, [pathname])

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        const authUser = data.user
        if (!authUser) return
        setDisplayName(
          authUser.user_metadata?.full_name ??
          authUser.email?.split("@")[0] ??
          GUEST_NAME,
        )
      })
    } catch {
      setDisplayName(GUEST_NAME)
    }
  }, [])

  useEffect(() => {
    if (!menuId) return
    function handlePointer(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuId(null)
      }
    }
    document.addEventListener("mousedown", handlePointer)
    return () => document.removeEventListener("mousedown", handlePointer)
  }, [menuId])

  useEffect(() => {
    if (!pendingEdit && !pendingDelete) return
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      if (savingTitle || deleting) return
      setPendingEdit(null)
      setPendingDelete(null)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [pendingEdit, pendingDelete, savingTitle, deleting])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    const id = pendingDelete.id
    const result = await deleteUserDocument(id)
    removeSessionMaterial(id)
    setMaterials((prev) => prev.filter((item) => item.id !== id))
    setPendingDelete(null)
    setMenuId(null)
    setDeleting(false)
    if ("unauthorized" in result) {
      router.push("/login")
      return
    }
    if (selectedId === id) {
      router.push(hrefFor("home"))
    }
  }

  function applyTitleUpdate(id: string, title: string) {
    setMaterials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item)),
    )
    updateSessionMaterialTitle(id, title)
    const existing = getActiveMaterial()
    if (existing && existing.id === id) {
      setActiveMaterial({ ...existing, title })
    }
    window.dispatchEvent(
      new CustomEvent("easyread:material-renamed", { detail: { id, title } }),
    )
  }

  async function confirmRename() {
    if (!pendingEdit) return
    const title = editTitle.trim()
    if (!title || title === pendingEdit.title.trim()) return
    setSavingTitle(true)
    const id = pendingEdit.id
    const result = await updateUserDocumentTitle(id, title)
    applyTitleUpdate(id, title)
    setPendingEdit(null)
    setMenuId(null)
    setSavingTitle(false)
    if ("unauthorized" in result) {
      router.push("/login")
      return
    }
    if (selectedId === id) {
      router.refresh()
    }
  }

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
              "bg-brand text-[var(--color-brand-ink)] shadow-[var(--shadow-brand)] hover:bg-brand-strong",
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
            {!materialsLoaded && (
              <li className="px-3 py-2 text-xs text-ink-mute">Memuat materi…</li>
            )}
            {materialsLoaded && materials.length === 0 && (
              <li className="px-3 py-2 text-xs text-ink-mute">
                Belum ada materi. Buat dari tombol Materi Baru.
              </li>
            )}
            {materials.map((material) => {
              const isActive = selectedId === material.id
              const menuOpen = menuId === material.id
              return (
                <li key={material.id} className="relative">
                  <div
                    className={cx(
                      "group flex w-full items-center rounded-xl transition-colors duration-100",
                      isActive
                        ? "bg-surface text-brand-strong outline outline-2 outline-brand -outline-offset-2"
                        : "text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink",
                    )}
                  >
                    <Link
                      href={hrefFor("material", material.id)}
                      onClick={onClose}
                      aria-current={isActive ? "page" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
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
                    <div className="relative shrink-0 pr-1" ref={menuOpen ? menuRef : undefined}>
                      <button
                        type="button"
                        aria-label={`Menu ${material.title}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setMenuId(menuOpen ? null : material.id)
                        }}
                        className={cx(
                          "grid h-8 w-8 place-items-center rounded-lg text-ink-mute hover:bg-[var(--color-line-soft)] hover:text-ink",
                          menuOpen
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                        )}
                      >
                        <IconMoreVertical width={16} height={16} />
                      </button>
                      {menuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 top-9 z-50 min-w-36 rounded-xl border border-line bg-surface-raised py-1 shadow-[var(--shadow-md)]"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              setMenuId(null)
                              setPendingEdit(material)
                              setEditTitle(material.title)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-ink hover:bg-[var(--color-line-soft)]"
                          >
                            <IconEdit width={14} height={14} />
                            Edit judul
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              setMenuId(null)
                              setPendingDelete(material)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-error hover:bg-[var(--color-error-softer)]"
                          >
                            <IconTrash width={14} height={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mx-3 mb-3 space-y-2 border-t border-line pt-3">
          <Link
            href={hrefFor("settings")}
            onClick={onClose}
            aria-current={active === "settings" ? "page" : undefined}
            className={cx(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active === "settings"
                ? "bg-brand-soft text-brand-strong"
                : "text-ink-soft hover:bg-[var(--color-line-soft)] hover:text-ink",
            )}
          >
            <IconSettings width={16} height={16} aria-hidden className="shrink-0" />
            Pengaturan
          </Link>

          <Link
            href={hrefFor("settings")}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 hover:border-brand/40 transition-colors"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-[var(--color-brand-ink)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold text-ink">{displayName}</div>
            </div>
            <IconChevron width={14} height={14} className="shrink-0 text-ink-mute" />
          </Link>
        </div>
      </aside>

      {pendingDelete && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(36,48,63,0.45)] p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-material-title"
            className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-lg)]"
          >
            <h2 id="delete-material-title" className="text-base font-semibold text-ink">
              Kamu yakin ingin menghapus {pendingDelete.title}?
            </h2>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? "Menghapus…" : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {pendingEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(36,48,63,0.45)] p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-material-title"
            className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-lg)]"
            onSubmit={(event) => {
              event.preventDefault()
              void confirmRename()
            }}
          >
            <h2 id="edit-material-title" className="text-base font-semibold text-ink">
              Edit judul
            </h2>
            <input
              type="text"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              aria-label="Judul materi"
              autoFocus
              disabled={savingTitle}
              className="mt-3 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-mute outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={savingTitle}
                onClick={() => setPendingEdit(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  savingTitle ||
                  !editTitle.trim() ||
                  editTitle.trim() === pendingEdit.title.trim()
                }
              >
                {savingTitle ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
