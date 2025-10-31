import type { Metadata } from "next";
import { dbGetDetailResult } from "@/server/db";
import { Section } from "@/components/ui/Section";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { sessionId: string } }): Promise<Metadata> {
  const row = dbGetDetailResult(params.sessionId);
  const type = row?.mbti_type || "MB";
  const title = "詳細診断 結果";
  const avatarUrl = `/api/image/avatar?type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`;
  return {
    title: `${title} - ${type}`,
    openGraph: {
      title: `${title} - ${type}`,
      images: [{ url: avatarUrl, width: 800, height: 800 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [avatarUrl],
    },
  };
}

export default function DetailResultPage({ params }: { params: { sessionId: string } }) {
  const row = dbGetDetailResult(params.sessionId);
  if (!row) {
    return (
      <div className="pb-20">
        <Section className="pt-10">
          <div className="mx-auto max-w-3xl">
            <Card><CardBody>
              <div className="text-sm">結果が見つかりませんでした。</div>
              <div className="mt-3"><Link href="/detail/take"><Button>詳細診断へ戻る</Button></Link></div>
            </CardBody></Card>
          </div>
        </Section>
      </div>
    );
  }

  const avatarUrl = row.avatar_url || `/api/image/avatar?type=${encodeURIComponent(row.mbti_type || "MB")}&title=${encodeURIComponent("詳細診断")}`;
  const sceneUrl = row.scene_url || `/api/image/scene?type=${encodeURIComponent(row.mbti_type || "MB")}&title=${encodeURIComponent("詳細診断")}`;

  return (
    <div className="pb-20">
      <Section className="pt-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">詳細診断 結果</h1>
                <div className="flex items-center gap-2">
                  <Link href="/history"><Button variant="secondary" size="sm">履歴</Button></Link>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="space-y-5 animate-fade-in">
                <div className="w-full flex items-center justify-center">
                  <img alt="avatar" src={avatarUrl} className="h-24 w-24 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm object-cover"/>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold tracking-tight">{row.mbti_type}</span>
                  <span className="text-black/60 dark:text-white/60">詳細診断</span>
                </div>

                {/* 性格の特徴セクション */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold">性格の特徴</div>
                  <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 text-sm">
                    <div className="grid grid-cols-2 gap-2 text-black/70 dark:text-white/70">
                      <div>Openness: {row.openness}</div>
                      <div>Conscientiousness: {row.conscientiousness}</div>
                      <div>Extraversion: {row.extraversion}</div>
                      <div>Agreeableness: {row.agreeableness}</div>
                      <div>Neuroticism: {row.neuroticism}</div>
                      <div>StressTolerance: {row.stressTolerance}</div>
                      <div>Adaptability: {row.adaptability}</div>
                      <div>ValueFlexibility: {row.valueFlexibility}</div>
                    </div>
                    <div className="mt-3 text-sm text-black/70 dark:text-white/70 whitespace-pre-wrap">{row.summaryText}</div>
                  </div>
                </div>

                {/* AIによるストーリー生成セクション */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold">AIによるストーリー生成</div>
                  <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 text-sm leading-7 whitespace-pre-wrap">
                    {row.story}
                  </div>
                  {row.advice && (
                    <div>
                      <div className="text-sm font-semibold mb-2">日常で役立つアドバイス</div>
                      <div className="text-sm whitespace-pre-wrap text-black/70 dark:text-white/70">{row.advice}</div>
                    </div>
                  )}
                  <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                    <img alt="scene" src={sceneUrl} className="w-full object-cover"/>
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
