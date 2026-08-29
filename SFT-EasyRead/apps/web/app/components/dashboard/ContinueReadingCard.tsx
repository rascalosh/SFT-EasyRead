import { BookOpen, FileText, Play } from "lucide-react";

export function ContinueReadingCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-blue-600" />

        <h2 className="text-xs font-bold text-slate-700">
          Lanjutkan Membaca
        </h2>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-slate-700">
              Perjuangan Bangsa Indonesia
            </p>

            <p className="mt-1 text-[9px] text-slate-500">
              Terakhir dibaca: 2 menit lalu
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[9px] text-slate-500">
            <span>Progress</span>
            <span>60%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[60%] rounded-full bg-blue-500" />
          </div>
        </div>

        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2 text-[10px] font-semibold text-white hover:bg-blue-700">
          <Play className="h-3 w-3 fill-current" />
          Lanjutkan Membaca
        </button>
      </div>
    </div>
  );
}