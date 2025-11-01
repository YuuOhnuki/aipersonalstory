import { NextRequest, NextResponse } from 'next/server';
import {
    appendMessage,
    getSession,
    incRound,
    markDone,
    createSessionWithId,
} from '@/server/store';
import { generateTextWithMeta } from '@/server/llm';
import type { Message } from '@/types/conversation';
import { dbAppendMessage, dbEnsureSession } from '@/server/db';

export const runtime = 'nodejs';

const AXIS_ORDER = ['E/I', 'S/N', 'T/F', 'J/P'] as const;
const MAX_TOTAL_ROUNDS = 12; // allow extended conversation beyond initial axes
const AXIS_QUESTIONS: Record<(typeof AXIS_ORDER)[number], string> = {
    'E/I': 'ふだんエネルギーを回復するとき、ひとりの時間と人と過ごす時間のどちらが多いですか？',
    'S/N': '新しいことを学ぶとき、具体例から理解しますか？それとも概念や可能性から考える方が好きですか？',
    'T/F': '大事な選択では、論理や公平性と、気持ちや人間関係のどちらをより重視しますか？',
    'J/P': '予定は事前に決めて進めたいですか？それとも状況に合わせて柔軟に動くのが好きですか？',
};

function last<T>(arr: T[]): T | undefined {
    return arr[arr.length - 1];
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId)
        return NextResponse.json(
            { error: 'sessionId is required' },
            { status: 400 }
        );

    let session = getSession(sessionId);
    if (!session) {
        createSessionWithId(sessionId);
        session = getSession(sessionId);
    }
    if (session) await dbEnsureSession(session.id, session.startedAt);

    const body = await req.json().catch(() => ({}));
    const content: string = (body?.content ?? '').toString();
    const incomingQuestion: string = (body?.question ?? '').toString();
    if (!content.trim())
        return NextResponse.json(
            { error: 'content is required' },
            { status: 400 }
        );

    const now = new Date().toISOString();
    const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: now,
    };
    appendMessage(sessionId, userMsg);
    await dbAppendMessage(sessionId, userMsg);

    // Determine which axis to ask next
    const current = getSession(sessionId);
    const round = (current?.rounds ?? 0) as number;
    const axis = round < AXIS_ORDER.length ? AXIS_ORDER[round] : null;

    let assistantText = '';
    let llmProvider: string | undefined = undefined;
    let llmFallback = false;
    // First, a short reflective follow-up using LLM if available
    try {
        const history = current?.messages ?? [];
        const prevAssistant = last(
            history.filter((m) => m.role === 'assistant')
        );
        const prevQuestionText =
            prevAssistant?.content?.trim() || incomingQuestion.trim() || '';

        const followPrompt = prevQuestionText
            ? `あなたは臨床心理の知見を持つ穏やかなカウンセラーです。以下の「直前のやり取り」を踏まえ、ユーザーの回答内容に寄り添った短い共感のみを返してください。\n- 評価しない\n- 専門用語を使わない\n- 質問はしない（共感のみ）\n- 一文、50〜80文字程度\n日本語で返答。\n\n[直前のやり取り]\n質問: ${prevQuestionText}\nユーザーの回答: ${content}`
            : `あなたは臨床心理の知見を持つ穏やかなカウンセラーです。ユーザーの文脈に寄り添い、反射（オウム返し）や短い相づちで共感のみを伝えてください。\n- 評価しない\n- 専門用語を使わない\n- 質問はしない（共感のみ）\n- 一文、50〜80文字程度\n日本語で返答。\n\nユーザー: ${content}`;
        const meta = await generateTextWithMeta(followPrompt, {
            max_new_tokens: 64,
            temperature: 0.4,
        });
        assistantText = (meta.text || '').trim();
        llmProvider = meta.provider;
        llmFallback =
            meta.provider === 'disabled' || meta.provider === 'last_resort';
        if (assistantText) {
            const parts = assistantText.split(/(?<=[。\.!！?？])/);
            assistantText = parts
                .filter((p) => !/[?？]/.test(p))
                .join('')
                .trim();
        }
    } catch {}

    // Build assistant messages: (1) short reflection (no questions), (2) axis question as chat message
    const assistantMessages: Message[] = [];
    const nowIso = new Date().toISOString();
    if (assistantText && assistantText.trim().length >= 8) {
        assistantMessages.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantText.trim(),
            createdAt: nowIso,
        });
    }
    let questionText = '';
    if (axis) {
        questionText = `質問：${AXIS_QUESTIONS[axis]}`;
    } else {
        // After initial axes, generate a new follow-up question via LLM
        try {
            const history = current?.messages ?? [];
            const transcript = history
                .concat([
                    {
                        id: 'tmp',
                        role: 'user',
                        content,
                        createdAt: nowIso,
                    } as any,
                ])
                .map(
                    (m) =>
                        `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`
                )
                .join('\n');
            const qp = `あなたは面接官ではなく、相手の負担を軽くしつつ性格の理解を深めるカウンセラーです。以下の会話履歴を踏まえ、すでに尋ねた内容を繰り返さず、性格理解に役立つ短い質問を日本語で1つだけ作ってください。条件:\n- 1文で簡潔に\n- 専門用語を使わない\n- 新しい観点を1つ\n会話:\n${transcript}`;
            const qo = await generateTextWithMeta(qp, {
                max_new_tokens: 80,
                temperature: 0.6,
            });
            const qraw = (qo.text || '').trim().replace(/^質問[:：]\s*/, '');
            questionText = `質問：${qraw || '最近、楽しかった出来事について教えてください。'}`;
            llmProvider = llmProvider || qo.provider;
            llmFallback =
                llmFallback ||
                qo.provider === 'disabled' ||
                qo.provider === 'last_resort';
        } catch {
            questionText =
                '質問：最近、楽しかった出来事について教えてください。';
        }
    }
    assistantMessages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: questionText,
        createdAt: nowIso,
    });

    for (const m of assistantMessages) {
        appendMessage(sessionId, m);
        await dbAppendMessage(sessionId, m);
    }

    // Advance round and determine if done (allow extended conversation)
    incRound(sessionId);
    const newRound = getSession(sessionId)?.rounds ?? 0;
    const done = newRound >= MAX_TOTAL_ROUNDS;
    if (done) markDone(sessionId);

    return NextResponse.json({
        messages: assistantMessages,
        done,
        nextQuestion: questionText,
        llmProvider,
        llmFallback,
    });
}
