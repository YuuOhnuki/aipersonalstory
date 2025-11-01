'use client';
import { useEffect, useState, useRef } from 'react';
import type React from 'react';
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
import ProgressiveImage from '@/components/ui/ProgressiveImage';

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
    const [openShare, setOpenShare] = useState(false);
    const shareRef = useRef<HTMLDivElement | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!openShare) return;
        function onDocClick(e: MouseEvent) {
            const el = shareRef.current;
            if (!el) return;
            if (e.target instanceof Node && !el.contains(e.target)) {
                setOpenShare(false);
            }
        }
        document.addEventListener('mousedown', onDocClick, true);
        return () =>
            document.removeEventListener('mousedown', onDocClick, true);
    }, [openShare]);

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

    function renderFormatted(text: string) {
        const lines = String(text || '').split(/\r?\n/);
        const items: string[] = [];
        const blocks: React.ReactNode[] = [];
        function flushList() {
            if (items.length) {
                blocks.push(
                    <ul
                        className="list-disc pl-6 space-y-1"
                        key={`ul-${blocks.length}`}
                    >
                        {items.map((t, i) => (
                            <li key={i}>{renderInline(t)}</li>
                        ))}
                    </ul>
                );
                items.length = 0;
            }
        }
        function renderInline(s: string) {
            const parts: React.ReactNode[] = [];
            const boldRe = /\*\*([^*]+)\*\*/g;
            let lastIndex = 0;
            let m: RegExpExecArray | null;
            while ((m = boldRe.exec(s))) {
                const before = s.slice(lastIndex, m.index);
                if (before) parts.push(before);
                parts.push(<strong key={`${m.index}-${m[1]}`}>{m[1]}</strong>);
                lastIndex = m.index + m[0].length;
            }
            const after = s.slice(lastIndex);
            if (after) parts.push(after);
            return <>{parts}</>;
        }
        for (const line of lines) {
            const l = line.trimEnd();
            if (/^[-•]\s+/.test(l)) {
                items.push(l.replace(/^[-•]\s+/, ''));
            } else if (l === '') {
                flushList();
            } else {
                flushList();
                blocks.push(
                    <p className="mb-2" key={`p-${blocks.length}`}>
                        {renderInline(l)}
                    </p>
                );
            }
        }
        flushList();
        return <div className="space-y-2">{blocks}</div>;
    }

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
                                    {(() => {
                                        const meta: any =
                                            (result as any)._meta || {};
                                        const flags: string[] = [];
                                        if (meta.axes?.fallback)
                                            flags.push(
                                                'タイプ推定: フォールバック'
                                            );
                                        if (meta.story?.fallback)
                                            flags.push(
                                                'ストーリー: フォールバック'
                                            );
                                        if (meta.features?.fallback)
                                            flags.push('特徴: フォールバック');
                                        if (meta.reasons?.fallback)
                                            flags.push('理由: フォールバック');
                                        if (meta.advice?.fallback)
                                            flags.push(
                                                'アドバイス: フォールバック'
                                            );
                                        if (!flags.length) return null;
                                        return (
                                            <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-md px-2 py-1 inline-flex flex-wrap gap-2">
                                                {flags.map((f) => (
                                                    <span key={f}>{f}</span>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                    {result && (result as any).insights && (
                                        <div className="animate-slide-right">
                                            <div className="text-sm font-semibold mb-2">
                                                追加の性格分析（チャットから）
                                            </div>
                                            <div className="text-sm whitespace-pre-wrap text-black/70 dark:text-white/70">
                                                {(result as any).insights}
                                            </div>
                                        </div>
                                    )}
                                    {(() => {
                                        const DEBUG =
                                            process.env.NEXT_PUBLIC_DEBUG ===
                                            'true';
                                        if (!DEBUG) return null;
                                        const meta: any =
                                            (result as any)._meta || {};
                                        const dbg = meta.axes?.debug;
                                        if (!dbg) return null;
                                        return (
                                            <div className="text-[11px] rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-2 space-y-2">
                                                <div className="font-medium">
                                                    デバッグ:
                                                    簡易診断アルゴリズム
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <div>
                                                        方式:{' '}
                                                        {String(
                                                            dbg.algorithm || ''
                                                        )}
                                                    </div>
                                                    {dbg.scores && (
                                                        <div className="md:col-span-2 flex flex-wrap gap-2">
                                                            {Object.entries(
                                                                dbg.scores
                                                            ).map(
                                                                ([
                                                                    k,
                                                                    v,
                                                                ]: any) => (
                                                                    <span
                                                                        key={k}
                                                                        className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10"
                                                                    >
                                                                        {k}:
                                                                        {String(
                                                                            v
                                                                        )}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {dbg.raw_preview && (
                                                    <div className="text-[11px] text-black/70 dark:text-white/70">
                                                        AI出力プレビュー:{' '}
                                                        {String(
                                                            dbg.raw_preview
                                                        )}
                                                    </div>
                                                )}
                                                {Array.isArray(dbg.matches) &&
                                                    dbg.matches.length > 0 && (
                                                        <div className="space-y-1">
                                                            <div className="text-[11px]">
                                                                一致ルール
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                {dbg.matches.map(
                                                                    (
                                                                        m: any,
                                                                        i: number
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="text-[11px] bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded px-2 py-1"
                                                                        >
                                                                            <span className="mr-2">
                                                                                {
                                                                                    m.axis
                                                                                }
                                                                            </span>
                                                                            <span className="mr-2">
                                                                                Δ
                                                                                {String(
                                                                                    m.delta
                                                                                )}
                                                                            </span>
                                                                            <span className="mr-2">
                                                                                {String(
                                                                                    m.matched ||
                                                                                        ''
                                                                                )}
                                                                            </span>
                                                                            <span className="opacity-60">
                                                                                {String(
                                                                                    m.pattern
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const keyBase = String(
                                            (result as any).result_id ||
                                                sessionId ||
                                                ''
                                        );
                                        const avatarKey = `avatar:${keyBase}`;
                                        return (
                                            <div className="w-full flex items-center justify-center animate-zoom-in">
                                                <ProgressiveImage
                                                    alt="avatar"
                                                    src={`/api/image/avatar?id=${encodeURIComponent(keyBase)}&k=${encodeURIComponent(avatarKey)}`}
                                                    className="h-24 w-24"
                                                    skeletonClassName="h-24 w-24"
                                                    imgClassName="h-24 w-24 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm object-cover"
                                                    progressKey={avatarKey}
                                                />
                                            </div>
                                        );
                                    })()}
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
                                        <div className="animate-slide-left space-y-4">
                                            {(() => {
                                                const adviceText = String(
                                                    result.advice || ''
                                                );
                                                const pick = (
                                                    label: string
                                                ) => {
                                                    const re = new RegExp(
                                                        `【${label}】[\t\x20]*[\r\n]+([\s\S]*?)(?=(?:\r?\n){2}【|$)`
                                                    );
                                                    const m =
                                                        adviceText.match(re);
                                                    return m?.[1]?.trim() || '';
                                                };
                                                const a = pick('アドバイス');
                                                const c = pick('あるある');
                                                const e = pick('科学的根拠');
                                                return (
                                                    <>
                                                        {a && (
                                                            <div>
                                                                <div className="text-sm font-semibold mb-2">
                                                                    日常で役立つアドバイス
                                                                </div>
                                                                <div className="text-sm text-black/70 dark:text-white/70">
                                                                    {renderFormatted(
                                                                        a
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {c && (
                                                            <div>
                                                                <div className="text-sm font-semibold mb-2">
                                                                    共感できる場面
                                                                </div>
                                                                <div className="text-sm text-black/70 dark:text-white/70">
                                                                    {renderFormatted(
                                                                        c
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {e && (
                                                            <div>
                                                                <div className="text-sm font-semibold mb-2">
                                                                    科学的根拠
                                                                </div>
                                                                <div className="text-sm text-black/70 dark:text-white/70">
                                                                    {renderFormatted(
                                                                        e
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!a && !c && !e && (
                                                            <div>
                                                                <div className="text-sm font-semibold mb-2">
                                                                    日常で役立つアドバイス
                                                                </div>
                                                                <div className="text-sm text-black/70 dark:text-white/70">
                                                                    {renderFormatted(
                                                                        adviceText
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {(() => {
                                        const keyBase = String(
                                            (result as any).result_id ||
                                                sessionId ||
                                                ''
                                        );
                                        const sceneKey = `scene:${keyBase}`;
                                        return (
                                            <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 animate-zoom-in">
                                                <ProgressiveImage
                                                    alt="scene"
                                                    src={`/api/image/scene?id=${encodeURIComponent(keyBase)}&k=${encodeURIComponent(sceneKey)}`}
                                                    className="w-full"
                                                    skeletonClassName="w-full aspect-video"
                                                    imgClassName="w-full object-cover"
                                                    progressKey={sceneKey}
                                                />
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const id = String(
                                            (result as any).result_id ||
                                                sessionId ||
                                                ''
                                        );
                                        const origin =
                                            typeof window !== 'undefined'
                                                ? window.location.origin
                                                : '';
                                        const shareUrl = `${origin}/share/${encodeURIComponent(id)}`;
                                        const rType = result?.type || 'MB';
                                        const rTitle = result?.title || '';
                                        const rSummaryOrStory = (
                                            result?.summary ||
                                            result?.story ||
                                            ''
                                        ).toString();
                                        const shareText = `私のMBTIは${rType}（${rTitle}）。Synchronautsで診断してみよう！`;
                                        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
                                        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                                        async function handleShareInstagramStory() {
                                            try {
                                                const width = 1080;
                                                const height = 1920;
                                                const canvas =
                                                    document.createElement(
                                                        'canvas'
                                                    );
                                                canvas.width = width;
                                                canvas.height = height;
                                                const ctx =
                                                    canvas.getContext('2d');
                                                if (!ctx) return;

                                                // Background gradient
                                                const grad =
                                                    ctx.createLinearGradient(
                                                        0,
                                                        0,
                                                        0,
                                                        height
                                                    );
                                                grad.addColorStop(0, '#111827');
                                                grad.addColorStop(1, '#312e81');
                                                ctx.fillStyle = grad;
                                                ctx.fillRect(
                                                    0,
                                                    0,
                                                    width,
                                                    height
                                                );

                                                // Load avatar
                                                const avatar = new Image();
                                                avatar.crossOrigin =
                                                    'anonymous';
                                                avatar.src = `/api/image/avatar?id=${encodeURIComponent(id)}&k=${encodeURIComponent('avatar:' + id)}`;
                                                await new Promise(
                                                    (res, rej) => {
                                                        avatar.onload = () =>
                                                            res(null);
                                                        avatar.onerror = rej;
                                                    }
                                                );

                                                // Draw avatar circle at top
                                                const avSize = 420;
                                                const avX =
                                                    (width - avSize) / 2;
                                                const avY = 180;
                                                ctx.save();
                                                ctx.beginPath();
                                                ctx.arc(
                                                    width / 2,
                                                    avY + avSize / 2,
                                                    avSize / 2,
                                                    0,
                                                    Math.PI * 2
                                                );
                                                ctx.closePath();
                                                ctx.clip();
                                                ctx.drawImage(
                                                    avatar,
                                                    avX,
                                                    avY,
                                                    avSize,
                                                    avSize
                                                );
                                                ctx.restore();

                                                // MBTI text center
                                                ctx.fillStyle = '#ffffff';
                                                ctx.textAlign = 'center';
                                                // Type
                                                ctx.font =
                                                    'bold 140px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans JP", sans-serif';
                                                ctx.fillText(
                                                    rType,
                                                    width / 2,
                                                    820
                                                );

                                                // Title or 30-char summary of story
                                                const baseText =
                                                    rSummaryOrStory;
                                                const short = baseText.slice(
                                                    0,
                                                    30
                                                );
                                                ctx.font =
                                                    '600 48px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans JP", sans-serif';
                                                ctx.fillStyle =
                                                    'rgba(255,255,255,0.9)';
                                                // Multi-line wrap at ~22 chars per line
                                                const maxWidth = width * 0.8;
                                                const lines: string[] = [];
                                                let current = '';
                                                const wrapAt = 22;
                                                for (
                                                    let i = 0;
                                                    i < short.length;
                                                    i++
                                                ) {
                                                    current += short[i];
                                                    if (
                                                        current.length >= wrapAt
                                                    ) {
                                                        lines.push(current);
                                                        current = '';
                                                    }
                                                }
                                                if (current)
                                                    lines.push(current);
                                                let y = 900;
                                                for (const line of lines) {
                                                    ctx.fillText(
                                                        line,
                                                        width / 2,
                                                        y,
                                                        maxWidth
                                                    );
                                                    y += 64;
                                                }

                                                // Bottom link
                                                const linkText = `${origin.replace(/^https?:\/\//, '')}/share/${id}`;
                                                ctx.font =
                                                    '500 40px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans JP", sans-serif';
                                                ctx.fillStyle =
                                                    'rgba(255,255,255,0.85)';
                                                ctx.fillText(
                                                    linkText,
                                                    width / 2,
                                                    height - 120
                                                );

                                                const blob: Blob | null =
                                                    await new Promise(
                                                        (resolve) =>
                                                            canvas.toBlob(
                                                                (b) =>
                                                                    resolve(b),
                                                                'image/png',
                                                                0.95
                                                            )
                                                    );
                                                if (!blob) return;
                                                const file = new File(
                                                    [blob],
                                                    'story.png',
                                                    { type: 'image/png' }
                                                );

                                                if (
                                                    navigator.canShare &&
                                                    navigator.canShare({
                                                        files: [file],
                                                    })
                                                ) {
                                                    await navigator.share({
                                                        title: 'Synchronauts',
                                                        text: `${rType} - ${rTitle}`,
                                                        files: [file],
                                                    });
                                                    setOpenShare(false);
                                                    return;
                                                }
                                                // Fallback: download
                                                const url =
                                                    URL.createObjectURL(blob);
                                                const a =
                                                    document.createElement('a');
                                                a.href = url;
                                                a.download = 'story.png';
                                                document.body.appendChild(a);
                                                a.click();
                                                a.remove();
                                                URL.revokeObjectURL(url);
                                                setToast(
                                                    '画像をダウンロードしました。Instagramでストーリーに追加してください'
                                                );
                                                setTimeout(
                                                    () => setToast(null),
                                                    2200
                                                );
                                            } catch {
                                                setToast(
                                                    'ストーリー画像の作成に失敗しました'
                                                );
                                                setTimeout(
                                                    () => setToast(null),
                                                    2000
                                                );
                                            }
                                        }
                                        return (
                                            <div className="flex items-center justify-between pt-2">
                                                <div
                                                    className="relative"
                                                    ref={shareRef}
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            setOpenShare(
                                                                (v) => !v
                                                            )
                                                        }
                                                    >
                                                        結果を共有
                                                    </Button>
                                                    {openShare && (
                                                        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/60 shadow-lg backdrop-blur-md p-3">
                                                            <div className="text-xs font-medium mb-2 text-black/70 dark:text-white/70">
                                                                共有先を選択
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <a
                                                                    href={xUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="group flex flex-col items-center gap-1"
                                                                >
                                                                    <div className="h-10 w-10 rounded-full bg-black text-white grid place-items-center group-hover:opacity-90">
                                                                        {/* X (Simple Icons) */}
                                                                        <svg
                                                                            viewBox="0 0 24 24"
                                                                            width="18"
                                                                            height="18"
                                                                            fill="currentColor"
                                                                            aria-hidden
                                                                        >
                                                                            <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-[10px] text-black/70 dark:text-white/70">
                                                                        X
                                                                    </span>
                                                                </a>
                                                                <a
                                                                    href={
                                                                        lineUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="group flex flex-col items-center gap-1"
                                                                >
                                                                    <div className="h-10 w-10 rounded-full bg-[#06C755] text-white grid place-items-center group-hover:opacity-90">
                                                                        {/* LINE (Simple Icons) */}
                                                                        <svg
                                                                            viewBox="0 0 24 24"
                                                                            width="18"
                                                                            height="18"
                                                                            fill="currentColor"
                                                                            aria-hidden
                                                                        >
                                                                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-[10px] text-black/70 dark:text-white/70">
                                                                        LINE
                                                                    </span>
                                                                </a>
                                                                <button
                                                                    onClick={
                                                                        handleShareInstagramStory
                                                                    }
                                                                    className="group flex flex-col items-center gap-1"
                                                                >
                                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-40% to-[#bc1888] text-white grid place-items-center group-hover:opacity-90">
                                                                        {/* Instagram (Simple Icons) */}
                                                                        <svg
                                                                            viewBox="0 0 24 24"
                                                                            width="18"
                                                                            height="18"
                                                                            fill="currentColor"
                                                                            aria-hidden
                                                                        >
                                                                            <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-[10px] text-black/70 dark:text-white/70">
                                                                        Instagram
                                                                    </span>
                                                                </button>
                                                            </div>
                                                            <div className="mt-3">
                                                                <Button
                                                                    variant="secondary"
                                                                    fullWidth
                                                                    onClick={() => {
                                                                        try {
                                                                            navigator.clipboard.writeText(
                                                                                shareUrl
                                                                            );
                                                                            setToast(
                                                                                '共有用URLをコピーしました'
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    setToast(
                                                                                        null
                                                                                    ),
                                                                                1800
                                                                            );
                                                                        } catch {}
                                                                    }}
                                                                >
                                                                    共有用URLをコピー
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <Link href="/chat">
                                                    <Button variant="secondary">
                                                        チャットに戻る
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </Section>
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <div className="rounded-lg bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm shadow-lg">
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
