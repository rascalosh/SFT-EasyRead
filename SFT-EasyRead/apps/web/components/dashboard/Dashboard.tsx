import { Camera, FileText, Upload } from "lucide-react";

import { ActionCard } from "./ActionCard";
import { AchievementCard } from "./AchievementCard";
import { ContinueReadingCard } from "./ContinueReadingCard";
import { ReadingHistory } from "./ReadingHistory";
import { ReadingTips } from "./ReadingTips";
import { Welcome } from "./Welcome";

export function Dashboard() {
  return (
    <main className="flex-1 p-4 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1220px]">
        <Welcome />

        {/* Action cards + Continue Reading */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_235px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ActionCard
              icon={
                <Upload
                  className="h-7 w-7 text-blue-500"
                  strokeWidth={1.7}
                />
              }
              iconBackground="bg-blue-50"
              title="Upload Teks / Dokumen"
              description="Unggah file .txt, .docx, .pdf untuk mulai membaca dengan tampilan ramah disleksia."
              button={
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload File
                </>
              }
              buttonClass="bg-blue-600 text-white hover:bg-blue-700"
            />

            <ActionCard
              icon={
                <Camera
                  className="h-7 w-7 text-blue-500"
                  strokeWidth={1.7}
                />
              }
              iconBackground="bg-blue-50"
              title="Pindai Teks dari Kamera"
              description="Gunakan kamera untuk memindai teks dari buku, catatan, atau dokumen cetak."
              button={
                <>
                  <Camera className="h-3.5 w-3.5" />
                  Pindai Sekarang
                </>
              }
              buttonClass="bg-blue-50 text-blue-600 hover:bg-blue-100"
            />

            <ActionCard
              icon={
                <FileText
                  className="h-7 w-7 text-emerald-500"
                  strokeWidth={1.7}
                />
              }
              iconBackground="bg-emerald-50"
              title="Tempel Teks dari Papan Klip"
              description="Salin teks dari sumber lain, kemudian tempel di sini untuk mulai membaca."
              button={
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Tempel Teks
                </>
              }
              buttonClass="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            />
          </div>

          <ContinueReadingCard />
        </div>

        {/* Reading history + tips */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_235px]">
          <ReadingHistory />
          <ReadingTips />
        </div>

        <AchievementCard />
      </div>
    </main>
  );
}