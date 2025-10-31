import type { Metadata } from 'next';
import ResultView from './ResultView';
import { dbGetMbtiResult } from '@/server/db';

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
    const sp = await searchParams;
    const sessionId =
        typeof sp?.sessionId === 'string' ? sp.sessionId : undefined;
    const row = sessionId ? await dbGetMbtiResult(sessionId) : null;
    const type = row?.type || 'MB';
    const title = row?.title || 'AI Personality Story 結果';
    const imageUrl = `/api/image/scene?type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`;
    return {
        title: `結果 - ${type}`,
        openGraph: {
            title: `結果 - ${type}`,
            images: [{ url: imageUrl, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            images: [imageUrl],
        },
    };
}

export default async function ResultPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const sessionId = typeof sp?.sessionId === 'string' ? sp.sessionId : null;
    return <ResultView initialSessionId={sessionId} />;
}
