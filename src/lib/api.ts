import { MBTIResult } from '@/types/mbti';
import { Message, Session } from '@/types/conversation';

const BASE = process.env.NEXT_PUBLIC_API_BASE || '';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
}

export const api = {
    async startSession(): Promise<Session> {
        try {
            return await http<Session>('/api/session', { method: 'POST' });
        } catch {
            const id = crypto.randomUUID();
            return { id, startedAt: new Date().toISOString() };
        }
    },
    async sendMessage(
        sessionId: string,
        content: string
    ): Promise<{ messages: Message[]; done?: boolean }> {
        try {
            return await http(
                `/api/chat?sessionId=${encodeURIComponent(sessionId)}`,
                {
                    method: 'POST',
                    body: JSON.stringify({ content }),
                }
            );
        } catch {
            const now = new Date().toISOString();
            return {
                messages: [
                    {
                        id: crypto.randomUUID(),
                        role: 'user',
                        content,
                        createdAt: now,
                    },
                    {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: '了解しました。続けて教えてください。',
                        createdAt: now,
                    },
                ],
            };
        }
    },
    async getResult(sessionId: string): Promise<MBTIResult> {
        try {
            return await http<MBTIResult>(
                `/api/result?sessionId=${encodeURIComponent(sessionId)}`
            );
        } catch {
            return {
                axes: { 'E/I': 'I', 'S/N': 'N', 'T/F': 'F', 'J/P': 'P' },
                type: 'INFP',
                title: '理想を追う詩人',
                summary: '洞察力が高く想像力に富み、価値観を大切にします。',
                story: '静かな森の奥で、自分だけの灯りを見つけた—そんな物語が始まる。',
            };
        }
    },
};

export default api;
