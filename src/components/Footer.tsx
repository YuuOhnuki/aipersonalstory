export default function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/10 py-10">
      <div className="mx-auto max-w-6xl px-4 text-xs text-black/60 dark:text-white/60 space-y-2">
        <p>このアプリは自己理解支援を目的としたエンタメコンテンツであり、医療・心理診断ではありません。</p>
        <p>© {new Date().getFullYear()} AI Personality Story</p>
      </div>
    </footer>
  );
}
