import Link from "next/link"
import { hrefFor, type ScreenId } from "@/lib/nav"
import { cx } from "@/components/shared/ui"
import { IconArrow } from "@/components/shared/icons"
import type { ReactNode } from "react"

export type ActivityTool = {
  id: ScreenId
  icon: ReactNode
  title: string
  subtitle: string
  body: string
  color: { bg: string; text: string; border: string }
}

export function ActivityCard({ tool }: { tool: ActivityTool }) {
  return (
    <Link
      href={hrefFor(tool.id)}
      className={cx(
        "group flex flex-col rounded-[var(--radius-card)] border bg-surface p-5 text-left",
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]",
        tool.color.border,
      )}
    >
      <span className={cx(
        "mb-4 grid h-13 w-13 place-items-center rounded-xl",
        tool.color.bg, tool.color.text,
      )}>
        {tool.icon}
      </span>
      <p className="text-[15px] font-semibold text-ink leading-snug">{tool.title}</p>
      <p className="mt-0.5 text-xs font-medium text-ink-mute">{tool.subtitle}</p>
      <p className="mt-2 flex-1 text-sm text-ink-soft leading-relaxed">{tool.body}</p>
      <span className={cx(
        "mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
        tool.color.text,
      )}>
        Mulai <IconArrow width={15} height={15} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  )
}
