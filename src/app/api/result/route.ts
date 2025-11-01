import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/store';
import { generateTextWithMeta } from '@/server/llm';
import { parseAxes, toResult, toType } from '@/server/mbti';
import type { MBTIMap } from '@/types/mbti';
import { dbSaveMbtiResult, dbGetMbtiResult } from '@/server/db';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId)
        return NextResponse.json(
            { error: 'sessionId is required' },
            { status: 400 }
        );

    const session = getSession(sessionId);
    if (!session)
        return NextResponse.json(
            { error: 'session not found' },
            { status: 404 }
        );

    const transcript = session.messages
        .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
        .join('\n');

    // 1) MBTI axis estimation
    const mbtiPrompt = `あなたは心理分析アシスタントです。以下の会話記録から、ユーザーのMBTIを推定してください。\n\n会話記録:\n${transcript}\n\n各軸(E/I, S/N, T/F, J/P)を1つずつ判定し、簡単な理由は書かずに、次のJSONのみを厳密に出力してください:\n{ "E/I": "E or I", "S/N": "S or N", "T/F": "T or F", "J/P": "J or P" }`;

    let axes: MBTIMap | null = null;
    const meta: any = {
        features: {},
        reasons: {},
        advice: {},
        story: {},
        axes: {},
    };
    try {
        const out = await generateTextWithMeta(mbtiPrompt, {
            max_new_tokens: 120,
            temperature: 0.2,
        });
        const outText = out.text || '';
        const parsed = parseAxes(outText);
        if (parsed) {
            axes = parsed;
            meta.axes = {
                provider: out.provider,
                fallback:
                    out.provider === 'disabled' ||
                    out.provider === 'last_resort',
                debug: {
                    algorithm: 'ai',
                    raw_preview: outText.slice(0, 220),
                },
            };
        }
    } catch {}

    // Very naive fallback if model unavailable
    if (!axes) {
        // Heuristic from transcript keywords to reduce bias
        const lower = transcript.toLowerCase();
        const score = { ei: 0, sn: 0, tf: 0, jp: 0 };
        const debugMatches: Array<{
            axis: 'E/I' | 'S/N' | 'T/F' | 'J/P';
            pattern: string;
            delta: number;
            matched: string;
        }> = [];
        const add = (cond: boolean, k: keyof typeof score, v = 1) => {
            if (cond) score[k] += v;
        };
        // E/I signals
        const reEIpos = /友|集まり|話す|人と|イベント|外出/;
        const reEIneg = /一人|静か|内省|家で|読書|落ち着く/;
        if (reEIpos.test(lower)) {
            add(true, 'ei', +1);
            debugMatches.push({
                axis: 'E/I',
                pattern: String(reEIpos),
                delta: +1,
                matched: (lower.match(reEIpos) || [''])[0],
            });
        }
        if (reEIneg.test(lower)) {
            add(true, 'ei', -1);
            debugMatches.push({
                axis: 'E/I',
                pattern: String(reEIneg),
                delta: -1,
                matched: (lower.match(reEIneg) || [''])[0],
            });
        }
        // S/N signals
        const reSNneg = /具体|現実|事実|実務|手順|体験/;
        const reSNpos = /概念|可能性|想像|直観|アイデア/;
        if (reSNneg.test(lower)) {
            add(true, 'sn', -1);
            debugMatches.push({
                axis: 'S/N',
                pattern: String(reSNneg),
                delta: -1,
                matched: (lower.match(reSNneg) || [''])[0],
            });
        }
        if (reSNpos.test(lower)) {
            add(true, 'sn', +1);
            debugMatches.push({
                axis: 'S/N',
                pattern: String(reSNpos),
                delta: +1,
                matched: (lower.match(reSNpos) || [''])[0],
            });
        }
        // T/F signals
        const reTFpos = /論理|効率|公平|ルール|分析/;
        const reTFneg = /気持ち|共感|人間関係|優しさ|思いやり/;
        if (reTFpos.test(lower)) {
            add(true, 'tf', +1);
            debugMatches.push({
                axis: 'T/F',
                pattern: String(reTFpos),
                delta: +1,
                matched: (lower.match(reTFpos) || [''])[0],
            });
        }
        if (reTFneg.test(lower)) {
            add(true, 'tf', -1);
            debugMatches.push({
                axis: 'T/F',
                pattern: String(reTFneg),
                delta: -1,
                matched: (lower.match(reTFneg) || [''])[0],
            });
        }
        // J/P signals
        const reJPpos = /計画|締め切り|整理|先回り|スケジュール/;
        const reJPneg = /柔軟|臨機応変|流れ|即興|気分/;
        if (reJPpos.test(lower)) {
            add(true, 'jp', +1);
            debugMatches.push({
                axis: 'J/P',
                pattern: String(reJPpos),
                delta: +1,
                matched: (lower.match(reJPpos) || [''])[0],
            });
        }
        if (reJPneg.test(lower)) {
            add(true, 'jp', -1);
            debugMatches.push({
                axis: 'J/P',
                pattern: String(reJPneg),
                delta: -1,
                matched: (lower.match(reJPneg) || [''])[0],
            });
        }
        axes = {
            'E/I': score.ei >= 0 ? 'E' : 'I',
            'S/N': score.sn >= 0 ? 'N' : 'S',
            'T/F': score.tf >= 0 ? 'T' : 'F',
            'J/P': score.jp >= 0 ? 'J' : 'P',
        } as MBTIMap;
        meta.axes = {
            provider: 'fallback',
            fallback: true,
            debug: {
                algorithm: 'heuristic',
                scores: { ...score },
                matches: debugMatches,
                note: '発話のキーワードに基づく単純なスコアリングです。開発時のみ表示されます。',
            },
        };
    }
    const type = toType(axes);

    // 3) Features (common traits)
    let features = '';
    try {
        const fp = `あなたは心理アナリストです。タイプ${type}の一般的な特徴を日本語で3〜5行で箇条書きで説明してください。専門用語は避け、誰にでも分かる言葉にしてください。`;
        const fo = await generateTextWithMeta(fp, {
            max_new_tokens: 220,
            temperature: 0.4,
        });
        features = (fo.text || '').trim();
        meta.features = {
            provider: fo.provider,
            fallback:
                fo.provider === 'disabled' || fo.provider === 'last_resort',
        };
    } catch {}
    if (!features)
        features = `- ${type} の一般的な強みと傾向を分かりやすく表しました。\n- 想像力/計画性/論理/共感などのバランスが日常に現れます。`;
    if (!meta.features.provider)
        meta.features = { provider: 'fallback', fallback: true };

    // 4) Reasons (from transcript)
    let reasons = '';
    try {
        const rp = `あなたは心理アナリストです。次の会話記録から、${type} と判断した根拠を3点、分かりやすい日本語で説明してください。専門用語は避けます。\n会話:\n${transcript}`;
        const ro = await generateTextWithMeta(rp, {
            max_new_tokens: 260,
            temperature: 0.5,
        });
        reasons = (ro.text || '').trim();
        meta.reasons = {
            provider: ro.provider,
            fallback:
                ro.provider === 'disabled' || ro.provider === 'last_resort',
        };
    } catch {}
    if (!reasons)
        reasons = `- 会話に見られたキーワードや姿勢から、${type} の傾向が読み取れました。`;
    if (!meta.reasons.provider)
        meta.reasons = { provider: 'fallback', fallback: true };

    // 5) Advice (practical suggestions)
    let advice = '';
    try {
        const ap = `あなたは心理カウンセラーです。タイプ${type}の人に向けて、日常で役立つ具体的なアドバイスを日本語で4〜6行で提示してください。実践的で優しい言葉にしてください。`;
        const ao = await generateTextWithMeta(ap, {
            max_new_tokens: 280,
            temperature: 0.6,
        });
        advice = (ao.text || '').trim();
        meta.advice = {
            provider: ao.provider,
            fallback:
                ao.provider === 'disabled' || ao.provider === 'last_resort',
        };
    } catch {}
    if (!advice)
        advice = `- 小さな一歩を積み重ねて、あなたらしさを大切にする時間を確保しましょう。\n- 負担が大きいときはタスクを細かく分け、助けを求める練習も有効です。`;
    if (!meta.advice.provider)
        meta.advice = { provider: 'fallback', fallback: true };

    // 6) Additional insights from chat transcript (tone, phrasing, behaviors)
    let insights = '';
    try {
        const ip = `あなたは対話のニュアンスから性格の傾向を読み解くアナリストです。以下の会話記録から、言い回し、語調、回答の姿勢（ためらい・断定・具体/抽象・配慮など）に着目し、${type}の見立てを補強・補足する観点を日本語で3〜5点、簡潔に箇条書きで述べてください。断定は避け、丁寧語でやさしく。\n会話:\n${transcript}`;
        const io = await generateTextWithMeta(ip, {
            max_new_tokens: 260,
            temperature: 0.5,
        });
        insights = (io.text || '').trim();
        (meta as any).insights = {
            provider: io.provider,
            fallback:
                io.provider === 'disabled' || io.provider === 'last_resort',
        };
    } catch {}
    if (!insights)
        insights = `- 会話の語調や言葉遣いから、慎重さや配慮の傾向がうかがえます。\n- 具体・抽象の扱い方、感情と論理のバランスに、${type}の特徴が控えめに現れています。`;
    if (!(meta as any).insights?.provider)
        (meta as any).insights = { provider: 'fallback', fallback: true };

    // 2) Story generation (longer, poetic tone)
    const storyPrompt = `あなたは詩人でもある物語作家です。読者の心に余韻を残す日本語の短編を作ってください。\n前提: 主人公の性格タイプは ${type}。\n要件:\n- 詩的で趣のある語り口\n- 感情の余白と静かな比喩を織り込む\n- 一文のリズムに緩急をつけ、呼吸を感じさせる\n- 読みやすさを損なわず、過度な難語は避ける\n- 200〜300文字程度`;

    let story = '';
    let storyProvider: string | undefined;
    try {
        const out2 = await generateTextWithMeta(storyPrompt, {
            max_new_tokens: 1100,
            temperature: 0.7,
        });
        story = (out2.text || '').trim();
        storyProvider = out2.provider;
        meta.story = {
            provider: out2.provider,
            fallback:
                out2.provider === 'disabled' || out2.provider === 'last_resort',
        };
    } catch {}

    const genericFallback = '了解しました。もう少し詳しく教えてください。';
    const providerFallback =
        storyProvider === 'disabled' || storyProvider === 'last_resort';
    if (!story || story.includes(genericFallback) || providerFallback) {
        // Retry with varied prompt including transcript and a variation key to encourage unique outputs per session
        try {
            const variationKey = `${sessionId}-${Date.now()}`;
            const storyPrompt2 = `あなたは詩人でもある物語作家です。以下の会話の雰囲気を少し取り入れ、主人公の内面を静かに描く短編を日本語で作ってください。\nタイプ: ${type}\nバリエーションキー: ${variationKey}\n会話の抜粋:\n${transcript.slice(0, 1200)}\n要件:\n- 詩的でありつつ具体的な手触りを1つ入れる（音/匂い/光など）\n- 過度な定型表現を避ける\n- 220〜320文字程度`;
            const out3 = await generateTextWithMeta(storyPrompt2, {
                max_new_tokens: 1200,
                temperature: 0.85,
            });
            const s3 = (out3.text || '').trim();
            if (s3 && !s3.includes(genericFallback)) {
                story = s3;
                meta.story = {
                    provider: out3.provider,
                    fallback:
                        out3.provider === 'disabled' ||
                        out3.provider === 'last_resort',
                };
            }
        } catch {}
    }

    const result = {
        ...toResult(axes, story),
        features,
        reasons,
        advice,
        insights,
    };

    // Precompute image URLs for persistence
    const avatarUrl = `/api/image/avatar?type=${encodeURIComponent(result.type)}&title=${encodeURIComponent(result.title)}`;
    const sceneUrl = `/api/image/scene?type=${encodeURIComponent(result.type)}&title=${encodeURIComponent(result.title)}`;

    // Ensure a stable unique result_id for this session
    let result_id: string | null = null;
    try {
        const existing = await dbGetMbtiResult(sessionId);
        result_id = existing?.result_id || null;
    } catch {}
    if (!result_id) result_id = randomUUID();
    try {
        await dbSaveMbtiResult(
            sessionId,
            axes,
            result.type,
            result.title,
            result.summary,
            result.story,
            {
                features,
                reasons,
                advice,
                avatar_url: avatarUrl,
                scene_url: sceneUrl,
                result_id: result_id as string,
            }
        );
    } catch {}
    return NextResponse.json({ ...result, result_id, _meta: meta });
}
