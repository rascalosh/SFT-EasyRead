import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible, DM_Mono, Lexend, Open_Sans } from "next/font/google";
import FontPreference from "@/components/layout/FontPreference";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-lexend",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-atkinson",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "EasyRead AI",
  description: "Membaca jadi lebih mudah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${lexend.variable} ${atkinson.variable} ${openSans.variable} ${dmMono.variable}`}
      data-ui-font="lexend"
      data-reading-font="atkinson"
      data-reading-contrast="cream-ink"
      style={
        {
          "--reading-bg": "#fcf6e7",
          "--reading-fg": "#1B3C53",
          "--reading-font-size": "20px",
          "--reading-letter-spacing": "0.12em",
          "--reading-word-spacing": "0.42em",
        } as CSSProperties
      }
    >
      <body className="font-sans antialiased">
        <FontPreference />
        {children}
      </body>
    </html>
  );
}
