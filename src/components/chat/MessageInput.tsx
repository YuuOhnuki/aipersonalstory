"use client";
import { useState } from "react";
import Button from "../ui/Button";

export default function MessageInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const handleSend = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="メッセージを入力..."
        className="flex-1 bg-transparent outline-none text-sm px-2 py-3"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
      />
      <Button onClick={handleSend} disabled={disabled}>送信</Button>
    </div>
  );
}
