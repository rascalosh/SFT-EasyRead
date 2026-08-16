import {
  ChevronRight,
  FileText,
  History,
  MoreVertical,
  Play,
} from "lucide-react";

const recentBooks = [
  {
    title: "Perjuangan Bangsa Indonesia",
    lastRead: "2 menit lalu",
    pages: "12 halaman",
    progress: 60,
    iconClass: "bg-blue-50 text-blue-500",
  },
  {
    title: "Manfaat Membaca Setiap Hari",
    lastRead: "8 menit lalu",
    pages: "8 halaman",
    progress: 40,
    iconClass: "bg-emerald-50 text-emerald-500",
  },
  {
    title: "Sejarah Indonesia Singkat",
    lastRead: "3 hari yang lalu",
    pages: "15 halaman",
    progress: 30,
    iconClass: "bg-violet-50 text-violet-500",
  },
  {
    title: "Teknologi di Masa Depan",
    lastRead: "5 hari yang lalu",
    pages: "10 halaman",
    progress: 20,
    iconClass: "bg-amber-50 text-amber-500",
  },
];

export function ReadingHistory() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-500" />

          <h2 className="text-xs font-bold text-slate-700">
            Riwayat Bacaan Terakhir
          </h2>
        </div>

        <button className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 transition hover:text-blue-700">
          Lihat Semua
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div>
        {recentBooks.map((book, index) => (
          <div
            key={book.title}
            className={[
              "flex items-center gap-3 px-4 py-2.5",
              index !== recentBooks.length - 1
                ? "border-b border-slate-100"
                : "",
            ].join(" ")}
          >
            {/* Book icon */}
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${book.iconClass}`}
            >
              <FileText
                className="h-4 w-4"
                strokeWidth={1.7}
              />
            </div>

            {/* Book information */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold text-slate-700">
                {book.title}
              </p>

              <p className="mt-0.5 text-[9px] text-slate-500">
                Dibaca terakhir: {book.lastRead}
                <span className="mx-1.5">•</span>
                {book.pages}
              </p>
            </div>

            {/* Progress */}
            <div className="hidden w-24 items-center gap-2 sm:flex">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${book.progress}%`,
                  }}
                />
              </div>

              <span className="w-6 text-right text-[9px] text-slate-500">
                {book.progress}%
              </span>
            </div>

            {/* Play */}
            <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700">
              <Play className="h-3 w-3 fill-current" />
            </button>

            {/* More */}
            <button className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}