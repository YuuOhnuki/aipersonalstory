import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/store";
import { generateText } from "@/server/llm";
import { parseAxes, toResult, toType } from "@/server/mbti";
import type { MBTIMap } from "@/types/mbti";
import { dbSaveMbtiResult } from "@/server/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const session = getSession(sessionId);
  if (!session) return NextResponse.json({ error: "session not found" }, { status: 404 });

  const transcript = session.messages
    .map((m) => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`)
    .join("\n");

  // 1) MBTI axis estimation
  const mbtiPrompt = `あなたは心理分析アシスタントです。以下の会話記録から、ユーザーのMBTIを推定してください。\n\n会話記録:\n${transcript}\n\n各軸(E/I, S/N, T/F, J/P)を1つずつ判定し、簡単な理由は書かずに、次のJSONのみを厳密に出力してください:\n{ "E/I": "E or I", "S/N": "S or N", "T/F": "T or F", "J/P": "J or P" }`;

  let axes: MBTIMap | null = null;
  try {
    const out = await generateText(mbtiPrompt, { max_new_tokens: 120, temperature: 0.2 });
    axes = parseAxes(out || "");
  } catch {}

  // Very naive fallback if model unavailable
  if (!axes) {
    // Heuristic from transcript keywords to reduce bias
    const lower = transcript.toLowerCase();
    const score = { ei: 0, sn: 0, tf: 0, jp: 0 };
    const add = (cond: boolean, k: keyof typeof score, v = 1) => { if (cond) score[k] += v; };
    // E/I signals
    add(/友|集まり|話す|人と|イベント|外出/.test(lower), 'ei', +1);
    add(/一人|静か|内省|家で|読書|落ち着く/.test(lower), 'ei', -1);
    // S/N signals
    add(/具体|現実|事実|実務|手順|体験/.test(lower), 'sn', -1);
    add(/概念|可能性|想像|直観|アイデア/.test(lower), 'sn', +1);
    // T/F signals
    add(/論理|効率|公平|ルール|分析/.test(lower), 'tf', +1);
    add(/気持ち|共感|人間関係|優しさ|思いやり/.test(lower), 'tf', -1);
    // J/P signals
    add(/計画|締め切り|整理|先回り|スケジュール/.test(lower), 'jp', +1);
    add(/柔軟|臨機応変|流れ|即興|気分/.test(lower), 'jp', -1);
    axes = {
      "E/I": score.ei >= 0 ? "E" : "I",
      "S/N": score.sn >= 0 ? "N" : "S",
      "T/F": score.tf >= 0 ? "T" : "F",
      "J/P": score.jp >= 0 ? "J" : "P",
    } as MBTIMap;
  }
  const type = toType(axes);

  // 3) Features (common traits)
  let features = "";
  try {
    const fp = `あなたは心理アナリストです。タイプ${type}の一般的な特徴を日本語で3〜5行で箇条書きで説明してください。専門用語は避け、誰にでも分かる言葉にしてください。`;
    const fo = await generateText(fp, { max_new_tokens: 220, temperature: 0.4 });
    features = (fo || "").trim();
  } catch {}
  if (!features) features = `- ${type} の一般的な強みと傾向を分かりやすく表しました。\n- 想像力/計画性/論理/共感などのバランスが日常に現れます。`;

  // 4) Reasons (from transcript)
  let reasons = "";
  try {
    const rp = `あなたは心理アナリストです。次の会話記録から、${type} と判断した根拠を3点、分かりやすい日本語で説明してください。専門用語は避けます。\n会話:\n${transcript}`;
    const ro = await generateText(rp, { max_new_tokens: 260, temperature: 0.5 });
    reasons = (ro || "").trim();
  } catch {}
  if (!reasons) reasons = `- 会話に見られたキーワードや姿勢から、${type} の傾向が読み取れました。`;

  // 5) Advice (practical suggestions)
  let advice = "";
  try {
    const ap = `あなたは心理カウンセラーです。タイプ${type}の人に向けて、日常で役立つ具体的なアドバイスを日本語で4〜6行で提示してください。実践的で優しい言葉にしてください。`;
    const ao = await generateText(ap, { max_new_tokens: 280, temperature: 0.6 });
    advice = (ao || "").trim();
  } catch {}
  if (!advice) advice = `- 小さな一歩を積み重ねて、あなたらしさを大切にする時間を確保しましょう。\n- 負担が大きいときはタスクを細かく分け、助けを求める練習も有効です。`;

  // 2) Story generation (longer, poetic tone)
  const storyPrompt = `あなたは詩人でもある物語作家です。読者の心に余韻を残す日本語の短編を作ってください。\n前提: 主人公の性格タイプは ${type}。\n要件:\n- 詩的で趣のある語り口\n- 感情の余白と静かな比喩を織り込む\n- 一文のリズムに緩急をつけ、呼吸を感じさせる\n- 読みやすさを損なわず、過度な難語は避ける\n- 200〜300文字程度`;

  let story = "";
  try {
    const out2 = await generateText(storyPrompt, { max_new_tokens: 1100, temperature: 0.7 });
    story = (out2 || "").trim();
  } catch {}

  const genericFallback = "了解しました。もう少し詳しく教えてください。";
  if (!story || story.includes(genericFallback)) {
    const typeToStory: Record<string, string> = {
      INFP: "静かな朝、あなたはふと立ち止まり、自分の歩幅で進むことを選ぶ。遠回りに見える道の先で、小さな光が確かに息づいていることに気づく。誰かの期待ではなく、あなたの大切にしたいものへ手を伸ばしたとき、景色は少しだけ澄んで見えた。迷いも弱さも抱えたまま、それでも前へ進む。その静かな決意が、まだ言葉にならない物語をそっと温めていく。",
      ISTJ: "書斎の机には、几帳面に並んだ手帳と鉛筆。計画通りに進む日々の中で、ふと予定外の誘いが届く。心は揺れるが、あなたは静かに立ち上がる。積み上げてきた信頼があるから、未知の一歩も揺るぎなく踏み出せる。",
      ENFP: "混雑した街角、ひらめきは突然の春風のようにあなたの頬を撫でる。可能性の地図は折り目だらけでも、そこに描かれた線はどこまでも伸びていく。誰かの笑顔と新しい物語が、今日もあなたを連れ出す。",
      INFJ: "夜更けのカフェ、灯りは穏やかに世界の輪郭を照らす。あなたは静かに、人の奥にある物語を聴く。言葉にならない願いを見つけたとき、そっと背中を押す風になる。",
    };
    const t = type as string;
    story = typeToStory[t] || `ある日、あなたは自分の選択がどこから生まれるのかを見つめ直す。${t} の気質が導くのは、焦らず、しかし確かに進む歩み。小さな決断の積み重ねが、あなたの物語を静かに前へ運んでいく。`;
  }

  const result = { ...toResult(axes, story), features, reasons, advice };
  
  // Precompute image URLs for persistence
  const avatarUrl = `/api/image/avatar?type=${encodeURIComponent(result.type)}&title=${encodeURIComponent(result.title)}`;
  const sceneUrl = `/api/image/scene?type=${encodeURIComponent(result.type)}&title=${encodeURIComponent(result.title)}`;
  try { await dbSaveMbtiResult(sessionId, axes, result.type, result.title, result.summary, result.story, { features, reasons, advice, avatar_url: avatarUrl, scene_url: sceneUrl }); } catch {}
  return NextResponse.json(result);
}
