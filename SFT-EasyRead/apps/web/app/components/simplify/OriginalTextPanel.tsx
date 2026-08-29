import { FileText } from "lucide-react";

type OriginalTextPanelProps = {
  text: string;
};

export function OriginalTextPanel({
  text,
}: OriginalTextPanelProps) {
  const wordCount = text.trim().split(/\s+/).length;

  return (
    <section className="flex min-h-[390px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
          <FileText className="h-4 w-4 text-blue-500" />
        </div>

        <h2 className="text-xs font-bold text-slate-700">
          Teks Asli
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-[10px] leading-[1.8] text-slate-600 sm:text-[11px]">
          {text}
        </p>
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5">
        <span className="text-[9px] text-slate-500">
          {wordCount} kata
        </span>
      </div>
    </section>
  );
}