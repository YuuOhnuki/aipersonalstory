"use client";
import { useEffect, useState } from "react";
import Button from "./ui/Button";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("consent.v1");
      setVisible(v !== "agree");
    } catch {}
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 inset-x-0 z-50 px-4">
      <div className="mx-auto max-w-5xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
        <p className="text-xs md:text-sm text-black/70 dark:text-white/70 flex-1">
          本サービスは自己理解支援を目的としたエンタメです。会話内容・回答は匿名で取り扱われ、診断目的以外には使用しません。医療・心理診断ではありません。
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              try { localStorage.setItem("consent.v1", "later"); } catch {}
              setVisible(false);
            }}
          >あとで</Button>
          <Button
            size="sm"
            onClick={() => {
              try { localStorage.setItem("consent.v1", "agree"); } catch {}
              setVisible(false);
            }}
          >同意して続行</Button>
        </div>
      </div>
    </div>
  );
}
