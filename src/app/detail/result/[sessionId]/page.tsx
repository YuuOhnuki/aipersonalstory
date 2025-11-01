import type { Metadata } from 'next';
import type React from 'react';
import { redirect } from 'next/navigation';
import { dbGetDetailResultByAny } from '@/server/db';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
    Sparkles,
    Gauge,
    Users,
    Handshake,
    AlertTriangle,
    Shield,
    Repeat,
    Scale,
} from 'lucide-react';
import ProgressiveImage from '@/components/ui/ProgressiveImage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
    const p = await params;
    const row = await dbGetDetailResultByAny(p.sessionId);
    const type = row?.mbti_type || 'MB';
    const title = '詳細診断 結果';
    const avatarUrl = `/api/image/avatar?id=${encodeURIComponent(p.sessionId)}`;
    return {
        title: `${title} - ${type}`,
        openGraph: {
            title: `${title} - ${type}`,
            images: [{ url: avatarUrl, width: 800, height: 800 }],
        },
        twitter: {
            card: 'summary_large_image',
            images: [avatarUrl],
        },
    };
}

export default async function DetailResultPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const p = await params;
    const row = await dbGetDetailResultByAny(p.sessionId);
    if (row && row.result_id && row.result_id !== p.sessionId) {
        return redirect(`/detail/result/${encodeURIComponent(row.result_id)}`);
    }
    if (!row) {
        return (
            <div className="pb-20">
                <Section className="pt-10">
                    <div className="mx-auto max-w-3xl">
                        <Card>
                            <CardBody>
                                <div className="text-sm">
                                    結果が見つかりませんでした。
                                </div>
                                <div className="mt-3">
                                    <Link href="/detail/take">
                                        <Button>詳細診断へ戻る</Button>
                                    </Link>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </Section>
            </div>
        );
    }

    const keyBase = String(row.result_id || p.sessionId || '');
    const avatarKey = `detail:avatar:${keyBase}`;
    const sceneKey = `detail:scene:${keyBase}`;
    const avatarUrl =
        row.avatar_url ||
        `/api/image/avatar?id=${encodeURIComponent(keyBase)}&title=${encodeURIComponent('詳細診断')}&k=${encodeURIComponent(avatarKey)}`;
    const sceneUrl =
        row.scene_url ||
        `/api/image/scene?id=${encodeURIComponent(keyBase)}&title=${encodeURIComponent('詳細診断')}&k=${encodeURIComponent(sceneKey)}`;

    // Determine dominant traits for subtitle
    const bigs = [
        ['Openness', row.openness],
        ['Conscientiousness', row.conscientiousness],
        ['Extraversion', row.extraversion],
        ['Agreeableness', row.agreeableness],
        ['Neuroticism', row.neuroticism],
    ] as const;
    const sorted = bigs.slice().sort((a, b) => Number(b[1]) - Number(a[1]));
    const topBig = sorted[0]?.[0] || '';
    const secondBig = sorted[1]?.[0] || '';

    const elements = String(row.summaryText || '')
        .split(/[、。\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);

    return (
        <div className="pb-20">
            <Section className="pt-10">
                <div className="mx-auto max-w-3xl space-y-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold">
                                    詳細診断 結果
                                </h1>
                                <div className="flex items-center gap-2">
                                    <Link href="/history">
                                        <Button variant="secondary" size="sm">
                                            履歴
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="space-y-5 animate-fade-in">
                                <div className="w-full flex items-center justify-center">
                                    <ProgressiveImage
                                        alt="avatar"
                                        src={avatarUrl}
                                        className="h-24 w-24"
                                        skeletonClassName="h-24 w-24"
                                        imgClassName="h-24 w-24 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm object-cover"
                                        progressKey={avatarKey}
                                    />
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-semibold tracking-tight">
                                        {row.mbti_type}
                                    </span>
                                    <span className="text-black/60 dark:text-white/60">
                                        詳細診断（主要傾向: {topBig}
                                        {secondBig ? `・${secondBig}` : ''}）
                                    </span>
                                </div>

                                {/* 性格の特徴セクション（グリッド限定適用） */}
                                <div className="space-y-3">
                                    <div className="text-sm font-semibold">
                                        性格の特徴
                                    </div>
                                    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 text-sm">
                                        <div
                                            className={`grid ${elements.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}
                                        >
                                            {/* MBTI要素（アイコン付きバッジ） */}
                                            <div>
                                                <div className="text-xs font-medium mb-2">
                                                    MBTI要素
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                                                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200">
                                                        <Users className="h-3 w-3" />{' '}
                                                        E/I:{' '}
                                                        {row.mbti_type?.[0] ||
                                                            '-'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 border border-fuchsia-200/60 dark:border-fuchsia-500/20 bg-fuchsia-50/70 dark:bg-fuchsia-500/10 text-fuchsia-900 dark:text-fuchsia-200">
                                                        <Sparkles className="h-3 w-3" />{' '}
                                                        S/N:{' '}
                                                        {row.mbti_type?.[1] ||
                                                            '-'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                                                        <Handshake className="h-3 w-3" />{' '}
                                                        T/F:{' '}
                                                        {row.mbti_type?.[2] ||
                                                            '-'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200">
                                                        <Gauge className="h-3 w-3" />{' '}
                                                        J/P:{' '}
                                                        {row.mbti_type?.[3] ||
                                                            '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 数値特徴（プログレスバー） */}
                                            <div>
                                                <div className="text-xs font-medium mb-2">
                                                    数値特徴
                                                </div>
                                                <div className="space-y-2">
                                                    {typeof row.openness ===
                                                        'number' &&
                                                        !Number.isNaN(
                                                            row.openness
                                                        ) && (
                                                            <div>
                                                                <div className="flex items-center justify-between text-[11px] md:text-xs mb-1">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <Sparkles className="h-3 w-3" />{' '}
                                                                        Openness
                                                                    </div>
                                                                    <div className="text-black/60 dark:text-white/60">
                                                                        {Math.round(
                                                                            row.openness
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-indigo-500 dark:bg-indigo-400"
                                                                        style={{
                                                                            width: `${Math.max(0, Math.min(100, Math.round(row.openness)))}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    {typeof row.conscientiousness ===
                                                        'number' &&
                                                        !Number.isNaN(
                                                            row.conscientiousness
                                                        ) && (
                                                            <div>
                                                                <div className="flex items-center justify-between text-[11px] md:text-xs mb-1">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <Gauge className="h-3 w-3" />{' '}
                                                                        Conscientiousness
                                                                    </div>
                                                                    <div className="text-black/60 dark:text-white/60">
                                                                        {Math.round(
                                                                            row.conscientiousness
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-emerald-500 dark:bg-emerald-400"
                                                                        style={{
                                                                            width: `${Math.max(0, Math.min(100, Math.round(row.conscientiousness)))}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    {typeof row.extraversion ===
                                                        'number' &&
                                                        !Number.isNaN(
                                                            row.extraversion
                                                        ) && (
                                                            <div>
                                                                <div className="flex items-center justify-between text-[11px] md:text-xs mb-1">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />{' '}
                                                                        Extraversion
                                                                    </div>
                                                                    <div className="text-black/60 dark:text-white/60">
                                                                        {Math.round(
                                                                            row.extraversion
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-amber-500 dark:bg-amber-400"
                                                                        style={{
                                                                            width: `${Math.max(0, Math.min(100, Math.round(row.extraversion)))}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    {typeof row.agreeableness ===
                                                        'number' &&
                                                        !Number.isNaN(
                                                            row.agreeableness
                                                        ) && (
                                                            <div>
                                                                <div className="flex items-center justify-between text-[11px] md:text-xs mb-1">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <Handshake className="h-3 w-3" />{' '}
                                                                        Agreeableness
                                                                    </div>
                                                                    <div className="text-black/60 dark:text-white/60">
                                                                        {Math.round(
                                                                            row.agreeableness
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-fuchsia-500 dark:bg-fuchsia-400"
                                                                        style={{
                                                                            width: `${Math.max(0, Math.min(100, Math.round(row.agreeableness)))}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    {typeof row.neuroticism ===
                                                        'number' &&
                                                        !Number.isNaN(
                                                            row.neuroticism
                                                        ) && (
                                                            <div>
                                                                <div className="flex items-center justify-between text-[11px] md:text-xs mb-1">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3" />{' '}
                                                                        Neuroticism
                                                                    </div>
                                                                    <div className="text-black/60 dark:text-white/60">
                                                                        {Math.round(
                                                                            row.neuroticism
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-rose-500 dark:bg-rose-400"
                                                                        style={{
                                                                            width: `${Math.max(0, Math.min(100, Math.round(row.neuroticism)))}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>

                                            {/* 読み取った要素（チップ形式） */}
                                            {elements.length > 0 && (
                                                <div>
                                                    <div className="text-xs font-medium mb-2">
                                                        読み取った要素
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                                                        {elements.map(
                                                            (t, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 text-black/70 dark:text-white/70"
                                                                >
                                                                    {t}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 説明（グリッド外補助） */}
                                        <div className="mt-4 text-[11px] md:text-xs text-black/60 dark:text-white/60 grid md:grid-cols-2 gap-3">
                                            <div>
                                                <div className="font-medium">
                                                    Openness
                                                </div>
                                                <div>
                                                    新しい体験や抽象的な概念への開放性。
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    Conscientiousness
                                                </div>
                                                <div>
                                                    責任感や規則への従順性。
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    Extraversion
                                                </div>
                                                <div>社交性や外向性。</div>
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    Agreeableness
                                                </div>
                                                <div>
                                                    協調性や他者への配慮。
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    Neuroticism
                                                </div>
                                                <div>
                                                    神経症的傾向やストレスへの反応性。
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AIによるストーリー生成セクション */}
                                <div className="space-y-3">
                                    <div className="text-sm font-semibold">
                                        AIによるストーリー生成
                                    </div>
                                    <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 text-sm leading-7 whitespace-pre-wrap">
                                        {row.story}
                                    </div>
                                    {(() => {
                                        const adviceText = String(
                                            row.advice || ''
                                        );
                                        const renderFormatted = (
                                            text: string
                                        ) => {
                                            const lines = String(
                                                text || ''
                                            ).split(/\r?\n/);
                                            const items: string[] = [];
                                            const blocks: React.ReactNode[] =
                                                [];
                                            const flushList = () => {
                                                if (items.length) {
                                                    blocks.push(
                                                        <ul
                                                            className="list-disc pl-6 space-y-1"
                                                            key={`ul-${blocks.length}`}
                                                        >
                                                            {items.map(
                                                                (t, i) => (
                                                                    <li key={i}>
                                                                        {renderInline(
                                                                            t
                                                                        )}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    );
                                                    items.length = 0;
                                                }
                                            };
                                            const renderInline = (
                                                s: string
                                            ) => {
                                                const parts: React.ReactNode[] =
                                                    [];
                                                const boldRe =
                                                    /\*\*([^*]+)\*\*/g;
                                                let lastIndex = 0;
                                                let m: RegExpExecArray | null;
                                                while ((m = boldRe.exec(s))) {
                                                    const before = s.slice(
                                                        lastIndex,
                                                        m.index
                                                    );
                                                    if (before)
                                                        parts.push(before);
                                                    parts.push(
                                                        <strong
                                                            key={`${m.index}-${m[1]}`}
                                                        >
                                                            {m[1]}
                                                        </strong>
                                                    );
                                                    lastIndex =
                                                        m.index + m[0].length;
                                                }
                                                const after =
                                                    s.slice(lastIndex);
                                                if (after) parts.push(after);
                                                return <>{parts}</>;
                                            };
                                            for (const line of lines) {
                                                const l = line.trimEnd();
                                                if (/^[-•]\s+/.test(l)) {
                                                    items.push(
                                                        l.replace(
                                                            /^[-•]\s+/,
                                                            ''
                                                        )
                                                    );
                                                } else if (l === '') {
                                                    flushList();
                                                } else {
                                                    flushList();
                                                    blocks.push(
                                                        <p
                                                            className="mb-2"
                                                            key={`p-${blocks.length}`}
                                                        >
                                                            {renderInline(l)}
                                                        </p>
                                                    );
                                                }
                                            }
                                            flushList();
                                            return (
                                                <div className="space-y-2">
                                                    {blocks}
                                                </div>
                                            );
                                        };
                                        const pick = (label: string) => {
                                            // Match section labeled like 【ラベル】 ... until next header separated by >=1 blank line(s)
                                            const re = new RegExp(
                                                `【${label}】[\t\x20]*[\r\n]+([\s\S]*?)(?=(?:\r?\n){2}【|$)`
                                            );
                                            const m = adviceText.match(re);
                                            return m?.[1]?.trim() || '';
                                        };
                                        const a = pick('アドバイス');
                                        const c = pick('あるある');
                                        const e = pick('科学的根拠');
                                        return (
                                            <>
                                                {a && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-semibold">
                                                            日常で役立つアドバイス
                                                        </div>
                                                        <div className="text-sm text-black/70 dark:text-white/70">
                                                            {renderFormatted(a)}
                                                        </div>
                                                    </div>
                                                )}
                                                {c && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-semibold">
                                                            共感できる場面
                                                        </div>
                                                        <div className="text-sm text-black/70 dark:text-white/70">
                                                            {renderFormatted(c)}
                                                        </div>
                                                    </div>
                                                )}
                                                {e && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-semibold">
                                                            科学的根拠
                                                        </div>
                                                        <div className="text-sm text-black/70 dark:text-white/70">
                                                            {renderFormatted(e)}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                                        <ProgressiveImage
                                            alt="scene"
                                            src={sceneUrl}
                                            className="w-full aspect-video"
                                            skeletonClassName="w-full aspect-video"
                                            imgClassName="w-full object-cover"
                                            progressKey={sceneKey}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </Section>
        </div>
    );
}
