"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./ui/Button";

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 dark:bg-black/20 border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">AI Personality Story</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className={pathname === "/" ? "text-black dark:text-white" : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"}>ホーム</Link>
          <Link href="/chat" className={pathname?.startsWith("/chat") ? "text-black dark:text-white" : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"}>チャット</Link>
          <Link href="/result" className={pathname?.startsWith("/result") ? "text-black dark:text-white" : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"}>結果</Link>
          <Link href="/detail" className={pathname?.startsWith("/detail") ? "text-black dark:text-white" : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"}>詳細診断</Link>
          <Link href="/history" className={pathname?.startsWith("/history") ? "text-black dark:text-white" : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"}>履歴</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/chat"><Button size="sm" variant="secondary">はじめる</Button></Link>
        </div>
      </div>
    </header>
  );
}
