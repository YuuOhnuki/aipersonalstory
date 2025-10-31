'use client';

import React from 'react';

type Props = {
    src: string;
    alt: string;
    className?: string;
    skeletonClassName?: string;
    imgClassName?: string;
    progressKey?: string;
};

export default function ProgressiveImage({
    src,
    alt,
    className,
    skeletonClassName,
    imgClassName,
    progressKey,
}: Props) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [logs, setLogs] = React.useState<string[]>([]);
    const startRef = React.useRef<number>(0);
    const timerRef = React.useRef<any>(null);
    const [elapsed, setElapsed] = React.useState(0);
    const pollRef = React.useRef<any>(null);

    React.useEffect(() => {
        setLoading(true);
        setError(null);
        setLogs(['画像リクエスト開始']);
        startRef.current = Date.now();
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 1000);
        if (progressKey) {
            // start polling server progress
            const poll = async () => {
                try {
                    const res = await fetch(
                        `/api/image/progress?key=${encodeURIComponent(progressKey)}`,
                        { cache: 'no-store' }
                    );
                    if (res.ok) {
                        const p = await res.json();
                        if (p?.status === 'submitted') {
                            setLogs((l) => [
                                ...l,
                                `キュー投入: id=${p.id || ''}`,
                            ]);
                        } else if (p?.status === 'checking') {
                            setLogs((l) => [
                                ...l,
                                `進捗確認: polls=${p.polls ?? 0}`,
                            ]);
                        } else if (p?.status === 'done') {
                            setLogs((l) => [
                                ...l,
                                `完了(サーバー): 待機${p.waitedSecs ?? 0}s, ポーリング${p.polls ?? 0}回`,
                            ]);
                        }
                    }
                } catch {}
            };
            pollRef.current = setInterval(poll, 1500);
            // initial tick sooner
            poll();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [src, progressKey]);

    const handleLoad = () => {
        setLoading(false);
        setLogs((l) => [
            ...l,
            `完了: ${Math.floor((Date.now() - startRef.current) / 1000)}s`,
        ]);
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
    };
    const handleError = () => {
        setLoading(false);
        setError('画像の取得に失敗しました');
        setLogs((l) => [...l, 'エラー発生']);
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
    };

    React.useEffect(() => {
        if (loading) {
            setLogs((l) =>
                l[l.length - 1]?.startsWith('待機')
                    ? l
                    : [...l, '待機中（サーバー応答待ち）...']
            );
        }
    }, [loading]);

    return (
        <div className={className}>
            {loading && (
                <div
                    className={`relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 ${skeletonClassName || ''}`}
                >
                    <div className="animate-pulse w-full h-full" />
                    <div className="absolute inset-x-2 bottom-2 text-[11px] text-black/60 dark:text-white/60 space-y-0.5">
                        <div>画像生成中... {elapsed}s</div>
                    </div>
                </div>
            )}
            <img
                alt={alt}
                src={src}
                onLoad={handleLoad}
                onError={handleError}
                className={`${imgClassName || ''} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            />
            {!loading && (error || logs.length > 0) && (
                <div className="mt-2 text-[11px] text-black/50 dark:text-white/50 space-y-0.5">
                    {error ? (
                        <div className="text-rose-600 dark:text-rose-400">
                            {error}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
