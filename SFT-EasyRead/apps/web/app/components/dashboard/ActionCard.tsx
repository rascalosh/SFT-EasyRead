type ActionCardProps = {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  description: string;
  button: React.ReactNode;
  buttonClass: string;
};

export function ActionCard({
  icon,
  iconBackground,
  title,
  description,
  button,
  buttonClass,
}: ActionCardProps) {
  return (
    <div className="flex min-h-[235px] flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div
        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${iconBackground}`}
      >
        {icon}
      </div>

      <h2 className="text-xs font-bold text-slate-700">{title}</h2>

      <p className="mt-2 max-w-[190px] text-[9px] leading-[1.55] text-slate-500">
        {description}
      </p>

      <button
        className={`mt-auto flex items-center gap-1.5 rounded-md px-4 py-2 text-[10px] font-semibold transition ${buttonClass}`}
      >
        {button}
      </button>
    </div>
  );
}