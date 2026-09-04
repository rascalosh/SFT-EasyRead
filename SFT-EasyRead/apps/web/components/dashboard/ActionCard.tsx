type ActionCardProps = {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  description: string;
  button: React.ReactNode;
  buttonClass: string;
  onClick?: () => void;
};

export function ActionCard({
  icon,
  iconBackground,
  title,
  description,
  button,
  buttonClass,
  onClick,
}: ActionCardProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ${iconBackground}`}>
        {icon}
      </div>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-ink-soft">
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        className={`mt-6 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ${buttonClass}`}
      >
        {button}
      </button>
    </div>
  );
}