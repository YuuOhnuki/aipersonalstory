function hash(str: string) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h >>> 0;
}

function pick<T>(arr: T[], n: number) {
    return arr[n % arr.length];
}

export function deriveAnimalFromPersonality(
    mbti: string,
    bigFive?: {
        openness?: number;
        conscientiousness?: number;
        extraversion?: number;
        agreeableness?: number;
        neuroticism?: number;
    },
    featuresText?: string
) {
    const type = (mbti || '').toUpperCase().slice(0, 4);
    const seed = hash(
        type + ':' + JSON.stringify(bigFive || {}) + ':' + (featuresText || '')
    );
    const bf = bigFive || {};
    const entries = Object.entries({
        Openness: bf.openness ?? 0,
        Conscientiousness: bf.conscientiousness ?? 0,
        Extraversion: bf.extraversion ?? 0,
        Agreeableness: bf.agreeableness ?? 0,
        Neuroticism: bf.neuroticism ?? 0,
    }).sort((a, b) => (b[1] as number) - (a[1] as number));
    const top = entries[0]?.[0] || '';

    // Heuristic mapping
    const byBigFive: Record<string, string[]> = {
        Openness: ['fox', 'owl', 'cat'],
        Conscientiousness: ['beaver', 'ant', 'tortoise'],
        Extraversion: ['dog', 'parrot', 'dolphin'],
        Agreeableness: ['deer', 'rabbit', 'dolphin'],
        Neuroticism: ['hedgehog', 'rabbit', 'cat'],
    };
    const byMBTI: Record<string, string[]> = {
        E: ['dog', 'parrot', 'lion'],
        I: ['cat', 'owl', 'fox'],
        N: ['fox', 'owl', 'butterfly'],
        S: ['deer', 'beaver', 'tortoise'],
        T: ['wolf', 'hawk', 'bear'],
        F: ['rabbit', 'deer', 'dolphin'],
        J: ['beaver', 'ant', 'tortoise'],
        P: ['fox', 'cat', 'monkey'],
    };

    const candidates: string[] = [];
    if (top && byBigFive[top]) candidates.push(...byBigFive[top]);
    if (type[0] && byMBTI[type[0]]) candidates.push(...byMBTI[type[0]]);
    if (type[1] && byMBTI[type[1]]) candidates.push(...byMBTI[type[1]]);
    if (type[2] && byMBTI[type[2]]) candidates.push(...byMBTI[type[2]]);
    if (type[3] && byMBTI[type[3]]) candidates.push(...byMBTI[type[3]]);
    const animal = candidates.length
        ? pick(candidates, seed)
        : pick(['cat', 'dog', 'fox', 'deer'], seed);

    // Style hints
    const style =
        'deformed, cute mascot style, clean vector aesthetics, soft gradients, pastel palette, centered composition, white background, high detail, friendly eyes';

    return { animal, style };
}

export function generateAvatarSVG(type: string, seedText = '') {
    const seed = hash(type + ':' + seedText);
    const palette = [
        '#6366f1',
        '#a855f7',
        '#ec4899',
        '#06b6d4',
        '#10b981',
        '#f59e0b',
    ];
    const bg = pick(palette, seed);
    const fg = pick(palette, (seed >> 3) ^ 0x9e3779b1);
    const accent = pick(palette, (seed >> 5) ^ 0x85ebca6b);
    const letter = type.slice(0, 2);
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/>
    </filter>
  </defs>
  <rect width="100" height="100" rx="16" fill="url(#g)"/>
  <g opacity="0.35" filter="url(#b)">
    <circle cx="${20 + (seed % 60)}" cy="${25 + (seed % 40)}" r="18" fill="#fff"/>
    <circle cx="${50 + (seed % 30)}" cy="${55 + (seed % 30)}" r="14" fill="#fff"/>
  </g>
  <g>
    <circle cx="35" cy="45" r="6" fill="#fff"/>
    <circle cx="65" cy="45" r="6" fill="#fff"/>
    <path d="M30 62 C 42 72, 58 72, 70 62" stroke="${fg}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  <text x="50" y="18" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#fff" opacity="0.9">${letter}</text>
</svg>`;
}

export function generateSceneSVG(type: string, title = '') {
    const seed = hash(type + ':scene:' + title);
    const sky = ['#e0f2fe', '#eff6ff', '#fef3c7', '#ecfeff'];
    const ground = ['#dcfce7', '#e9d5ff', '#fee2e2', '#fde68a'];
    const skyC = pick(sky, seed);
    const groundC = pick(ground, seed >> 2);
    const sun = ['#f59e0b', '#f97316', '#ef4444'];
    const sunC = pick(sun, seed >> 4);
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skyC}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#sky)"/>
  <circle cx="${200 + (seed % 600)}" cy="${120 + (seed % 120)}" r="60" fill="${sunC}" opacity="0.85"/>
  <path d="M0 420 C 200 360, 400 480, 600 420 C 800 360, 1000 480, 1200 420 L 1200 630 L 0 630 Z" fill="${groundC}"/>
  <text x="600" y="520" text-anchor="middle" font-family="serif" font-size="42" fill="#111827" opacity="0.8">${type}</text>
  <text x="600" y="560" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#374151" opacity="0.8">${title.slice(0, 40)}</text>
</svg>`;
}
