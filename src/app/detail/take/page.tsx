'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [loading, setLoading] = useState(false);
    // 結果は同一ページで表示せず、結果ページへ遷移する
    const [sessionId, setSessionId] = useState<string | null>(null);

    const MBTI_MAP: Record<
        string,
        { axis: 'E/I' | 'S/N' | 'T/F' | 'J/P'; dir: 1 | -1; weight: number }
    > = {
        A1: { axis: 'E/I', dir: +1, weight: 1.0 },
        A2: { axis: 'S/N', dir: -1, weight: 1.0 },
        A3: { axis: 'T/F', dir: +1, weight: 1.0 },
        A4: { axis: 'J/P', dir: +1, weight: 1.0 },
        A5: { axis: 'E/I', dir: +1, weight: 0.8 },
        A6: { axis: 'S/N', dir: +1, weight: 0.8 },
        A7: { axis: 'T/F', dir: +1, weight: 0.8 },
        A8: { axis: 'J/P', dir: +1, weight: 0.8 },
    };
    const BIGFIVE_AXES: Record<
        string,
        | 'openness'
        | 'conscientiousness'
        | 'extraversion'
        | 'agreeableness'
        | 'neuroticism'
        | undefined
    > = {
        B9: 'openness',
        B10: 'openness',
        B11: 'openness',
        B12: 'openness',
        B13: 'conscientiousness',
        B14: 'conscientiousness',
        B15: 'conscientiousness',
        B16: 'conscientiousness',
        B17: 'extraversion',
        B18: 'extraversion',
        B19: 'extraversion',
        B20: 'extraversion',
        B21: 'agreeableness',
        B22: 'agreeableness',
        B23: 'agreeableness',
        B24: 'agreeableness',
        B25: 'neuroticism',
        B26: 'neuroticism',
        B27: 'neuroticism',
        B28: 'neuroticism',
    };

    const debugState = useMemo(() => {
        const mbtiScores: Record<'E/I' | 'S/N' | 'T/F' | 'J/P', number> = {
            'E/I': 0,
            'S/N': 0,
            'T/F': 0,
            'J/P': 0,
        };
        const mbtiWeights: Record<'E/I' | 'S/N' | 'T/F' | 'J/P', number> = {
            'E/I': 0,
            'S/N': 0,
            'T/F': 0,
            'J/P': 0,
        };
        const mbtiDetails: Array<{
            id: string;
            axis: string;
            score: number;
            contrib: number;
            weight: number;
        }> = [];
        Object.values(answers).forEach((a) => {
            const meta = MBTI_MAP[a.questionId];
            if (meta && typeof a.score === 'number') {
                const v = ((a.score - 3) / 2) * meta.dir;
                mbtiScores[meta.axis] += v * meta.weight;
                mbtiWeights[meta.axis] += meta.weight;
                mbtiDetails.push({
                    id: a.questionId,
                    axis: meta.axis,
                    score: a.score,
                    contrib: v,
                    weight: meta.weight,
                });
            }
        });
        const ei =
            (mbtiWeights['E/I'] ? mbtiScores['E/I'] / mbtiWeights['E/I'] : 0) >=
            0
                ? 'E'
                : 'I';
        const sn =
            (mbtiWeights['S/N'] ? mbtiScores['S/N'] / mbtiWeights['S/N'] : 0) >=
            0
                ? 'S'
                : 'N';
        const tf =
            (mbtiWeights['T/F'] ? mbtiScores['T/F'] / mbtiWeights['T/F'] : 0) >=
            0
                ? 'T'
                : 'F';
        const jp =
            (mbtiWeights['J/P'] ? mbtiScores['J/P'] / mbtiWeights['J/P'] : 0) >=
            0
                ? 'J'
                : 'P';
        const mbtiType = `${ei}${sn}${tf}${jp}`;

        const bigSum: any = {
            openness: 0,
            conscientiousness: 0,
            extraversion: 0,
            agreeableness: 0,
            neuroticism: 0,
        };
        const bigCount: any = {
            openness: 0,
            conscientiousness: 0,
            extraversion: 0,
            agreeableness: 0,
            neuroticism: 0,
        };
        const bigDetails: Array<{ id: string; axis: string; score: number }> =
            [];
        Object.values(answers).forEach((a) => {
            const ax = BIGFIVE_AXES[a.questionId];
            if (ax && typeof a.score === 'number') {
                bigSum[ax] += a.score;
                bigCount[ax] += 1;
                bigDetails.push({ id: a.questionId, axis: ax, score: a.score });
            }
        });
        const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
        const bigFive = {
            openness: Math.round(
                clamp01((bigSum.openness / (bigCount.openness || 1) - 1) / 4) *
                    100
            ),
            conscientiousness: Math.round(
                clamp01(
                    (bigSum.conscientiousness /
                        (bigCount.conscientiousness || 1) -
                        1) /
                        4
                ) * 100
            ),
            extraversion: Math.round(
                clamp01(
                    (bigSum.extraversion / (bigCount.extraversion || 1) - 1) / 4
                ) * 100
            ),
            agreeableness: Math.round(
                clamp01(
                    (bigSum.agreeableness / (bigCount.agreeableness || 1) - 1) /
                        4
                ) * 100
            ),
            neuroticism: Math.round(
                clamp01(
                    (bigSum.neuroticism / (bigCount.neuroticism || 1) - 1) / 4
                ) * 100
            ),
        };
        return {
            mbtiScores,
            mbtiWeights,
            mbtiDetails,
            mbtiType,
            bigFive,
            bigDetails,
        };
    }, [answers]);

    const fillRandom = () => {
        const next: Record<string, Answer> = { ...answers };
        for (const q of questions) {
            if (q.type === 'scale') {
                const v = 1 + Math.floor(Math.random() * 5);
                next[q.id] = { questionId: q.id, score: v };
            } else if (q.type === 'text') {
                next[q.id] = { questionId: q.id, text: 'テスト入力' };
            }
        }
        setAnswers(next);
    };

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
            const rid = data?.result_id || sessionId;
            if (rid && typeof rid === 'string') {
                router.push(`/detail/result/${encodeURIComponent(rid)}`);
                return;
            }
        } finally {
            setLoading(false);
        }
    };

    const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
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
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-black/60 dark:text-white/60">
                                        目安 5〜10分
                                    </div>
                                    {DEBUG && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={fillRandom}
                                        >
                                            ランダムで回答
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    {DEBUG && (
                        <Card>
                            <CardBody>
                                <div className="space-y-2 text-[11px]">
                                    <div className="font-medium">
                                        デバッグ: 回答の寄与
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10">
                                            MBTI: {debugState.mbtiType}
                                        </span>
                                        {(
                                            [
                                                'E/I',
                                                'S/N',
                                                'T/F',
                                                'J/P',
                                            ] as const
                                        ).map((k) => (
                                            <span
                                                key={k}
                                                className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10"
                                            >
                                                {k}:
                                                {String(
                                                    debugState.mbtiScores[
                                                        k
                                                    ].toFixed(2)
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(debugState.bigFive).map(
                                            ([k, v]) => (
                                                <span
                                                    key={k}
                                                    className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10"
                                                >
                                                    {k}:{String(v)}
                                                </span>
                                            )
                                        )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-2">
                                        <div>
                                            <div className="opacity-70 mb-1">
                                                MBTIへの寄与
                                            </div>
                                            <div className="space-y-1">
                                                {debugState.mbtiDetails.map(
                                                    (d) => (
                                                        <div
                                                            key={d.id}
                                                            className="rounded border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 px-2 py-1"
                                                        >
                                                            <span className="mr-2">
                                                                {d.id}
                                                            </span>
                                                            <span className="mr-2">
                                                                {d.axis}
                                                            </span>
                                                            <span className="mr-2">
                                                                score:{d.score}
                                                            </span>
                                                            <span className="mr-2">
                                                                Δ
                                                                {d.contrib.toFixed(
                                                                    2
                                                                )}
                                                            </span>
                                                            <span className="opacity-70">
                                                                w:{d.weight}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="opacity-70 mb-1">
                                                Big Fiveへの寄与
                                            </div>
                                            <div className="space-y-1">
                                                {debugState.bigDetails.map(
                                                    (d) => (
                                                        <div
                                                            key={d.id}
                                                            className="rounded border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 px-2 py-1"
                                                        >
                                                            <span className="mr-2">
                                                                {d.id}
                                                            </span>
                                                            <span className="mr-2">
                                                                {d.axis}
                                                            </span>
                                                            <span className="opacity-70">
                                                                score:{d.score}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}
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

                    {/* 結果は遷移先で表示するため、このページでは表示しない */}
                </div>
            </Section>
        </div>
    );
}
