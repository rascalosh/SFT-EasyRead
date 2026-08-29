import { ArrowRight } from "lucide-react";

import { Header } from "../layout/Header";

import { OriginalTextPanel } from "./OriginalTextPanel";
import { SimplifiedTextPanel } from "./SimplifiedTextPanel";
import { SummaryCard } from "./SummaryCard";

const originalText =
  "Proklamasi Kemerdekaan Indonesia dikumandangkan pada hari Jumat, 17 Agustus 1945, pukul 10.00 pagi di Jalan Pegangsaan Timur No. 56, Jakarta. Teks proklamasi dibacakan oleh Ir. Soekarno atas nama bangsa Indonesia, didampingi oleh Drs. Mohammad Hatta. Peristiwa bersejarah ini merupakan puncak dari perjuangan panjang rakyat Indonesia melawan penjajahan selama lebih dari tiga setengah abad. Setelah Jepang menyerah kepada Sekutu pada 15 Agustus 1945, para pemimpin bangsa segera memanfaatkan momentum tersebut untuk memproklamasikan kemerdekaan tanpa menunggu persetujuan dari pihak manapun. Kemerdekaan ini menjadi tonggak awal berdirinya Negara Kesatuan Republik Indonesia yang merdeka, berdaulat, adil dan makmur. Makna dari proklamasi tidak hanya sebatas bebas dari penjajahan, tetapi juga mengandung tanggung jawab besar untuk membangun bangsa yang bermartabat, sejahtera, dan berdiri sejajar dengan bangsa-bangsa lain.";

const simplifiedText =
  "Proklamasi Kemerdekaan Indonesia terjadi pada 17 Agustus 1945, pukul 10 pagi di Jalan Pegangsaan Timur No. 56, Jakarta. Ir. Soekarno membacakan teks proklamasi atas nama bangsa Indonesia, didampingi oleh Drs. Mohammad Hatta. Peristiwa ini adalah hasil perjuangan panjang rakyat Indonesia melawan penjajahan selama lebih dari 350 tahun. Setelah Jepang menyerah pada 15 Agustus 1945, para pemimpin langsung memproklamasikan kemerdekaan tanpa menunggu izin siapa pun. Kemerdekaan ini menjadi awal berdirinya Negara Kesatuan Republik Indonesia. Proklamasi berarti bebas dari penjajahan. Namun, kemerdekaan juga berarti tugas besar untuk membangun bangsa yang adil, sejahtera, dan dihormati.";

const summary = [
  "Proklamasi Kemerdekaan Indonesia dibacakan pada 17 Agustus 1945 oleh Ir. Soekarno dan didampingi Drs. Mohammad Hatta.",
  "Peristiwa ini merupakan hasil perjuangan panjang rakyat Indonesia melawan penjajahan selama lebih dari 350 tahun.",
  "Setelah Jepang menyerah pada 15 Agustus 1945, para pemimpin bangsa segera memproklamasikan kemerdekaan.",
  "Kemerdekaan Indonesia menjadi awal berdirinya NKRI dan membawa tanggung jawab untuk membangun bangsa yang adil dan sejahtera.",
];

export function SimplifyPage() {
  return (
    <main className="p-4 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1220px]">
        <Header
          title="AI Smart Simplifier & Summary"
          description="AI membantu kamu menyederhanakan teks yang sulit dan merangkum ide utama dengan cepat."
        />

        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_42px_minmax(0,1fr)]">
          <OriginalTextPanel text={originalText} />

          <div className="hidden items-center justify-center xl:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <SimplifiedTextPanel text={simplifiedText} />
        </div>

        <div className="mt-4">
          <SummaryCard summary={summary} />
        </div>
      </div>
    </main>
  );
}