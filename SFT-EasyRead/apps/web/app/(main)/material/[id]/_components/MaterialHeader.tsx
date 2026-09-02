import { IconBook } from "@/components/shared/icons"

export function MaterialHeader({
  title,
  paragraphs,
}: {
  title: string
  paragraphs: string[]
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <IconBook width={22} height={22} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-heading-2 text-ink">{title}</h1>
          <div className="reading-area mt-3 text-ink">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-ink">{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
