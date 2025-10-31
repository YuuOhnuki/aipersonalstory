import { Message } from "@/types/conversation";
import { MBTIMap } from "@/types/mbti";

type SessionState = {
  id: string;
  startedAt: string;
  messages: Message[];
  rounds: number;
  done: boolean;
  axes?: MBTIMap;
};

export const sessions = new Map<string, SessionState>();

export function createSession(): { id: string; startedAt: string } {
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  sessions.set(id, { id, startedAt, messages: [], rounds: 0, done: false });
  return { id, startedAt };
}

export function createSessionWithId(id: string): { id: string; startedAt: string } {
  const startedAt = new Date().toISOString();
  sessions.set(id, { id, startedAt, messages: [], rounds: 0, done: false });
  return { id, startedAt };
}

export function getSession(id: string): SessionState | undefined {
  return sessions.get(id);
}

export function appendMessage(id: string, msg: Message) {
  const s = sessions.get(id);
  if (!s) return;
  s.messages.push(msg);
}

export function markDone(id: string) {
  const s = sessions.get(id);
  if (!s) return;
  s.done = true;
}

export function incRound(id: string) {
  const s = sessions.get(id);
  if (!s) return;
  s.rounds += 1;
}

export function setAxes(id: string, axes: MBTIMap) {
  const s = sessions.get(id);
  if (!s) return;
  s.axes = axes;
}
