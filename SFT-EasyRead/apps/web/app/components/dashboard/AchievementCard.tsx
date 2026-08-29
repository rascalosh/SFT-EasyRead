import { Award, Sparkles } from "lucide-react";

export function AchievementCard() {
  return (
    <section className="relative mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[105px] items-center justify-between px-5 py-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />

            <h2 className="text-xs font-bold text-slate-700">
              Tetap semangat!
            </h2>
          </div>

          <p className="mt-1.5 text-[10px] text-slate-500">
            Konsistensi adalah kunci untuk menjadi pembaca hebat.
          </p>

          <button className="mt-3 rounded-md border border-slate-200 px-3 py-1.5 text-[9px] font-semibold text-blue-600 transition hover:bg-blue-50">
            Lihat Progress & Achievement
          </button>
        </div>

        <div className="mr-2 hidden md:block lg:mr-8">
          <div className="relative flex h-20 w-28 items-center justify-center">
            <Sparkles className="absolute left-1 top-1 h-4 w-4 text-amber-400" />

            <Sparkles className="absolute right-0 top-3 h-3 w-3 text-amber-400" />

            <div className="relative">
              <Award
                className="h-14 w-14 text-blue-500"
                strokeWidth={1.5}
              />

              <div className="absolute -bottom-1 left-1/2 h-2 w-12 -translate-x-1/2 rounded-full bg-blue-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}