import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StoryTabs from "@/components/StoryTabs";
import { MessageSquare, Brain, BookOpenText } from "lucide-react";

export default function Home() {
  return (
    <div className="pb-20">
      <Section className="pt-20">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            性格タイプが、<span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">主人公</span>になる
          </h1>
          <p className="text-black/70 dark:text-white/70 text-base md:text-lg">
            シンプルな対話で、AIがあなたの物語をプロデュース。読むのは、あなた自身。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/chat"><Button size="lg">今すぐはじめる</Button></Link>
            <Link href="#features"><Button variant="secondary" size="lg">特徴を見る</Button></Link>
          </div>
        </div>
      </Section>
      <Section id="features" className="animate-slide-up">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4"/> 会話で診断</h3>
              <p className="text-sm text-black/70 dark:text-white/70">MBTIの4軸ごとに1問ずつ。最大5往復で完了。</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Brain className="h-4 w-4"/> タイプ推定</h3>
              <p className="text-sm text-black/70 dark:text-white/70">会話からE/I, S/N, T/F, J/Pを推定し、タイプを算出。</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpenText className="h-4 w-4"/> 物語生成</h3>
              <p className="text-sm text-black/70 dark:text-white/70">あなたのタイプに合わせた400〜600文字の短編を生成。</p>
            </CardBody>
          </Card>
        </div>
      </Section>
      <Section id="examples">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">質問の例</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardBody>
              <div className="text-sm font-medium mb-1">E/I 外向・内向</div>
              <p className="text-sm text-black/70 dark:text-white/70">社交の場で、まず自分から話しかけることが多いですか？</p>
            </CardBody></Card>
            <Card><CardBody>
              <div className="text-sm font-medium mb-1">S/N 感覚・直観</div>
              <p className="text-sm text-black/70 dark:text-white/70">新しいことを学ぶとき、具体例から入りますか？それとも概念から考えますか？</p>
            </CardBody></Card>
            <Card><CardBody>
              <div className="text-sm font-medium mb-1">T/F 思考・感情</div>
              <p className="text-sm text-black/70 dark:text-white/70">大事な選択で、論理と気持ちのどちらをより重視しますか？</p>
            </CardBody></Card>
          </div>
        </div>
      </Section>
      <Section id="types">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">MBTIタイプの例</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              ["INFP","理想を追う詩人"], ["INFJ","洞察の導き手"], ["ENFP","情熱の探求者"], ["ISTJ","誠実な管理者"],
              ["INTJ","戦略の建築家"], ["ENTP","発想の挑戦者"], ["ISFJ","献身的な守護者"], ["ESFP","陽気な表現者"],
              ["ISTP","静かな職人"], ["ENFJ","共感のリーダー"], ["ISFP","柔らかな芸術家"], ["ESTJ","現実的な統率者"],
              ["ESFJ","思いやりの調整者"], ["INTP","論理の探究者"], ["ENTJ","果断の統括者"], ["ESTP","行動派の冒険者"],
            ].map(([t, title]) => (
              <div key={t} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur-md px-3 py-2 text-center">
                <div className="text-sm font-medium">{t}</div>
                <div className="text-[11px] text-black/60 dark:text-white/60">{title}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section id="sample-story">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">ストーリー生成例</h2>
          <StoryTabs />
        </div>
      </Section>
      <Section>
        <div className="mx-auto max-w-5xl">
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-center md:text-left">
                  <div className="text-base md:text-lg font-semibold">もっと深く知るなら、詳細診断</div>
                  <div className="text-xs md:text-sm text-black/60 dark:text-white/60">30問でMBTI＋Big Fiveを推定し、あなたの物語をより精密に。</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/detail"><Button size="lg">詳細診断を見る</Button></Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Section>
      <Section id="how">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">はじめ方（3ステップ）</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardBody><div className="text-2xl font-semibold mb-2">1</div><div className="text-sm">チャットで質問に答える（約5往復）</div></CardBody></Card>
            <Card><CardBody><div className="text-2xl font-semibold mb-2">2</div><div className="text-sm">タイプ推定と要約を確認</div></CardBody></Card>
            <Card><CardBody><div className="text-2xl font-semibold mb-2">3</div><div className="text-sm">あなたの短編物語を読む・共有する</div></CardBody></Card>
          </div>
        </div>
      </Section>
      <Section>
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold">さっそく、あなたの物語を。</h2>
          <div className="flex items-center justify-center gap-3">
            <Link href="/chat"><Button size="lg">簡易診断をはじめる</Button></Link>
            <Link href="/detail"><Button variant="secondary" size="lg">詳細診断を見る</Button></Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
