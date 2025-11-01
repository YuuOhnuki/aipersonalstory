const HORDE_API = 'https://stablehorde.net';

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export type HordeImageResult = {
    buffer: Buffer;
    mime: string;
    id: string;
    waitedSecs: number;
    polls: number;
};

export type HordeProgress = {
    status: 'submitted' | 'checking' | 'done' | 'error';
    id?: string;
    polls?: number;
    waitedSecs?: number;
    message?: string;
    updatedAt: number;
};

export const hordeProgress = new Map<string, HordeProgress>();

export async function generateWithHorde(
    prompt: string,
    opts?: {
        width?: number;
        height?: number;
        steps?: number;
        cfg_scale?: number;
        timeoutMs?: number;
        progressKey?: string;
        models?: string[];
    }
) {
    const apikey = process.env.STABLE_HORDE_API_KEY || '0000000000'; // anonymous key
    const clientAgent = 'aipersonalstory/1.0 (StableHorde)';

    const width = Math.max(
        64,
        Math.min(1536, Math.round((opts?.width ?? 768) / 64) * 64)
    );
    const height = Math.max(
        64,
        Math.min(1536, Math.round((opts?.height ?? 768) / 64) * 64)
    );
    const steps = opts?.steps ?? 20;
    const cfg_scale = opts?.cfg_scale ?? 7;
    const timeoutMs = opts?.timeoutMs ?? 60000; // 60s

    const submitRes = await fetch(`${HORDE_API}/api/v2/generate/async`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: apikey,
            'Client-Agent': clientAgent,
        },
        body: JSON.stringify({
            prompt,
            params: {
                width,
                height,
                steps,
                cfg_scale,
                sampler_name: 'k_euler_a',
                n: 1,
            },
            models:
                Array.isArray(opts?.models) && opts!.models!.length > 0
                    ? opts!.models
                    : undefined,
            nsfw: false,
            censor_nsfw: true,
        }),
    });

    if (!submitRes.ok) {
        console.error('[horde] submit failed', {
            status: submitRes.status,
            progressKey: opts?.progressKey,
        });
        throw new Error(`Horde submit failed: ${submitRes.status}`);
    }
    const submitJson: any = await submitRes.json();
    const id: string = submitJson.id;
    if (!id) throw new Error('Horde submit missing id');

    if (opts?.progressKey) {
        hordeProgress.set(opts.progressKey, {
            status: 'submitted',
            id,
            updatedAt: Date.now(),
        });
        console.info('[horde] submitted', {
            id,
            progressKey: opts.progressKey,
            size: `${width}x${height}`,
            steps,
            cfg_scale,
        });
    }

    const start = Date.now();
    let polls = 0;
    while (true) {
        const checkRes = await fetch(
            `${HORDE_API}/api/v2/generate/check/${id}`,
            {
                headers: {
                    apikey: apikey,
                    'Client-Agent': clientAgent,
                },
                cache: 'no-store',
            }
        );
        if (!checkRes.ok) throw new Error('Horde check failed');
        const ch: any = await checkRes.json();
        polls++;
        if (opts?.progressKey) {
            hordeProgress.set(opts.progressKey, {
                status: 'checking',
                id,
                polls,
                updatedAt: Date.now(),
            });
            console.debug('[horde] checking', {
                id,
                progressKey: opts.progressKey,
                polls,
                done: !!ch.done,
                wait_time: ch.wait_time,
            });
        }
        if (ch.done) break;
        if (Date.now() - start > timeoutMs)
            throw new Error('Horde generation timed out');
        const wait = typeof ch.wait_time === 'number' ? ch.wait_time : 2;
        await sleep(Math.max(1000, wait * 1000));
    }

    const statusRes = await fetch(`${HORDE_API}/api/v2/generate/status/${id}`, {
        headers: {
            apikey: apikey,
            'Client-Agent': clientAgent,
        },
        cache: 'no-store',
    });
    if (!statusRes.ok) throw new Error('Horde status failed');
    const status: any = await statusRes.json();
    const gen = status.generations?.[0];
    if (!gen?.img) throw new Error('Horde returned no image');
    const b64: string = gen.img;
    // Horde typically returns webp; default to webp if mime missing
    const mime: string = gen.mime || 'image/webp';
    const buffer = Buffer.from(b64, 'base64');
    const waitedSecs = Math.round((Date.now() - start) / 1000);
    if (opts?.progressKey) {
        hordeProgress.set(opts.progressKey, {
            status: 'done',
            id,
            polls,
            waitedSecs,
            updatedAt: Date.now(),
        });
        console.info('[horde] done', {
            id,
            progressKey: opts.progressKey,
            polls,
            waitedSecs,
            mime,
        });
    }
    return { buffer, mime, id, waitedSecs, polls } as HordeImageResult;
}
