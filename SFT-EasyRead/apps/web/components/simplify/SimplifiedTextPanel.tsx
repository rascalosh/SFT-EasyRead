import { Sparkles } from "lucide-react";

type SimplifiedTextPanelProps = {
  text: string;
  difficulty: "Mudah" | "Sedang" | "Sulit";
};

const difficultyStyles = {
  Mudah: "bg-emerald-50 text-emerald-700",
  Sedang: "bg-blue-50 text-blue-700",
  Sulit: "bg-amber-50 text-amber-700",
} as const;

export function SimplifiedTextPanel({
  text,
  difficulty,
}: SimplifiedTextPanelProps) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <section className="flex min-h-[390px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>

          <h2 className="text-xs font-bold text-slate-700">Versi Sederhana</h2>
        </div>

        <span className={`rounded-full px-2 py-1 text-[9px] font-medium ${difficultyStyles[difficulty]}`}>
          {difficulty}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-[11px] leading-[1.9] text-slate-600">
          {text || "Hasil simplifikasi akan muncul di sini..."}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <span className="text-[9px] text-slate-500">{wordCount || 0} kata</span>
        <span className="text-[9px] font-medium text-slate-600">Tingkat baca: {difficulty}</span>
      </div>
    </section>
  );
}