import type { Metadata } from 'next';
import { dbGetMbtiResultByAny } from '@/server/db';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import ProgressiveImage from '@/components/ui/ProgressiveImage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ resultId: string }>;
}): Promise<Metadata> {
    const p = await params;
    const row = await dbGetMbtiResultByAny(p.resultId);
    const type = row?.type || 'MB';
    const title = row?.title || 'Synchronauts 共有';
    const avatarUrl = `/api/image/avatar?id=${encodeURIComponent(p.resultId)}`;
    return {
        title: `共有 - ${type}`,
        openGraph: {
            title: `共有 - ${type}`,
            images: [{ url: avatarUrl, width: 800, height: 800 }],
        },
        twitter: {
            card: 'summary_large_image',
            images: [avatarUrl],
        },
    };
}

export default async function ShareResultPage({
    params,
}: {
    params: Promise<{ resultId: string }>;
}) {
    const p = await params;
    const row = await dbGetMbtiResultByAny(p.resultId);

    if (!row) {
        return (
            <div className="pb-20">
                <Section className="pt-10">
                    <div className="mx-auto max-w-3xl">
                        <Card>
                            <CardBody>
                                <div className="text-sm text-black/70 dark:text-white/70">
                                    共有対象の結果が見つかりませんでした。
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </Section>
            </div>
        );
    }

    const keyBase = String(row.result_id || p.resultId);
    const avatarKey = `avatar:${keyBase}`;
    const sceneKey = `scene:${keyBase}`;

    return (
        <div className="pb-20">
            <Section className="pt-10">
                <div className="mx-auto max-w-3xl space-y-5">
                    <Card>
                        <CardBody>
                            <div className="w-full flex items-center justify-center">
                                <ProgressiveImage
                                    alt="avatar"
                                    src={`/api/image/avatar?id=${encodeURIComponent(keyBase)}&k=${encodeURIComponent(avatarKey)}`}
                                    className="h-24 w-24"
                                    skeletonClassName="h-24 w-24"
                                    imgClassName="h-24 w-24 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm object-cover"
                                    progressKey={avatarKey}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 leading-7 whitespace-pre-wrap">
                                {row.story || ''}
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                                <ProgressiveImage
                                    alt="scene"
                                    src={`/api/image/scene?id=${encodeURIComponent(keyBase)}&k=${encodeURIComponent(sceneKey)}`}
                                    className="w-full"
                                    skeletonClassName="w-full aspect-video"
                                    imgClassName="w-full object-cover"
                                    progressKey={sceneKey}
                                />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </Section>
        </div>
    );
}
