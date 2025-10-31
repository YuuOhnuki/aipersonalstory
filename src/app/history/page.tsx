'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Row = {
    session_id: string;
    type?: string;
    title?: string;
    created_at?: string;
    mbti_type?: string;
};

export default function HistoryPage() {
    const [mbti, setMbti] = useState<Row[]>([]);
    const [detail, setDetail] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/history/mbti?limit=50')
                .then((r) => r.json())
                .catch(() => ({ items: [] })),
            fetch('/api/history/detail?limit=50')
                .then((r) => r.json())
                .catch(() => ({ items: [] })),
        ])
            .then(([a, b]) => {
                setMbti(a.items || []);
                setDetail(b.items || []);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="pb-20">
            <Section className="pt-10">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold">履歴</h1>
                        <Link href="/">
                            <Button variant="secondary" size="sm">
                                ホーム
                            </Button>
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardBody>
                                <div className="mb-3 font-semibold">
                                    簡易診断
                                </div>
                                {loading && (
                                    <div className="text-sm text-black/60 dark:text-white/60">
                                        読み込み中...
                                    </div>
                                )}
                                {!loading && mbti.length === 0 && (
                                    <div className="text-sm text-black/60 dark:text-white/60">
                                        履歴がありません。
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {mbti.map((r) => (
                                        <div
                                            key={r.session_id}
                                            className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-3 py-2"
                                        >
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {r.type || '-'}{' '}
                                                    <span className="text-black/50 dark:text-white/50">
                                                        {r.title || ''}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-black/60 dark:text-white/60">
                                                    {r.created_at
                                                        ? new Date(
                                                              r.created_at
                                                          ).toLocaleString()
                                                        : ''}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/result/${encodeURIComponent((r as any).result_id || r.session_id)}`}
                                                >
                                                    <Button size="sm">
                                                        開く
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody>
                                <div className="mb-3 font-semibold">
                                    詳細診断
                                </div>
                                {loading && (
                                    <div className="text-sm text-black/60 dark:text-white/60">
                                        読み込み中...
                                    </div>
                                )}
                                {!loading && detail.length === 0 && (
                                    <div className="text-sm text-black/60 dark:text-white/60">
                                        履歴がありません。
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {detail.map((r) => (
                                        <div
                                            key={r.session_id}
                                            className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-3 py-2"
                                        >
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {r.mbti_type || '-'}
                                                </div>
                                                <div className="text-xs text-black/60 dark:text-white/60">
                                                    {r.created_at
                                                        ? new Date(
                                                              r.created_at
                                                          ).toLocaleString()
                                                        : ''}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/detail/result/${encodeURIComponent((r as any).result_id || r.session_id)}`}
                                                >
                                                    <Button size="sm">
                                                        開く
                                                    </Button>
                                                </Link>
                                                <Link href={`/detail/take`}>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                    >
                                                        もう一度診断
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Section>
        </div>
    );
}
