'use client';
import { useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Question = {
    id: string;
    section: 'MBTI' | 'BIGFIVE' | 'SUPPLEMENT' | 'OPEN';
    axis?: string;
    text: string;
    type: 'scale' | 'text';
    weight?: number;
};

type Answer = { questionId: string; score?: number; text?: string };

export default function DetailTakePage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [loading, setLoading] = useState(false);
    type DetailResult = {
        mbti_type: string;
        bigFive?: Record<string, number>;
        summaryText?: string;
        story?: string;
    } | null;
    const [result, setResult] = useState<DetailResult>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/questions/detail')
            .then((r) => r.json())
            .then((data) => setQuestions(data.questions || []));
        const saved =
            typeof window !== 'undefined'
                ? localStorage.getItem('sessionId')
                : null;
        setSessionId(saved || null);
    }, []);

    const progress = useMemo(() => {
        const total = questions.length;
        const done = Object.values(answers).filter(
            (a) => a.score != null || (a.text && a.text.trim().length > 0)
        ).length;
        return {
            total,
            done,
            pct: total ? Math.round((done / total) * 100) : 0,
        };
    }, [questions, answers]);

    const setScale = (id: string, score: number) =>
        setAnswers((prev) => ({ ...prev, [id]: { questionId: id, score } }));
    const setText = (id: string, text: string) =>
        setAnswers((prev) => ({ ...prev, [id]: { questionId: id, text } }));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const body = { answers: Object.values(answers) };
            const url = `/api/diagnose/detail${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            setResult((data.result || data) as DetailResult);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-24">
            {/* Sticky progress */}
            <div className="sticky top-16 z-30 bg-white/60 dark:bg-black/20 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
                <div className="mx-auto max-w-3xl px-4 py-3">
                    <div className="text-xs text-black/60 dark:text-white/60 mb-1">
                        進捗 {progress.done}/{progress.total}（{progress.pct}%）
                    </div>
                    <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 transition-all"
                            style={{ width: `${progress.pct}%` }}
                        />
                    </div>
                </div>
            </div>
            <Section className="pt-10">
                <div className="mx-auto max-w-3xl space-y-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold">
                                    詳細診断
                                </h1>
                                <div className="text-xs text-black/60 dark:text-white/60">
                                    目安 5〜10分
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <div className="space-y-10">
                                {questions.map((q) => (
                                    <div
                                        key={q.id}
                                        className="space-y-3 animate-fade-in"
                                    >
                                        <div className="font-medium text-base text-center">
                                            {q.id}. {q.text}
                                        </div>
                                        {q.type === 'scale' ? (
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                {/* 凡例 */}
                                                <div className="w-full max-w-xs md:max-w-sm text-[11px] md:text-xs text-black/60 dark:text-white/60 flex items-center justify-between">
                                                    <span>
                                                        当てはまらない（1）
                                                    </span>
                                                    <span>
                                                        どちらでもない（3）
                                                    </span>
                                                    <span>
                                                        とても当てはまる（5）
                                                    </span>
                                                </div>
                                                {/* 選択ボタン */}
                                                <div className="flex gap-3 md:gap-4">
                                                    {[1, 2, 3, 4, 5].map(
                                                        (v) => {
                                                            const label =
                                                                v === 1
                                                                    ? '当てはまらない'
                                                                    : v === 3
                                                                      ? 'どちらでもない'
                                                                      : v === 5
                                                                        ? 'とても当てはまる'
                                                                        : `${v}`;
                                                            const selected =
                                                                answers[q.id]
                                                                    ?.score ===
                                                                v;
                                                            return (
                                                                <button
                                                                    key={v}
                                                                    onClick={() =>
                                                                        setScale(
                                                                            q.id,
                                                                            v
                                                                        )
                                                                    }
                                                                    aria-label={`スコア${v}（${label}）`}
                                                                    title={`スコア${v}（${label}）`}
                                                                    className={[
                                                                        'h-12 w-12 md:h-14 md:w-14 rounded-full border text-sm md:text-base shadow-sm transition-transform active:scale-95',
                                                                        selected
                                                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                                                            : 'bg-white/70 dark:bg-white/10 border-black/10 dark:border-white/10',
                                                                    ].join(' ')}
                                                                >
                                                                    {v}
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <textarea
                                                rows={4}
                                                value={
                                                    answers[q.id]?.text || ''
                                                }
                                                onChange={(e) =>
                                                    setText(
                                                        q.id,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-3 text-sm"
                                                placeholder="自由に記入してください"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 flex justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? '分析中...' : '結果を生成'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {result && (
                        <Card>
                            <CardBody>
                                <div className="space-y-3">
                                    <div className="text-sm text-black/70 dark:text-white/70">
                                        MBTI: {result.mbti_type}
                                    </div>
                                    {result.bigFive && (
                                        <div className="text-xs flex flex-wrap gap-2">
                                            {Object.entries(result.bigFive).map(
                                                ([k, v]) => (
                                                    <span
                                                        key={k}
                                                        className="rounded-full border border-black/10 dark:border-white/10 px-3 py-1 bg-white/60 dark:bg-white/10 backdrop-blur-md"
                                                    >
                                                        {k}: {v}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}
                                    <div className="text-sm">
                                        {result.summaryText}
                                    </div>
                                    {result.story && (
                                        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 text-sm leading-7">
                                            {result.story}
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </Section>
        </div>
    );
}
