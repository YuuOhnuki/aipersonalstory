import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import LiquidBackground from "@/components/LiquidBackground";
import ConsentBanner from "@/components/ConsentBanner";

import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Personality Story",
  description: "会話からMBTIを推定し、あなたの物語を生成する対話型Webアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-[var(--background)] text-[var(--foreground)]`}>
        <LiquidBackground />
        <NavBar />
        <main className="mx-auto max-w-6xl px-4">
          {children}
        </main>
        <Footer />
        <ConsentBanner />
        <Analytics/>
      </body>
    </html>
  );
}
