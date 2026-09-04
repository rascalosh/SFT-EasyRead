import type { Metadata } from "next";
import { Atkinson_Hyperlegible, DM_Mono, Lexend } from "next/font/google";
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
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${lexend.variable} ${atkinson.variable} ${dmMono.variable}`}
      data-ui-font="lexend"
      data-reading-font="atkinson"
    >
      <body className="font-sans antialiased">
        <FontPreference />
        {children}
      </body>
    </html>
  );
}
