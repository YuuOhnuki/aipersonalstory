import { NextResponse } from "next/server";

export const runtime = "nodejs";

export type Question = {
  id: string;
  section: "MBTI" | "BIGFIVE" | "SUPPLEMENT" | "OPEN";
  axis?: string;
  text: string;
  type: "scale" | "text";
  weight?: number;
};

const q = (id: string, section: Question["section"], text: string, axis?: string, weight?: number): Question => ({ id, section, text, axis, type: section === "OPEN" ? "text" : "scale", weight });

const QUESTIONS: Question[] = [
  // MBTI A1-A8
  q("A1", "MBTI", "社交の場で、まず自分から話しかけることが多いですか？", "E-I", 1.0),
  q("A2", "MBTI", "情報を得るとき、五感を重視しますか？（直感よりも）", "S-N", 1.0),
  q("A3", "MBTI", "意思決定をするとき、論理を優先しますか？", "T-F", 1.0),
  q("A4", "MBTI", "計画を立てて進める方が安心ですか？", "J-P", 1.0),
  q("A5", "MBTI", "新しい人に会ったとき、すぐ話しかけますか？", "E-I", 0.8),
  q("A6", "MBTI", "抽象的な意味を想像する方ですか？", "S-N", 0.8),
  q("A7", "MBTI", "他人の悩みを聞いたとき、解決策を考える方ですか？", "T-F", 0.8),
  q("A8", "MBTI", "締め切り前に計画的に動く方ですか？", "J-P", 0.8),
  // Big Five B9-B28
  q("B9", "BIGFIVE", "新しいアイデアにワクワクする", "Openness", 1.0),
  q("B10", "BIGFIVE", "芸術・音楽などに感受性が高い", "Openness", 0.8),
  q("B11", "BIGFIVE", "抽象的議論を好む", "Openness", 1.0),
  q("B12", "BIGFIVE", "未知の環境に魅力を感じる", "Openness", 1.0),
  q("B13", "BIGFIVE", "時間通りに行動する", "Conscientiousness", 1.0),
  q("B14", "BIGFIVE", "細部まで注意を払う", "Conscientiousness", 1.0),
  q("B15", "BIGFIVE", "自分の目標を守る", "Conscientiousness", 0.8),
  q("B16", "BIGFIVE", "「今やる」傾向がある", "Conscientiousness", 1.0),
  q("B17", "BIGFIVE", "大人数でエネルギーを得る", "Extraversion", 1.0),
  q("B18", "BIGFIVE", "会話でリードすることが多い", "Extraversion", 1.0),
  q("B19", "BIGFIVE", "初対面に抵抗が少ない", "Extraversion", 0.8),
  q("B20", "BIGFIVE", "活動的時間に満たされる", "Extraversion", 1.0),
  q("B21", "BIGFIVE", "困っている人を助けたくなる", "Agreeableness", 1.0),
  q("B22", "BIGFIVE", "協力を重んじる", "Agreeableness", 1.0),
  q("B23", "BIGFIVE", "他人の気持ちを考慮する", "Agreeableness", 1.0),
  q("B24", "BIGFIVE", "平和的関係を保ちたい", "Agreeableness", 0.8),
  q("B25", "BIGFIVE", "小さなことで落ち込みやすい", "Neuroticism", 1.0),
  q("B26", "BIGFIVE", "自分を立て直すのが難しい", "Neuroticism", 1.0),
  q("B27", "BIGFIVE", "心配が頭から離れない", "Neuroticism", 0.8),
  q("B28", "BIGFIVE", "感情がコントロールできない", "Neuroticism", 1.0),
  // Supplements & Open
  q("C29", "SUPPLEMENT", "環境変化時の行動傾向を自己評価してください", "Adaptability", 1.0),
  q("C30", "SUPPLEMENT", "価値観が衝突したとき優先するのはどちらですか（論理/調和）", "ValueFlexibility", 1.0),
  { id: "C31", section: "OPEN", text: "【自由記述】最近、自分らしさを感じた場面を具体的に教えてください", type: "text", axis: "OpenText", weight: 1.0 },
];

export async function GET() {
  return NextResponse.json({ questions: QUESTIONS });
}
