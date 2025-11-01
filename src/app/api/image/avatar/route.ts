import { NextRequest, NextResponse } from 'next/server';
import {
    dbGetMbtiResultByAny,
    dbGetDetailResultByAny,
    dbUpdateMbtiImages,
    dbUpdateDetailImages,
} from '@/server/db';
import { generateWithHorde, hordeProgress } from '@/server/horde';
import { generateAvatarSVG, deriveAnimalFromPersonality } from '@/server/image';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const fallbackType = searchParams.get('type') || 'INFP';
    const fallbackTitle = searchParams.get('title') || 'Synchronauts';
    const progressKey = searchParams.get('k') || (id ? `avatar:${id}` : '');
    const force = searchParams.get('force') === '1';

    let type = fallbackType;
    let title = fallbackTitle;
    let story = '';
    let bigFive:
        | {
              openness?: number;
              conscientiousness?: number;
              extraversion?: number;
              agreeableness?: number;
              neuroticism?: number;
          }
        | undefined;
    let featuresText = '';
    let sessionIdForSave: string | null = null;
    if (id) {
        try {
            const row = await dbGetMbtiResultByAny(id);
            if (row) {
                type = row.type || type;
                title = row.title || title;
                story = row.story || '';
                featuresText = row.features || '';
                sessionIdForSave = row.session_id || sessionIdForSave;
                // Serve cached avatar if present and not forced
                if (!force && row.avatar_url) {
                    const u: string = row.avatar_url;
                    if (u.startsWith('data:')) {
                        const m = /^data:([^;]+);base64,(.*)$/.exec(u);
                        if (m) {
                            const mime = m[1];
                            const data = Buffer.from(m[2], 'base64');
                            try {
                                console.info(
                                    '[avatar] cache hit (mbti_result)',
                                    {
                                        progressKey,
                                        mime,
                                        size: `${data.length}b`,
                                    }
                                );
                            } catch {}
                            return new Response(data, {
                                headers: {
                                    'Content-Type': mime,
                                    'Cache-Control':
                                        'public, max-age=3600, stale-while-revalidate=86400',
                                },
                            });
                        }
                    }
                }
            }
        } catch {}
        try {
            const d = await dbGetDetailResultByAny(id);
            if (d) {
                bigFive = {
                    openness: Number(d.openness),
                    conscientiousness: Number(d.conscientiousness),
                    extraversion: Number(d.extraversion),
                    agreeableness: Number(d.agreeableness),
                    neuroticism: Number(d.neuroticism),
                };
                // Prefer detail story if mbti story is empty
                if (!story) story = d.story || '';
                sessionIdForSave = sessionIdForSave || d.session_id || null;
                if (!force && d.avatar_url) {
                    const u: string = d.avatar_url;
                    if (u.startsWith('data:')) {
                        const m = /^data:([^;]+);base64,(.*)$/.exec(u);
                        if (m) {
                            const mime = m[1];
                            const data = Buffer.from(m[2], 'base64');
                            try {
                                console.info(
                                    '[avatar] cache hit (detail_result)',
                                    {
                                        progressKey,
                                        mime,
                                        size: `${data.length}b`,
                                    }
                                );
                            } catch {}
                            return new Response(data, {
                                headers: {
                                    'Content-Type': mime,
                                    'Cache-Control':
                                        'public, max-age=3600, stale-while-revalidate=86400',
                                },
                            });
                        }
                    }
                }
            }
        } catch {}
    }

    try {
        const { animal, style } = deriveAnimalFromPersonality(
            type || 'INFP',
            bigFive,
            featuresText
        );
        try {
            console.info('[avatar] start', {
                progressKey,
                type,
                title,
                animal,
                hasStory: !!story,
                hasBigFive: !!bigFive,
            });
        } catch {}
        const prompt = [
            `Cute deformed ${animal} mascot representing MBTI ${type}.`,
            bigFive
                ? `Big Five hints: openness ${bigFive.openness}%, conscientiousness ${bigFive.conscientiousness}%, extraversion ${bigFive.extraversion}%, agreeableness ${bigFive.agreeableness}%, neuroticism ${bigFive.neuroticism}%.`
                : '',
            title ? `Theme: ${title}.` : '',
            story ? `Poetic inspiration: ${story.slice(0, 200)}.` : '',
            style,
        ]
            .filter(Boolean)
            .join(' ');

        // models: from query (?models=a,b,c) or env HORDE_MODELS
        const modelsParam = searchParams.get('models');
        const envModels = process.env.HORDE_MODELS || '';
        const models = (modelsParam || envModels)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        const { buffer, mime } = await generateWithHorde(prompt, {
            width: 640,
            height: 640,
            steps: 14,
            cfg_scale: 5,
            progressKey: progressKey || undefined,
            models: models.length ? models : undefined,
        });
        const copy = new Uint8Array(buffer.length);
        copy.set(buffer);
        const blob = new Blob([copy.buffer], { type: mime || 'image/webp' });
        try {
            console.info('[avatar] success', {
                progressKey,
                mime,
                size: `${buffer.length}b`,
            });
        } catch {}
        // Save data URL to DB for caching
        try {
            if (sessionIdForSave) {
                const dataUrl = `data:${mime || 'image/webp'};base64,${Buffer.from(copy).toString('base64')}`;
                await Promise.allSettled([
                    dbUpdateMbtiImages(sessionIdForSave, {
                        avatar_url: dataUrl,
                    }),
                    dbUpdateDetailImages(sessionIdForSave, {
                        avatar_url: dataUrl,
                    }),
                ]);
            }
        } catch (e) {
            try {
                console.warn('[avatar] failed to save cache', String(e));
            } catch {}
        }
        return new Response(blob, {
            headers: {
                'Content-Type': mime || 'image/webp',
                'Cache-Control':
                    'public, max-age=3600, stale-while-revalidate=86400',
            },
        });
    } catch (e) {
        // Mark progress error and fallback to fast SVG
        if (progressKey) {
            hordeProgress.set(progressKey, {
                status: 'error',
                message: 'generation failed',
                updatedAt: Date.now(),
            });
        }
        try {
            console.error('[avatar] error', { progressKey, error: String(e) });
        } catch {}
        const svg = generateAvatarSVG(type || 'INFP', title || '');
        return new Response(svg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control':
                    'public, max-age=600, stale-while-revalidate=3600',
            },
        });
    }
}
