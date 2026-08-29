import { Clipboard, FileText } from "lucide-react";

type SummaryCardProps = {
  summary: string[];
};

export function SummaryCard({
  summary,
}: SummaryCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
            <FileText className="h-4 w-4 text-blue-500" />
          </div>

          <h2 className="text-xs font-bold text-slate-700">
            Ringkasan Otomatis
          </h2>
        </div>

        <button className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[9px] font-semibold text-blue-600 transition hover:bg-blue-50">
          <Clipboard className="h-3.5 w-3.5" />
          Salin Ringkasan
        </button>
      </div>

      <div className="px-5 py-4">
        <ul className="space-y-2">
          {summary.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-[10px] leading-[1.6] text-slate-600"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />

              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}