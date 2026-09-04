"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sidebar } from "../../components/layout/Sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <main className="h-screen overflow-hidden bg-[#f8faff] text-slate-800">
      <div className="flex h-full">
        {/* Sidebar (statis di layar lebar, drawer di layar kecil) */}
        <Sidebar open={open} onClose={() => setOpen(false)} />

        {/* Latar gelap saat drawer terbuka (hanya layar kecil) */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 xl:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Tombol menu (hanya muncul di layar kecil) */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="m-4 grid h-11 w-11 place-items-center self-start rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {children}
        </section>
      </div>
    </main>
  )
}