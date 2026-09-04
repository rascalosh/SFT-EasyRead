"use client";

import { useState } from "react";
import { Camera, FileText, Upload } from "lucide-react";
import { ActionCard } from "./ActionCard";
import { Welcome } from "./Welcome";
import { UploadModal } from "./UploadModal";
import { PasteModal } from "./PasteModal";

export function Dashboard() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);

  return (
    <main className="flex-1 p-4 sm:p-5 lg:p-7">
      <div className="w-full">
        <Welcome />

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3 items-stretch">
          <ActionCard
            icon={<Upload className="h-7 w-7 text-blue-500" strokeWidth={1.7} />}
            iconBackground="bg-blue-50"
            title="Upload Teks / Dokumen"
            description="Unggah file .txt, .docx, .pdf untuk mulai membaca dengan tampilan ramah disleksia."
            button={<><Upload className="h-3.5 w-3.5" />Upload File</>}
            buttonClass="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setUploadOpen(true)}
          />

          <ActionCard
            icon={<Camera className="h-7 w-7 text-blue-500" strokeWidth={1.7} />}
            iconBackground="bg-blue-50"
            title="Pindai Teks dari Kamera"
            description="Gunakan kamera untuk memindai teks dari buku, catatan, atau dokumen cetak."
            button={<><Camera className="h-3.5 w-3.5" />Pindai Sekarang</>}
            buttonClass="bg-blue-50 text-blue-600 hover:bg-blue-100"
            onClick={() => alert("Fitur kamera segera hadir!")}
          />

          <ActionCard
            icon={<FileText className="h-7 w-7 text-emerald-500" strokeWidth={1.7} />}
            iconBackground="bg-emerald-50"
            title="Tempel Teks dari Papan Klip"
            description="Salin teks dari sumber lain, kemudian tempel di sini untuk mulai membaca."
            button={<><FileText className="h-3.5 w-3.5" />Tempel Teks</>}
            buttonClass="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            onClick={() => setPasteOpen(true)}
          />
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <PasteModal open={pasteOpen} onClose={() => setPasteOpen(false)} />
    </main>
  );
}