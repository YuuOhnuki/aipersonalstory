import { NextResponse } from 'next/server';
import { createSession } from '@/server/store';
import { dbEnsureSession } from '@/server/db';

export const runtime = 'nodejs';

export async function POST() {
    const s = createSession();
    dbEnsureSession(s.id, s.startedAt);
    return NextResponse.json(s);
}
