import { NextRequest, NextResponse } from 'next/server';
import { dbListDetailResults } from '@/server/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 20);
    try {
        const rows = await dbListDetailResults(limit);
        return NextResponse.json({ items: rows });
    } catch (e) {
        return NextResponse.json({ items: [] });
    }
}
