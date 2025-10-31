'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MBTIResult } from '@/types/mbti';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
    Compass,
    Brain,
    Heart,
    Calendar,
    BookOpen,
    BadgeCheck,
    Loader2,
} from 'lucide-react';

export default function ResultView({
    initialSessionId,
}: {
    initialSessionId?: string | null;
}) {
    const [sessionId, setSessionId] = useState<string | null>(
        initialSessionId ?? null
    );
    const [result, setResult] = useState<MBTIResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            const saved =
                typeof window !== 'undefined'
                    ? new URLSearchParams(window.location.search).get(
                          'sessionId'
                      ) || localStorage.getItem('sessionId')
                    : null;
            if (saved) setSessionId(saved);
        } else {
            try {
                localStorage.setItem('sessionId', sessionId);
            } catch {}
        }
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;
        setLoading(true);
        fetch(`/api/result/${encodeURIComponent(sessionId)}`)
            .then(async (r) => {
                if (!r.ok) throw new Error(String(r.status));
                return r.json();
            })
            .then(setResult)
            .catch(() =>
                setError(
                    '結果が見つかりませんでした。チャットまたは詳細診断をお試しください。'
                )
            )
            .finally(() => setLoading(false));
    }, [sessionId]);

    return (
        <div className="pb-20">
            <Section className="pt-10">
                <div className="mx-auto max-w-3xl space-y-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold inline-flex items-center gap-2">
                                    <BadgeCheck className="h-5 w-5" />
                                    結果
                                </h1>
                                <div className="flex items-center gap-2">
                                    <Link href="/">
                                        <Button variant="secondary" size="sm">
                                            もう一度試す
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            {loading && (
                                <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                    読み込み中...
                                </div>
                            )}
                            {error && (
                                <div className="text-sm text-rose-600 dark:text-rose-400">
                                    {error}
                                </div>
                            )}
                            {result && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="w-full flex items-center justify-center animate-zoom-in">
                                        <img
                                            alt="avatar"
                                            src={`/api/image/avatar?type=${encodeURIComponent(result.type)}&title=${encodeURIComponent(result.title)}`}
                                            className="h-24 w-24 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm object-cover"
                                        />
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-semibold tracking-tight">
                                            {result.type}
                                        </span>
                                        <span className="text-black/60 dark:text-white/60">
                                            {result.title}
                                        </span>
                                    </div>
                                    <div className="text-sm text-black/70 dark:text-white/70 animate-slide-left">
                                        {result.summary}
                                    </div>
                                    <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 text-sm leading-7 animate-slide-right">
                                        {result.story}
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs stagger-sm">
                                        {Object.entries(result.axes).map(
                                            ([k, v]) => {
                                                const color =
                                                    k === 'E/I'
                                                        ? 'bg-indigo-100/70 dark:bg-indigo-500/10'
                                                        : k === 'S/N'
                                                          ? 'bg-fuchsia-100/70 dark:bg-fuchsia-500/10'
                                                          : k === 'T/F'
                                                            ? 'bg-emerald-100/70 dark:bg-emerald-500/10'
                                                            : 'bg-amber-100/70 dark:bg-amber-500/10';
                                                const Icon =
                                                    k === 'E/I'
                                                        ? Compass
                                                        : k === 'S/N'
                                                          ? Brain
                                                          : k === 'T/F'
                                                            ? Heart
                                                            : Calendar;
                                                return (
                                                    <span
                                                        key={k}
                                                        className={`inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 px-3 py-1 ${color} animate-slide-up`}
                                                    >
                                                        <Icon className="h-3 w-3" />{' '}
                                                        {k}: {v}
                                                    </span>
                                                );
                                            }
                                        )}
                                    </div>

                                    {result.features && (
                                        <div className="animate-slide-left">
                                            <div className="text-sm font-semibold mb-2">
                                                このタイプのよくある特徴
                                            </div>
                                            <div className="text-sm whitespace-pre-wrap text-black/70 dark:text-white/70">
                                                {result.features}
                                            </div>
                                        </div>
                                    )}
                                    {result.reasons && (
                                        <div className="animate-slide-right">
                                            <div className="text-sm font-semibold mb-2">
                                                このタイプと判定した理由
                                            </div>
                                            <div className="text-sm whitespace-pre-wrap text-black/70 dark:text-white/70">
                                                {result.reasons}
                                            </div>
                                        </div>
                                    )}
                                    {result.advice && (
                                        <div className="animate-slide-left">
                                            <div className="text-sm font-semibold mb-2">
                                                日常で役立つアドバイス
                                            </div>
                                            <div className="text-sm whitespace-pre-wrap text-black/70 dark:text-white/70">
                                                {result.advice}
                                            </div>
                                        </div>
                                    )}

                                    <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 animate-zoom-in">
                                        <img
                                            alt="scene"
                                            src={`/api/image/scene?type=${encodeURIComponent(result.type)}&title=${encodeURIComponent(result.title)}`}
                                            className="w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                const url =
                                                    typeof window !==
                                                    'undefined'
                                                        ? window.location.href
                                                        : '';
                                                const text = `私のMBTIは${result.type}（${result.title}）。AI Personality Storyで診断してみよう！ ${url}`;
                                                try {
                                                    navigator.share
                                                        ? navigator.share({
                                                              title: 'AI Personality Story',
                                                              text,
                                                              url,
                                                          })
                                                        : navigator.clipboard.writeText(
                                                              text
                                                          );
                                                } catch {}
                                            }}
                                        >
                                            シェア/コピー
                                        </Button>
                                        <Link href="/chat">
                                            <Button>チャットに戻る</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </Section>
        </div>
    );
}
