import { NextRequest, NextResponse } from 'next/server';
import {
    dbGetMbtiResultByAny,
    dbGetDetailResultByAny,
    dbUpdateMbtiImages,
    dbUpdateDetailImages,
} from '@/server/db';
import { generateWithHorde, hordeProgress } from '@/server/horde';
import { generateSceneSVG } from '@/server/image';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const fallbackType = searchParams.get('type') || 'INFP';
    const fallbackTitle = searchParams.get('title') || 'Synchronauts';
    const progressKey = searchParams.get('k') || (id ? `scene:${id}` : '');
    const force = searchParams.get('force') === '1';

    let type = fallbackType;
    let title = fallbackTitle;
    let story = '';
    let sessionIdForSave: string | null = null;
    if (id) {
        try {
            const row = await dbGetMbtiResultByAny(id);
            if (row) {
                type = row.type || type;
                title = row.title || title;
                story = row.story || '';
                sessionIdForSave = row.session_id || sessionIdForSave;
                // Serve cached scene if present and not forced
                if (!force && row.scene_url) {
                    const u: string = row.scene_url;
                    if (u.startsWith('data:')) {
                        const m = /^data:([^;]+);base64,(.*)$/.exec(u);
                        if (m) {
                            const mime = m[1];
                            const data = Buffer.from(m[2], 'base64');
                            try {
                                console.info(
                                    '[scene] cache hit (mbti_result)',
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
                sessionIdForSave = sessionIdForSave || d.session_id || null;
                if (!force && d.scene_url) {
                    const u: string = d.scene_url;
                    if (u.startsWith('data:')) {
                        const m = /^data:([^;]+);base64,(.*)$/.exec(u);
                        if (m) {
                            const mime = m[1];
                            const data = Buffer.from(m[2], 'base64');
                            try {
                                console.info(
                                    '[scene] cache hit (detail_result)',
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
        try {
            console.info('[scene] start', {
                progressKey,
                type,
                title,
                hasStory: !!story,
            });
        } catch {}
        const prompt = [
            `Landscape illustration inspired by MBTI type ${type}.`,
            title ? `Theme: ${title}.` : '',
            story
                ? `Cinematic scene reflecting this poetic story: ${story.slice(0, 500)}.`
                : '',
            'Wide 16:9 composition, soft light, pastel palette, dreamy atmosphere, highly detailed, digital art.',
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
            width: 896,
            height: 512,
            steps: 16,
            cfg_scale: 5,
            progressKey: progressKey || undefined,
            models: models.length ? models : undefined,
        });
        try {
            console.info('[scene] success', {
                progressKey,
                mime,
                size: `${buffer.length}b`,
            });
        } catch {}
        const copy = new Uint8Array(buffer.length);
        copy.set(buffer);
        const blob = new Blob([copy.buffer], { type: mime || 'image/webp' });
        // Save data URL to DB for caching
        try {
            if (sessionIdForSave) {
                const dataUrl = `data:${mime || 'image/webp'};base64,${Buffer.from(copy).toString('base64')}`;
                await Promise.allSettled([
                    dbUpdateMbtiImages(sessionIdForSave, {
                        scene_url: dataUrl,
                    }),
                    dbUpdateDetailImages(sessionIdForSave, {
                        scene_url: dataUrl,
                    }),
                ]);
            }
        } catch (e) {
            try {
                console.warn('[scene] failed to save cache', String(e));
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
        try {
            console.error('[scene] error', { progressKey, error: String(e) });
        } catch {}
        // Mark progress error and fallback to fast SVG
        if (progressKey) {
            hordeProgress.set(progressKey, {
                status: 'error',
                message: 'generation failed',
                updatedAt: Date.now(),
            });
        }
        const svg = generateSceneSVG(type || 'INFP', title || '');
        return new Response(svg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control':
                    'public, max-age=600, stale-while-revalidate=3600',
            },
        });
    }
}
