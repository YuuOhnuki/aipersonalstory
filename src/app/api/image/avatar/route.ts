import { NextRequest } from 'next/server';
import { generateAvatarSVG } from '@/server/image';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'MB').toUpperCase();
    const title = searchParams.get('title') || '';
    const svg = generateAvatarSVG(type, title);
    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=600',
        },
    });
}
