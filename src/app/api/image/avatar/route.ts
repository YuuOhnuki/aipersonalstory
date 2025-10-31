import { NextRequest, NextResponse } from 'next/server';
import { dbGetMbtiResultByAny } from '@/server/db';
import { generateWithHorde, hordeProgress } from '@/server/horde';
import { generateAvatarSVG } from '@/server/image';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const fallbackType = searchParams.get('type') || 'INFP';
    const fallbackTitle = searchParams.get('title') || 'AI Personality Story';
    const progressKey = searchParams.get('k') || (id ? `avatar:${id}` : '');

    let type = fallbackType;
    let title = fallbackTitle;
    let story = '';
    if (id) {
        try {
            const row = await dbGetMbtiResultByAny(id);
            if (row) {
                type = row.type || type;
                title = row.title || title;
                story = row.story || '';
            }
        } catch {}
    }

    try {
        const prompt = [
            `Minimalist portrait symbolizing MBTI type ${type}.`,
            title ? `Theme: ${title}.` : '',
            story ? `Poetic inspiration: ${story.slice(0, 400)}.` : '',
            'Clean vector-like style, soft gradients, cinematic lighting, high detail, centered composition, white background.',
        ]
            .filter(Boolean)
            .join(' ');

        const { buffer, mime } = await generateWithHorde(prompt, {
            width: 800,
            height: 800,
            steps: 25,
            cfg_scale: 7,
            progressKey: progressKey || undefined,
        });
        const copy = new Uint8Array(buffer.length);
        copy.set(buffer);
        const blob = new Blob([copy.buffer], { type: mime || 'image/webp' });
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
