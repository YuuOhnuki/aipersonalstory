'use client';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/conversation';
import api from '@/lib/api';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ChatPage() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const saved =
            typeof window !== 'undefined'
                ? localStorage.getItem('sessionId')
                : null;
        if (saved) {
            setSessionId(saved);
            return;
        }
        api.startSession().then((s) => {
            setSessionId(s.id);
            try {
                localStorage.setItem('sessionId', s.id);
            } catch {}
        });
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const onSend = async (text: string) => {
        if (!sessionId) return;
        setLoading(true);
        const now = new Date().toISOString();
        const optimistic: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            createdAt: now,
        };
        setMessages((prev) => [...prev, optimistic]);
        try {
            const res = await api.sendMessage(sessionId, text);
            setMessages((prev) => [
                ...prev,
                ...res.messages.filter((m) => m.role === 'assistant'),
            ]);
            setDone(Boolean(res.done));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-20">
            <Section className="pt-10">
                <div className="mx-auto max-w-3xl space-y-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold">
                                    チャット
                                </h1>
                                <div className="flex items-center gap-2">
                                    {done ? (
                                        <Link
                                            href={
                                                sessionId
                                                    ? `/result/${encodeURIComponent(sessionId)}`
                                                    : '/result'
                                            }
                                        >
                                            <Button size="md">
                                                結果を見る
                                            </Button>
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-black/60 dark:text-white/60">
                                            最大5往復で終了
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            {done && (
                                <div className="mb-4 rounded-xl border border-emerald-300/40 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-4 text-center transition-opacity">
                                    <div className="text-base md:text-lg font-semibold">
                                        診断完了！
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                        結果が生成できました。下のボタンから結果ページへ進めます。
                                    </div>
                                    <div className="mt-3">
                                        <Link
                                            href={
                                                sessionId
                                                    ? `/result/${encodeURIComponent(sessionId)}`
                                                    : '/result'
                                            }
                                        >
                                            <Button size="lg">
                                                結果を見る
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-4 max-h-[60vh] overflow-auto pr-1 transition-opacity">
                                {messages.length === 0 && (
                                    <div className="text-sm text-black/60 dark:text-white/60">
                                        こんにちは。まずは最近の過ごし方について教えてください（例：休日の過ごし方）。
                                    </div>
                                )}
                                {messages.map((m) => (
                                    <div key={m.id} className="animate-fade-in">
                                        <MessageBubble message={m} />
                                    </div>
                                ))}
                                {loading && (
                                    <div className="text-xs text-black/60 dark:text-white/60">
                                        AIが考えています...
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>
                            <div className="mt-4">
                                <MessageInput
                                    onSend={onSend}
                                    disabled={!sessionId || loading}
                                />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </Section>
        </div>
    );
}
