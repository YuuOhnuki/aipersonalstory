// Load better-sqlite3 lazily and type loosely to avoid compile-time type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sqlite: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any | null = null;
import { Message } from "@/types/conversation";
import { MBTIMap } from "@/types/mbti";

function getDb() {
  if (db) return db;
  try {
    // Use require to avoid bundling hiccups
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Sqlite = Sqlite || require("better-sqlite3");
    db = new Sqlite(process.env.DB_PATH || "./data.sqlite");
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_session (
        id TEXT PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT
      );
      CREATE TABLE IF NOT EXISTS conversation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES user_session(id)
      );
      CREATE TABLE IF NOT EXISTS mbti_result (
        session_id TEXT PRIMARY KEY,
        e_i TEXT,
        s_n TEXT,
        t_f TEXT,
        j_p TEXT,
        type TEXT,
        title TEXT,
        summary TEXT,
        story TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES user_session(id)
      );
      CREATE TABLE IF NOT EXISTS detail_result (
        session_id TEXT PRIMARY KEY,
        mbti_type TEXT,
        openness REAL,
        conscientiousness REAL,
        extraversion REAL,
        agreeableness REAL,
        neuroticism REAL,
        stressTolerance REAL,
        adaptability REAL,
        valueFlexibility REAL,
        summaryText TEXT,
        story TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES user_session(id)
      );
    `);
  } catch (e) {
    console.warn("SQLite unavailable, continuing without DB:", e);
    db = null;
  }
  return db;
}

export function dbEnsureSession(id: string, startedAt: string) {
  const d = getDb();
  if (!d) return;
  d.prepare("INSERT OR IGNORE INTO user_session (id, start_time) VALUES (?, ?)").run(id, startedAt);
}

export function dbAppendMessage(sessionId: string, msg: Message) {
  const d = getDb();
  if (!d) return;
  d.prepare("INSERT INTO conversation_log (session_id, role, content, created_at) VALUES (?, ?, ?, ?)")
    .run(sessionId, msg.role, msg.content, msg.createdAt);
}

export function dbSaveMbtiResult(sessionId: string, axes: MBTIMap, type: string, title: string, summary: string, story: string) {
  const d = getDb();
  if (!d) return;
  d.prepare(`INSERT OR REPLACE INTO mbti_result (session_id, e_i, s_n, t_f, j_p, type, title, summary, story, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(sessionId, axes["E/I"], axes["S/N"], axes["T/F"], axes["J/P"], type, title, summary, story, new Date().toISOString());
}

export function dbSaveDetailResult(sessionId: string, payload: {
  mbti_type: string,
  bigFive: { openness: number, conscientiousness: number, extraversion: number, agreeableness: number, neuroticism: number },
  supplements: { stressTolerance: number, adaptability: number, valueFlexibility: number },
  summaryText: string,
  story?: string,
}) {
  const d = getDb();
  if (!d) return;
  d.prepare(`INSERT OR REPLACE INTO detail_result (
      session_id, mbti_type, openness, conscientiousness, extraversion, agreeableness, neuroticism,
      stressTolerance, adaptability, valueFlexibility, summaryText, story, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      payload as any && sessionId,
      payload.mbti_type,
      payload.bigFive.openness,
      payload.bigFive.conscientiousness,
      payload.bigFive.extraversion,
      payload.bigFive.agreeableness,
      payload.bigFive.neuroticism,
      payload.supplements.stressTolerance,
      payload.supplements.adaptability,
      payload.supplements.valueFlexibility,
      payload.summaryText,
      payload.story ?? null,
      new Date().toISOString()
    );
}

export function dbGetMbtiResult(sessionId: string) {
  const d = getDb();
  if (!d) return null;
  const row = d.prepare(`SELECT * FROM mbti_result WHERE session_id = ?`).get(sessionId);
  return row || null;
}

export function dbGetDetailResult(sessionId: string) {
  const d = getDb();
  if (!d) return null;
  const row = d.prepare(`SELECT * FROM detail_result WHERE session_id = ?`).get(sessionId);
  return row || null;
}

export function dbListMbtiResults(limit = 20) {
  const d = getDb();
  if (!d) return [] as any[];
  return d.prepare(`SELECT * FROM mbti_result ORDER BY datetime(created_at) DESC LIMIT ?`).all(limit);
}

export function dbListDetailResults(limit = 20) {
  const d = getDb();
  if (!d) return [] as any[];
  return d.prepare(`SELECT * FROM detail_result ORDER BY datetime(created_at) DESC LIMIT ?`).all(limit);
}
