import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function DetailLanding() {
  return (
    <div className="pb-20">
      <Section className="pt-16">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">詳細性格診断</h1>
          <p className="text-black/70 dark:text-white/70">30問の回答からMBTI＋Big Fiveを推定し、あなたの物語を生成します（5〜10分）。</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/detail/take"><Button size="lg">診断を開始</Button></Link>
            <Link href="/chat"><Button variant="secondary" size="lg">簡易診断へ</Button></Link>
          </div>
        </div>
      </Section>
      <Section>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardBody><h3 className="font-semibold mb-2">MBTI＋Big Five</h3><p className="text-sm text-black/70 dark:text-white/70">16タイプと5次元特性を可視化します。</p></CardBody></Card>
          <Card><CardBody><h3 className="font-semibold mb-2">物語生成</h3><p className="text-sm text-black/70 dark:text-white/70">あなたらしさを反映した短編を生成します。</p></CardBody></Card>
        </div>
      </Section>
    </div>
  );
}
