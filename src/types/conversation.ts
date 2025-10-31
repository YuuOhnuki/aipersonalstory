export type Role = 'user' | 'assistant';
export type Message = {
    id: string;
    role: Role;
    content: string;
    createdAt: string;
};
export type Session = { id: string; startedAt: string; endedAt?: string };
