import { NextRequest, NextResponse } from 'next/server';
import { hordeProgress } from '@/server/horde';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || '';
    if (!key)
        return NextResponse.json({ error: 'missing key' }, { status: 400 });
    const p = hordeProgress.get(key);
    return NextResponse.json(p || { status: 'idle', updatedAt: Date.now() }, {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
