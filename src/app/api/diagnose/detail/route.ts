import { NextRequest, NextResponse } from 'next/server';
import { dbEnsureSession, dbSaveDetailResult } from '@/server/db';
import { generateText } from '@/server/llm';

export const runtime = 'nodejs';

type Answer = { questionId: string; score?: number; text?: string };

const MBTI_MAP: Record<
    string,
    { axis: 'E/I' | 'S/N' | 'T/F' | 'J/P'; dir: 1 | -1; weight: number }
> = {
    A1: { axis: 'E/I', dir: +1, weight: 1.0 },
    A2: { axis: 'S/N', dir: -1, weight: 1.0 },
    A3: { axis: 'T/F', dir: +1, weight: 1.0 },
    A4: { axis: 'J/P', dir: +1, weight: 1.0 },
    A5: { axis: 'E/I', dir: +1, weight: 0.8 },
    A6: { axis: 'S/N', dir: +1, weight: 0.8 },
    A7: { axis: 'T/F', dir: +1, weight: 0.8 },
    A8: { axis: 'J/P', dir: +1, weight: 0.8 },
};

const BIGFIVE_AXES: Record<string, keyof any> = {
    B9: 'openness',
    B10: 'openness',
    B11: 'openness',
    B12: 'openness',
    B13: 'conscientiousness',
    B14: 'conscientiousness',
    B15: 'conscientiousness',
    B16: 'conscientiousness',
    B17: 'extraversion',
    B18: 'extraversion',
    B19: 'extraversion',
    B20: 'extraversion',
    B21: 'agreeableness',
    B22: 'agreeableness',
    B23: 'agreeableness',
    B24: 'agreeableness',
    B25: 'neuroticism',
    B26: 'neuroticism',
    B27: 'neuroticism',
    B28: 'neuroticism',
};

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') || crypto.randomUUID();

    let body: { answers: Answer[] } = { answers: [] };
    try {
        body = await req.json();
    } catch {}
    const answers = body?.answers || [];

    // Persist session stub if DB available
    await dbEnsureSession(sessionId, new Date().toISOString());

    // 1) MBTI scoring
    const mbtiScores: Record<'E/I' | 'S/N' | 'T/F' | 'J/P', number> = {
        'E/I': 0,
        'S/N': 0,
        'T/F': 0,
        'J/P': 0,
    };
    const mbtiWeights: Record<'E/I' | 'S/N' | 'T/F' | 'J/P', number> = {
        'E/I': 0,
        'S/N': 0,
        'T/F': 0,
        'J/P': 0,
    };
    for (const a of answers) {
        const meta = MBTI_MAP[a.questionId];
        if (!meta || typeof a.score !== 'number') continue;
        const v = ((a.score - 3) / 2) * meta.dir; // Likert 1..5 -> -1..+1
        mbtiScores[meta.axis] += v * meta.weight;
        mbtiWeights[meta.axis] += meta.weight;
    }
    const ei =
        (mbtiWeights['E/I'] ? mbtiScores['E/I'] / mbtiWeights['E/I'] : 0) >= 0
            ? 'E'
            : 'I';
    const sn =
        (mbtiWeights['S/N'] ? mbtiScores['S/N'] / mbtiWeights['S/N'] : 0) >= 0
            ? 'S'
            : 'N';
    const tf =
        (mbtiWeights['T/F'] ? mbtiScores['T/F'] / mbtiWeights['T/F'] : 0) >= 0
            ? 'T'
            : 'F';
    const jp =
        (mbtiWeights['J/P'] ? mbtiScores['J/P'] / mbtiWeights['J/P'] : 0) >= 0
            ? 'J'
            : 'P';
    const mbtiType = `${ei}${sn}${tf}${jp}`;

    // 2) Big Five scoring (weighted average -> 0..1 -> 0..100)
    const bigSum: any = {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
    };
    const bigCount: any = {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
    };
    for (const a of answers) {
        const axis = BIGFIVE_AXES[a.questionId as keyof typeof BIGFIVE_AXES];
        if (!axis || typeof a.score !== 'number') continue;
        bigSum[axis] += a.score;
        bigCount[axis] += 1;
    }
    const bigFive = {
        openness: Math.round(
            clamp01((bigSum.openness / (bigCount.openness || 1) - 1) / 4) * 100
        ),
        conscientiousness: Math.round(
            clamp01(
                (bigSum.conscientiousness / (bigCount.conscientiousness || 1) -
                    1) /
                    4
            ) * 100
        ),
        extraversion: Math.round(
            clamp01(
                (bigSum.extraversion / (bigCount.extraversion || 1) - 1) / 4
            ) * 100
        ),
        agreeableness: Math.round(
            clamp01(
                (bigSum.agreeableness / (bigCount.agreeableness || 1) - 1) / 4
            ) * 100
        ),
        neuroticism: Math.round(
            clamp01(
                (bigSum.neuroticism / (bigCount.neuroticism || 1) - 1) / 4
            ) * 100
        ),
    };

    // 3) Supplements and open text
    const supScores = {
        stressTolerance: 50,
        adaptability: 50,
        valueFlexibility: 50,
    };
    for (const a of answers) {
        if (a.questionId === 'C29' && typeof a.score === 'number')
            supScores.adaptability = Math.round(((a.score - 1) / 4) * 100);
        if (a.questionId === 'C30' && typeof a.score === 'number')
            supScores.valueFlexibility = Math.round(((a.score - 1) / 4) * 100);
    }
    const open = (
        answers.find((a) => a.questionId === 'C31')?.text || ''
    ).slice(0, 500);
    // naive keyword boosting
    if (/不安|心配|緊張/.test(open)) {
        bigFive.neuroticism = Math.min(100, bigFive.neuroticism + 10);
    }

    // 4) Summary generation by LLM (fallback to template)
    let summaryText = '';
    try {
        const prompt = `あなたは心理分析AIです。以下の性格データを100字程度で日本語要約してください。\nMBTI:${mbtiType}\nBigFive:${JSON.stringify(bigFive)}\n補助:${JSON.stringify(supScores)}\n自由記述:${open}`;
        console.log('[detail] summaryPrompt=', prompt);
        const out = await generateText(prompt, {
            max_new_tokens: 120,
            temperature: 0.3,
        });
        console.log('[detail] summaryOutRaw=', out);
        summaryText = (out || '').trim().slice(0, 200);
    } catch {}
    if (!summaryText)
        summaryText = `あなたは${mbtiType}傾向。Big Fiveは${Object.entries(
            bigFive
        )
            .map(([k, v]) => `${k}:${v}`)
            .join(',')}。`;

    const payload = {
        mbti_type: mbtiType,
        bigFive,
        supplements: supScores,
        summaryText,
    };
    try {
        await dbSaveDetailResult(sessionId, payload);
    } catch {}

    // Optionally also create story via same endpoint
    let story = '';
    try {
        const sp = `あなたは詩人でもある心理小説家です。以下の性格データから、主人公の内面をそっと照らす日本語の短編を作ってください。\n要件:\n- 詩的で趣のある語り口\n- 感情の余白と静かな比喩\n- 読みやすさを損なわず難語は控えめ\n- 400〜600字程度\nMBTI:${mbtiType}\nBigFive:${JSON.stringify(bigFive)}\n補助:${JSON.stringify(supScores)}\n自由記述:${open}`;
        const out = await generateText(sp, {
            max_new_tokens: 1800,
            temperature: 0.7,
        });
        story = (out || '').trim();
    } catch {}
    const genericFallback = '了解しました。もう少し詳しく教えてください。';
    if (!story || story.includes(genericFallback)) {
        story = `静かな午後、あなたは自分らしさをそっと確かめる。タイプ${mbtiType}の傾向が、選ぶ言葉や歩幅に静かに表れる。小さな決断の積み重ねが、次の一歩をやさしく照らしていく。`;
    }

    // Counseling-like advice
    let advice = '';
    try {
        const ap = `あなたは心理カウンセラーです。以下の性格データに沿って、本人が日々をより良く過ごすための具体的アドバイスを日本語で5〜8行で提案してください。専門用語は避け、やさしい口調で。\nMBTI:${mbtiType}\nBigFive:${JSON.stringify(bigFive)}\n補助:${JSON.stringify(supScores)}\n自由記述:${open}`;
        const ao = await generateText(ap, {
            max_new_tokens: 400,
            temperature: 0.6,
        });
        advice = (ao || '').trim();
    } catch {}
    if (!advice)
        advice = `- 小さな一歩を重ねる計画を作り、できたことを言葉にして残しましょう。\n- 不安が強い日は刺激を減らし、安心できる人や環境に頼ってOKです。`;

    // Persist enriched fields (advice and image URLs)
    const avatarUrl = `/api/image/avatar?type=${encodeURIComponent(mbtiType)}&title=${encodeURIComponent('詳細診断')}`;
    const sceneUrl = `/api/image/scene?type=${encodeURIComponent(mbtiType)}&title=${encodeURIComponent('詳細診断')}`;
    try {
        await dbSaveDetailResult(sessionId, {
            ...payload,
            story,
            advice,
            avatar_url: avatarUrl,
            scene_url: sceneUrl,
        });
    } catch {}

    return NextResponse.json({
        sessionId,
        result: {
            ...payload,
            story,
            advice,
            avatar_url: avatarUrl,
            scene_url: sceneUrl,
        },
    });
}
