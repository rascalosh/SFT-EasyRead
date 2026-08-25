'use client'

import {
  BarChart3,
  BookOpen,
  BookOpenText,
  CircleHelp,
  Home,
  ListChecks,
  LucideIcon,
  Mic,
  Settings,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string, 
  icon: LucideIcon,
  href: string
}

const navItems: NavItem[] = [
  {
    label: "Beranda",
    icon: Home,
    href: "/home"
  },
  {
    label: "Baca Teks",
    icon: BookOpenText,
    href: "/read"
  },
  {
    label: "Simplify & Ringkasan",
    icon: ListChecks,
    href: "/simplify"
  },
  {
    label: "Reading Comprehension",
    icon: CircleHelp,
    href: "/comprehension"
  },
  {
    label: "Latihan Kata",
    icon: Target,
    href: "/latihan"
  },
  {
    label: "Penilaian Membaca (Suara)",
    icon: Mic,
    href: "/penilaian"
  },
  {
    label: "Progress & Achievement",
    icon: BarChart3,
    href: "/achievement"
  },
  {
    label: "Pengaturan",
    icon: Settings,
    href: "/pengaturan"
  },
  {
    label: "Bantuan",
    icon: CircleHelp,
    href: "/bantuan"
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[172px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white xl:flex xl:flex-col">
      {/* Logo */}
      <div className="flex h-[100px] items-center justify-center border-b border-slate-100">
        <div className="flex flex-col items-center">
          <div className="relative mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BookOpen className="h-7 w-7" strokeWidth={1.8} />

            <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-blue-500" />
          </div>

          <span className="text-[15px] font-bold tracking-tight text-slate-800">
            EasyRead<span className="text-blue-600">AI</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link 
                key={item.label}
                href={item.href}
                className={[
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] font-medium transition",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-[16px] w-[16px] shrink-0",
                    isActive
                      ? "text-blue-600"
                      : "text-slate-500 group-hover:text-slate-700",
                  ].join(" ")}
                  strokeWidth={1.8}
                />

                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Illustration */}
      <div className="relative h-[185px] overflow-hidden">
        <div className="absolute -bottom-12 -left-5 h-32 w-40 rotate-[-12deg] rounded-[50%] bg-blue-50" />

        <div className="absolute bottom-4 left-8 h-14 w-20 rotate-[-20deg] rounded-[8px] border-4 border-blue-500 bg-white shadow-sm">
          <div className="absolute left-1/2 top-1/2 h-9 w-px -translate-x-1/2 -translate-y-1/2 bg-blue-200" />
        </div>

        <div className="absolute bottom-4 right-5">
          <div className="h-11 w-7 rounded-t-full rounded-br-full bg-emerald-200 opacity-80" />
          <div className="absolute -left-2 bottom-0 h-9 w-10 rounded-t-full bg-emerald-100" />
        </div>
      </div>

      {/* User */}
      <div className="mx-3 mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm">
          👨🏻‍💻
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-slate-800">
            Nerdcore
          </p>

          <p className="text-[9px] text-slate-500">Level 2</p>
        </div>
      </div>
    </aside>
  );
}