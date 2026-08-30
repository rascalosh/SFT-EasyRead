import { FileText } from "lucide-react";

type OriginalTextPanelProps = {
  text: string;
  onChange: (value: string) => void;
};

export function OriginalTextPanel({
  text,
  onChange,
}: OriginalTextPanelProps) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <section className="flex min-h-[390px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
            <FileText className="h-4 w-4 text-blue-500" />
          </div>

          <h2 className="text-xs font-bold text-slate-700">Teks Asli</h2>
        </div>

        <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
          {wordCount} kata
        </span>
      </div>

      <div className="flex-1 px-4 py-4">
        <textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste atau ketik teks yang ingin disederhanakan..."
          className="h-full min-h-[290px] w-full resize-none border-0 bg-transparent text-[11px] leading-[1.8] text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>
    </section>
  );
}