"use client";
import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";

const STORIES: Record<string, { title: string; body: string }> = {
  INFP: {
    title: "理想を追う詩人",
    body:
      "静かな朝、あなたはふと立ち止まり、自分の歩幅で進むことを選ぶ。遠回りに見える道の先で、小さな光が確かに息づいていることに気づく。誰かの期待ではなく、あなたの大切にしたいものへ手を伸ばしたとき、景色は少しだけ澄んで見えた。迷いも弱さも抱えたまま、それでも前へ進む。その静かな決意が、まだ言葉にならない物語をそっと温めていく。",
  },
  ISTJ: {
    title: "誠実な管理者",
    body:
      "書斎の机には、几帳面に並んだ手帳と鉛筆。計画通りに進む日々の中で、ふと予定外の誘いが届く。心は揺れるが、あなたは静かに立ち上がる。積み上げてきた信頼があるから、未知の一歩も揺るぎなく踏み出せる。",
  },
  ENFP: {
    title: "情熱の探求者",
    body:
      "混雑した街角、ひらめきは突然の春風のようにあなたの頬を撫でる。可能性の地図は折り目だらけでも、そこに描かれた線はどこまでも伸びていく。誰かの笑顔と新しい物語が、今日もあなたを連れ出す。",
  },
};

export default function StoryTabs() {
  const types = Object.keys(STORIES);
  const [active, setActive] = useState<string>(types[0]);
  const s = STORIES[active];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={[
              "px-3 py-1 rounded-full border text-xs",
              active === t
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white/70 dark:bg-white/10 border-black/10 dark:border-white/10",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>
      <Card>
        <CardBody>
          <div className="text-xs text-black/60 dark:text-white/60 mb-2">例）{active} / {s.title}</div>
          <div className="text-sm leading-7">{s.body}</div>
        </CardBody>
      </Card>
    </div>
  );
}
