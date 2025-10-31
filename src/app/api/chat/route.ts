import { NextRequest, NextResponse } from "next/server";
import { appendMessage, getSession, incRound, markDone, createSessionWithId } from "@/server/store";
import { generateText } from "@/server/llm";
import type { Message } from "@/types/conversation";
import { dbAppendMessage, dbEnsureSession } from "@/server/db";

export const runtime = "nodejs";

const AXIS_ORDER = ["E/I", "S/N", "T/F", "J/P"] as const;
const AXIS_QUESTIONS: Record<(typeof AXIS_ORDER)[number], string> = {
  "E/I": "ふだんエネルギーを回復するとき、ひとりの時間と人と過ごす時間のどちらが多いですか？",
  "S/N": "新しいことを学ぶとき、具体例から理解しますか？それとも概念や可能性から考える方が好きですか？",
  "T/F": "大事な選択では、論理や公平性と、気持ちや人間関係のどちらをより重視しますか？",
  "J/P": "予定は事前に決めて進めたいですか？それとも状況に合わせて柔軟に動くのが好きですか？",
};

function last<T>(arr: T[]): T | undefined { return arr[arr.length - 1]; }

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  let session = getSession(sessionId);
  if (!session) {
    createSessionWithId(sessionId);
    session = getSession(sessionId);
  }
  if (session) await dbEnsureSession(session.id, session.startedAt);

  const body = await req.json().catch(() => ({}));
  const content: string = (body?.content ?? "").toString();
  if (!content.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const now = new Date().toISOString();
  const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, createdAt: now };
  appendMessage(sessionId, userMsg);
  await dbAppendMessage(sessionId, userMsg);

  // Determine which axis to ask next
  const current = getSession(sessionId);
  const round = (current?.rounds ?? 0) as number;
  if (round >= AXIS_ORDER.length) {
    markDone(sessionId);
    return NextResponse.json({ messages: [], done: true });
  }
  const axis = AXIS_ORDER[round];

  let assistantText = "";
  // First, a short reflective follow-up using LLM if available
  try {
    const followPrompt = `あなたは臨床心理の知見を持つ穏やかなカウンセラーです。ユーザーの文脈に寄り添い、反射（オウム返し）や短い相づちで共感のみを伝えてください。\n- 評価しない\n- 専門用語を使わない\n- 質問はしない（共感のみ）\n- 一文、50〜80文字程度\n日本語で返答。\n\nユーザー: ${content}`;
    const out = await generateText(followPrompt, { max_new_tokens: 64, temperature: 0.4 });
    assistantText = (out || "").trim();
  } catch {}

  // Build assistant messages: (1) short reflection if present, (2) axis question
  const assistantMessages: Message[] = [];
  const nowIso = new Date().toISOString();
  if (assistantText && assistantText.trim().length >= 8) {
    assistantMessages.push({ id: crypto.randomUUID(), role: "assistant", content: assistantText.trim(), createdAt: nowIso });
  }
  const questionText = `質問：${AXIS_QUESTIONS[axis]}`;
  assistantMessages.push({ id: crypto.randomUUID(), role: "assistant", content: questionText, createdAt: nowIso });
  

  for (const m of assistantMessages) {
    appendMessage(sessionId, m);
    await dbAppendMessage(sessionId, m);
  }

  // Advance round and determine if done (exactly number of axes)
  incRound(sessionId);
  const newRound = (getSession(sessionId)?.rounds ?? 0);
  const done = newRound >= AXIS_ORDER.length;
  if (done) markDone(sessionId);

  return NextResponse.json({ messages: assistantMessages, done });
}
