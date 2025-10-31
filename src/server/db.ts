import { Message } from '@/types/conversation';
import { MBTIMap } from '@/types/mbti';

let pool: any | null = null;

async function getPool() {
    if (pool) return pool;
    try {
        const { Pool } = await import('pg');
        const connectionString =
            process.env.DATABASE_URL ||
            process.env.POSTGRES_URL ||
            process.env.PG_CONNECTION_STRING ||
            '';
        if (!connectionString) {
            throw new Error(
                'DATABASE_URL is not set. Please set your Railway Postgres URL in .env.local as DATABASE_URL.'
            );
        }
        // Parse the URL ourselves to avoid framework URL polyfill edge cases
        let host = '';
        let port = 5432;
        let user = '';
        let password = '';
        let database = '';
        try {
            const u = new URL(connectionString);
            host = u.hostname;
            port = u.port ? Number(u.port) : 5432;
            user = decodeURIComponent(u.username);
            password = decodeURIComponent(u.password);
            database = u.pathname.replace(/^\//, '');
        } catch (e) {
            console.warn('[db] Invalid DATABASE_URL format:', e);
            throw e;
        }
        pool = new Pool({
            host,
            port,
            user,
            password,
            database,
            ssl: { rejectUnauthorized: false },
        });
        console.info(
            '[db] Connected to Postgres at',
            host + ':' + port,
            'db=',
            database
        );
        // Init schema
        await pool
            .query(
                `
      CREATE TABLE IF NOT EXISTS user_session (
        id TEXT PRIMARY KEY,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS conversation_log (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES user_session(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS mbti_result (
        session_id TEXT PRIMARY KEY REFERENCES user_session(id),
        result_id TEXT UNIQUE,
        e_i TEXT,
        s_n TEXT,
        t_f TEXT,
        j_p TEXT,
        type TEXT,
        title TEXT,
        summary TEXT,
        story TEXT,
        features TEXT,
        reasons TEXT,
        advice TEXT,
        avatar_url TEXT,
        scene_url TEXT,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS detail_result (
        session_id TEXT PRIMARY KEY REFERENCES user_session(id),
        result_id TEXT UNIQUE,
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
        advice TEXT,
        avatar_url TEXT,
        scene_url TEXT,
        created_at TIMESTAMPTZ NOT NULL
      );
    `
            )
            .catch((e: any) => {
                console.warn('[db] Schema init failed:', e);
                throw e;
            });
        // Best-effort add columns on existing DBs
        await pool
            .query(
                `DO $$ BEGIN
          BEGIN
            ALTER TABLE mbti_result ADD COLUMN IF NOT EXISTS result_id TEXT UNIQUE;
          EXCEPTION WHEN others THEN END;
          BEGIN
            ALTER TABLE detail_result ADD COLUMN IF NOT EXISTS result_id TEXT UNIQUE;
          EXCEPTION WHEN others THEN END;
        END $$;`
            )
            .catch(() => {});
    } catch (e) {
        console.warn('Postgres unavailable:', e);
        pool = null;
    }
    return pool;
}

export async function dbEnsureSession(id: string, startedAt: string) {
    const p = await getPool();
    if (!p) return;
    await p.query(
        `INSERT INTO user_session (id, start_time) VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
        [id, startedAt]
    );
}

export async function dbAppendMessage(sessionId: string, msg: Message) {
    const p = await getPool();
    if (!p) return;
    await p.query(
        `INSERT INTO conversation_log (session_id, role, content, created_at) VALUES ($1, $2, $3, $4)`,
        [sessionId, msg.role, msg.content, msg.createdAt]
    );
}

export async function dbSaveMbtiResult(
    sessionId: string,
    axes: MBTIMap,
    type: string,
    title: string,
    summary: string,
    story: string,
    extras?: {
        features?: string;
        reasons?: string;
        advice?: string;
        avatar_url?: string;
        scene_url?: string;
        result_id?: string;
    }
) {
    const p = await getPool();
    if (!p) return;
    await p.query(
        `INSERT INTO mbti_result (session_id, result_id, e_i, s_n, t_f, j_p, type, title, summary, story, features, reasons, advice, avatar_url, scene_url, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (session_id) DO UPDATE SET
       result_id = COALESCE(mbti_result.result_id, EXCLUDED.result_id),
       e_i = EXCLUDED.e_i, s_n = EXCLUDED.s_n, t_f = EXCLUDED.t_f, j_p = EXCLUDED.j_p,
       type = EXCLUDED.type, title = EXCLUDED.title, summary = EXCLUDED.summary, story = EXCLUDED.story,
       features = EXCLUDED.features, reasons = EXCLUDED.reasons, advice = EXCLUDED.advice,
       avatar_url = EXCLUDED.avatar_url, scene_url = EXCLUDED.scene_url, created_at = EXCLUDED.created_at`,
        [
            sessionId,
            extras?.result_id ?? null,
            axes['E/I'],
            axes['S/N'],
            axes['T/F'],
            axes['J/P'],
            type,
            title,
            summary,
            story,
            extras?.features ?? null,
            extras?.reasons ?? null,
            extras?.advice ?? null,
            extras?.avatar_url ?? null,
            extras?.scene_url ?? null,
            new Date().toISOString(),
        ]
    );
}

export async function dbSaveDetailResult(
    sessionId: string,
    payload: {
        mbti_type: string;
        bigFive: {
            openness: number;
            conscientiousness: number;
            extraversion: number;
            agreeableness: number;
            neuroticism: number;
        };
        supplements: {
            stressTolerance: number;
            adaptability: number;
            valueFlexibility: number;
        };
        summaryText: string;
        story?: string;
        advice?: string;
        avatar_url?: string;
        scene_url?: string;
        result_id?: string;
    }
) {
    const p = await getPool();
    if (!p) return;
    await p.query(
        `INSERT INTO detail_result (
      session_id, result_id, mbti_type, openness, conscientiousness, extraversion, agreeableness, neuroticism,
      stressTolerance, adaptability, valueFlexibility, summaryText, story, advice, avatar_url, scene_url, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT (session_id) DO UPDATE SET
      result_id = COALESCE(detail_result.result_id, EXCLUDED.result_id),
      mbti_type = EXCLUDED.mbti_type,
      openness = EXCLUDED.openness,
      conscientiousness = EXCLUDED.conscientiousness,
      extraversion = EXCLUDED.extraversion,
      agreeableness = EXCLUDED.agreeableness,
      neuroticism = EXCLUDED.neuroticism,
      stressTolerance = EXCLUDED.stressTolerance,
      adaptability = EXCLUDED.adaptability,
      valueFlexibility = EXCLUDED.valueFlexibility,
      summaryText = EXCLUDED.summaryText,
      story = EXCLUDED.story,
      advice = EXCLUDED.advice,
      avatar_url = EXCLUDED.avatar_url,
      scene_url = EXCLUDED.scene_url,
      created_at = EXCLUDED.created_at
    `,
        [
            sessionId,
            payload.result_id ?? null,
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
            payload.advice ?? null,
            payload.avatar_url ?? null,
            payload.scene_url ?? null,
            new Date().toISOString(),
        ]
    );
}

export async function dbGetMbtiResult(sessionId: string) {
    const p = await getPool();
    if (!p) return null;
    const { rows } = await p.query(
        `SELECT * FROM mbti_result WHERE session_id = $1`,
        [sessionId]
    );
    return rows[0] || null;
}

export async function dbGetMbtiResultById(resultId: string) {
    const p = await getPool();
    if (!p) return null;
    const { rows } = await p.query(
        `SELECT * FROM mbti_result WHERE result_id = $1`,
        [resultId]
    );
    return rows[0] || null;
}

export async function dbGetMbtiResultByAny(idOrSession: string) {
    return (
        (await dbGetMbtiResultById(idOrSession)) ||
        (await dbGetMbtiResult(idOrSession))
    );
}

export async function dbGetDetailResult(sessionId: string) {
    const p = await getPool();
    if (!p) return null;
    const { rows } = await p.query(
        `SELECT * FROM detail_result WHERE session_id = $1`,
        [sessionId]
    );
    return rows[0] || null;
}

export async function dbGetDetailResultById(resultId: string) {
    const p = await getPool();
    if (!p) return null;
    const { rows } = await p.query(
        `SELECT * FROM detail_result WHERE result_id = $1`,
        [resultId]
    );
    return rows[0] || null;
}

export async function dbGetDetailResultByAny(idOrSession: string) {
    return (
        (await dbGetDetailResultById(idOrSession)) ||
        (await dbGetDetailResult(idOrSession))
    );
}

export async function dbListMbtiResults(limit = 20) {
    const p = await getPool();
    if (!p) return [] as any[];
    const { rows } = await p.query(
        `SELECT * FROM mbti_result ORDER BY created_at DESC LIMIT $1`,
        [limit]
    );
    return rows;
}

export async function dbListDetailResults(limit = 20) {
    const p = await getPool();
    if (!p) return [] as any[];
    const { rows } = await p.query(
        `SELECT * FROM detail_result ORDER BY created_at DESC LIMIT $1`,
        [limit]
    );
    return rows;
}
