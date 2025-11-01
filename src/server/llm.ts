// LLM provider adapter: Web API first (Gemini / Groq), then local @xenova/transformers as fallback.

export type ProviderName =
    | 'gemini'
    | 'groq'
    | 'local'
    | 'disabled'
    | 'last_resort';
export type GenMeta = { text: string; provider: ProviderName };

let generationPipeline: any | null = null;
let loadError: Error | null = null;

async function generateWithGemini(
    prompt: string,
    options?: { max_new_tokens?: number; temperature?: number }
) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: options?.temperature ?? 0.5,
            maxOutputTokens: options?.max_new_tokens ?? 200,
        },
    } as any;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .join('');
    return (text ?? '').toString();
}

async function generateWithGroq(
    prompt: string,
    options?: { max_new_tokens?: number; temperature?: number }
) {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    const model = process.env.GROQ_MODEL || 'llama3-8b-instant';
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
        model,
        temperature: options?.temperature ?? 0.5,
        max_tokens: options?.max_new_tokens ?? 200,
        messages: [
            {
                role: 'system',
                content:
                    'You are a helpful assistant that responds in Japanese when the user writes Japanese.',
            },
            { role: 'user', content: prompt },
        ],
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    return (text ?? '').toString();
}

async function getLocalGenerator() {
    if (generationPipeline) return generationPipeline;
    try {
        const transformers = await import('@xenova/transformers');
        const { pipeline, env } = transformers as any;
        env.allowRemoteModels = true;
        env.localModelPath = undefined;
        const modelId = process.env.LLM_MODEL || 'Xenova/Qwen2.5-0.5B-Instruct';
        generationPipeline = await pipeline('text-generation', modelId, {
            dtype: 'q8',
        });
        return generationPipeline;
    } catch (e: any) {
        loadError = e instanceof Error ? e : new Error(String(e));
        return null;
    }
}

export async function generateTextWithMeta(
    prompt: string,
    options?: { max_new_tokens?: number; temperature?: number }
): Promise<GenMeta> {
    // Prefer web providers if configured
    const provider = (process.env.WEB_LLM_PROVIDER || '').toLowerCase();
    try {
        if (provider === 'gemini') {
            const t = await generateWithGemini(prompt, options);
            if (t) return { text: t, provider: 'gemini' };
        } else if (provider === 'groq') {
            const t = await generateWithGroq(prompt, options);
            if (t) return { text: t, provider: 'groq' };
        }
    } catch (e) {
        console.warn('[llm] web provider error:', e);
    }

    // Local fallback (unless disabled)
    if (process.env.DISABLE_LOCAL_LLM === 'true') {
        const genericReply = '了解しました。もう少し詳しく教えてください。';
        return { text: genericReply, provider: 'disabled' };
    }
    const pipe = await getLocalGenerator();
    if (pipe) {
        const out = await pipe(prompt, {
            max_new_tokens: options?.max_new_tokens ?? 200,
            temperature: options?.temperature ?? 0.5,
            do_sample: true,
            top_p: 0.9,
        });
        const text: string = Array.isArray(out)
            ? (out[0]?.generated_text ?? '')
            : (out?.generated_text ?? String(out ?? ''));
        return { text, provider: 'local' };
    }

    // Last-resort fallback
    const trimmed = prompt.slice(0, 2000);
    const genericReply = '了解しました。もう少し詳しく教えてください。';
    const last =
        trimmed.split(/\n|。/).filter(Boolean).slice(-1)[0]?.trim() ?? '';
    return {
        text: last ? `${genericReply}` : genericReply,
        provider: 'last_resort',
    };
}

export async function generateText(
    prompt: string,
    options?: { max_new_tokens?: number; temperature?: number }
): Promise<string> {
    const { text } = await generateTextWithMeta(prompt, options);
    return text;
}
