import {
  ChevronRight,
  Clock3,
  Lightbulb,
  Target,
  Volume2,
} from "lucide-react";

const tips = [
  {
    title: "Ketuk kata yang sulit",
    description:
      "Ketuk kata untuk melihat pemecahan suku kata, pengucapan, dan arti sederhana.",
    icon: Target,
    className: "bg-blue-50 text-blue-500",
  },
  {
    title: "Baca perlahan",
    description:
      "Ucapkan suku kata satu per satu untuk membantu pemahaman.",
    icon: Clock3,
    className: "bg-cyan-50 text-cyan-500",
  },
  {
    title: "Ulangi jika perlu",
    description:
      "Dengarkan pengucapan dan baca ulang sampai kamu lebih lancar.",
    icon: Volume2,
    className: "bg-violet-50 text-violet-500",
  },
];

export function ReadingTips() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-blue-500" />

        <h2 className="text-xs font-bold text-slate-700">
          Tips Membaca
        </h2>
      </div>

      <div className="space-y-4">
        {tips.map((tip) => {
          const Icon = tip.icon;

          return (
            <div key={tip.title} className="flex gap-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tip.className}`}
              >
                <Icon
                  className="h-4 w-4"
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <h3 className="text-[9px] font-bold text-slate-700">
                  {tip.title}
                </h3>

                <p className="mt-1 text-[8px] leading-[1.45] text-slate-500">
                  {tip.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 py-2 text-[9px] font-semibold text-blue-600 transition hover:bg-blue-50">
        Lihat Semua Tips
        <ChevronRight className="h-3 w-3" />
      </button>
    </section>
  );
}