export default function Logo({
  compact = false,
  dark = false,
  markSize = 32,
}: {
  compact?: boolean
  dark?: boolean
  markSize?: number
}) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/brand/logo-mark.png"
        alt={compact ? "EasyRead AI" : ""}
        width={markSize}
        height={markSize}
        className="shrink-0 object-contain"
        draggable={false}
      />
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
