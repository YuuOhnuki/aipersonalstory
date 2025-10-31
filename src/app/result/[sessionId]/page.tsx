import type { Metadata } from 'next';
import ResultView from '../ResultView';
import { dbGetMbtiResultByAny } from "@/server/db";
import { redirect } from 'next/navigation';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
    const p = await params;
    const row = await dbGetMbtiResultByAny(p.sessionId);
    const type = row?.type || 'MB';
    const title = row?.title || 'AI Personality Story 結果';
    const avatarUrl = `/api/image/avatar?type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`;
    return {
        title: `結果 - ${type}`,
        openGraph: {
            title: `結果 - ${type}`,
            images: [{ url: avatarUrl, width: 800, height: 800 }],
        },
        twitter: {
            card: 'summary_large_image',
            images: [avatarUrl],
        },
    };
}

export default async function ResultSessionPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const p = await params;
    const row = await dbGetMbtiResultByAny(p.sessionId);
    // Prefer stable result_id in URL
    if (row && row.result_id && row.result_id !== p.sessionId) {
        redirect(`/result/${encodeURIComponent(row.result_id)}`);
    }
    if (!row) {
        return (
            <div className="pb-20">
                <Section className="pt-10">
                    <div className="mx-auto max-w-3xl">
                        <Card>
                            <CardBody>
                                <div className="space-y-3">
                                    <div className="text-base font-semibold">結果がまだありません</div>
                                    <div className="text-sm text-black/70 dark:text-white/70">簡易診断または詳細診断を実行して、結果を生成してください。</div>
                                    <div className="flex gap-2 pt-2">
                                        <Link href="/chat"><Button>簡易診断を始める</Button></Link>
                                        <Link href="/detail/take"><Button variant="secondary">詳細診断を始める</Button></Link>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </Section>
            </div>
        );
    }
    return <ResultView initialSessionId={p.sessionId} />;
}
