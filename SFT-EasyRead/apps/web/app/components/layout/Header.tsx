import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type HeaderProps = {
  title: string;
  description: string;
};

export function Header({
  title,
  description,
}: HeaderProps) {
  return (
    <div className="mb-5">
      <Link
        href="/home"
        className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-medium text-blue-600 transition hover:text-blue-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Dashboard
      </Link>

      <h1 className="text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
        {title}
      </h1>

      <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
        {description}
      </p>
    </div>
  );
}