"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cx } from "@/components/shared/ui"

/**
 * Render Markdown hasil AI (Simplify versi terstruktur) dengan tampilan
 * seperti jawaban Gemini/Claude/ChatGPT: judul bagian, poin, kata kunci
 * tebal, tabel, dan blok Catatan. Font/ukuran/jarak/kontras ikut Pengaturan
 * lewat kelas `reading-area`; gaya elemennya ada di `.md-answer` (globals.css).
 *
 * react-markdown tidak merender HTML mentah, jadi aman dari injeksi.
 */
export function MarkdownAnswer({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cx("md-answer reading-area !max-w-none !bg-transparent !p-0", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Tautan dari model dibuka di tab baru; pembaca tidak kehilangan halaman.
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Judul level 1 dari model diturunkan agar tidak bersaing dengan judul halaman.
          h1: ({ children }) => <h2>{children}</h2>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
