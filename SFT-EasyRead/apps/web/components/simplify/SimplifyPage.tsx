"use client";

import { ArrowRight, Copy, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Header } from "../layout/Header";

import { OriginalTextPanel } from "./OriginalTextPanel";
import { SimplifiedTextPanel } from "./SimplifiedTextPanel";
import { SummaryCard } from "./SummaryCard";

const sampleOriginal =
  "Proklamasi Kemerdekaan Indonesia dikumandangkan pada hari Jumat, 17 Agustus 1945, pukul 10.00 pagi di Jalan Pegangsaan Timur No. 56, Jakarta. Teks proklamasi dibacakan oleh Ir. Soekarno atas nama bangsa Indonesia, didampingi oleh Drs. Mohammad Hatta. Peristiwa bersejarah ini merupakan puncak dari perjuangan panjang rakyat Indonesia melawan penjajahan selama lebih dari tiga setengah abad. Setelah Jepang menyerah kepada Sekutu pada 15 Agustus 1945, para pemimpin bangsa segera memanfaatkan momentum tersebut untuk memproklamasikan kemerdekaan tanpa menunggu persetujuan dari pihak manapun. Kemerdekaan ini menjadi tonggak awal berdirinya Negara Kesatuan Republik Indonesia yang merdeka, berdaulat, adil dan makmur. Makna dari proklamasi tidak hanya sebatas bebas dari penjajahan, tetapi juga mengandung tanggung jawab besar untuk membangun bangsa yang bermartabat, sejahtera, dan berdiri sejajar dengan bangsa-bangsa lain.";

const sampleSimplified =
  "Proklamasi Kemerdekaan Indonesia terjadi pada 17 Agustus 1945, pukul 10 pagi di Jalan Pegangsaan Timur No. 56, Jakarta. Ir. Soekarno membacakan teks proklamasi atas nama bangsa Indonesia, didampingi oleh Drs. Mohammad Hatta. Peristiwa ini adalah hasil perjuangan panjang rakyat Indonesia melawan penjajahan selama lebih dari 350 tahun. Setelah Jepang menyerah pada 15 Agustus 1945, para pemimpin langsung memproklamasikan kemerdekaan tanpa menunggu izin siapa pun. Kemerdekaan ini menjadi awal berdirinya Negara Kesatuan Republik Indonesia. Proklamasi berarti bebas dari penjajahan. Namun, kemerdekaan juga berarti tugas besar untuk membangun bangsa yang adil, sejahtera, dan dihormati.";

const summary = [
  "Proklamasi Kemerdekaan Indonesia dibacakan pada 17 Agustus 1945 oleh Ir. Soekarno dan didampingi Drs. Mohammad Hatta.",
  "Peristiwa ini merupakan hasil perjuangan panjang rakyat Indonesia melawan penjajahan selama lebih dari 350 tahun.",
  "Setelah Jepang menyerah pada 15 Agustus 1945, para pemimpin bangsa segera memproklamasikan kemerdekaan.",
  "Kemerdekaan Indonesia menjadi awal berdirinya NKRI dan membawa tanggung jawab untuk membangun bangsa yang adil dan sejahtera.",
];

const levels = [
  { label: "Mudah", description: "Bahasa sehari-hari" },
  { label: "Sedang", description: "Keseimbangan detail" },
  { label: "Sulit", description: "Tetap detail akademik" },
] as const;

export function SimplifyPage() {
  const [originalText, setOriginalText] = useState(sampleOriginal);
  const [simplifiedText, setSimplifiedText] = useState(sampleSimplified);
  const [selectedLevel, setSelectedLevel] = useState<(typeof levels)[number]["label"]>("Sedang");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const wordCount = useMemo(
    () => originalText.trim().split(/\s+/).filter(Boolean).length,
    [originalText],
  );

  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const handleUseExample = () => {
    setOriginalText(sampleOriginal);
    setSimplifiedText(sampleSimplified);
    setSelectedLevel("Sedang");
  };

  const handleReset = () => {
    setOriginalText("");
    setSimplifiedText("");
    setSelectedLevel("Mudah");
  };

  const handleSimplify = async () => {
    if (!originalText.trim()) {
      setSimplifiedText("Teks masih kosong. Masukkan paragraf yang ingin kamu sederhanakan.");
      return;
    }

    setIsLoading(true);

    try {
      const createResponse = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Dokumen yang disederhanakan",
          sourceType: "text",
          originalText,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Gagal membuat dokumen");
      }

      const createdDocument = await createResponse.json();
      const document = createdDocument?.data ?? createdDocument;
      const documentId = document?.id;

      if (!documentId) {
        throw new Error("Dokumen tidak valid");
      }

      const simplifyResponse = await fetch(`/api/documents/${documentId}/simplify`, {
        method: "POST",
      });

      if (!simplifyResponse.ok) {
        throw new Error("Gagal menyederhanakan teks");
      }

      const simplifyResult = await simplifyResponse.json();
      const result = simplifyResult?.data ?? simplifyResult;
      const nextText = result?.result?.simplifiedText ?? result?.simplifiedText ?? "";

      setSimplifiedText(nextText || "Hasil simplifikasi tidak tersedia");
    } catch (error) {
      console.error(error);
      setSimplifiedText("Gagal memproses simplifikasi. Coba lagi beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="p-4 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1220px]">
        <Header
          title="AI Smart Simplifier & Summary"
          description="Masukkan teks, pilih level mudah dibaca, dan dapatkan versi sederhana serta ringkasan inti dalam satu tampilan."
        />

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Simplifikasi teks
                </p>
                <h2 className="text-lg font-semibold text-slate-800">
                  Tingkatkan keterbacaan tanpa kehilangan inti pesan
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {levels.map((level) => (
                <button
                  key={level.label}
                  type="button"
                  onClick={() => setSelectedLevel(level.label)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    selectedLevel === level.label
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSimplify}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              <Wand2 className="h-4 w-4" />
              {isLoading ? "Memproses..." : "Sederhanakan"}
            </button>

            <button
              type="button"
              onClick={handleUseExample}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" />
              Contoh teks
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <div className="ml-auto flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">{wordCount}</span>
              kata • sekitar {readingMinutes} menit baca
            </div>
          </div>
        </section>

        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_42px_minmax(0,1fr)]">
          <OriginalTextPanel text={originalText} onChange={setOriginalText} />

          <div className="hidden items-center justify-center xl:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <SimplifiedTextPanel text={simplifiedText} difficulty={selectedLevel} />
        </div>

        <div className="mt-4">
          <SummaryCard summary={summary} onCopy={handleCopySummary} copied={copied} />
        </div>
      </div>
    </main>
  );
}