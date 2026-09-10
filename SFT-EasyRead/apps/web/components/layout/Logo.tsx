export default function Logo({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand text-[var(--color-brand-ink)] shadow-sm">
        <span className="text-[14px] font-bold leading-none">Aa</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className={`text-[15px] font-bold ${dark ? "text-[#c8d5e0]" : "text-ink"}`}>
            EasyRead<span className="text-brand"> AI</span>
          </div>
          <div className={`text-[10px] ${dark ? "text-[#4d6478]" : "text-ink-mute"}`}>Membaca Jadi Lebih Mudah</div>
        </div>
      )}
    </div>
  )
}
