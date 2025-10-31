import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    const name = 'AI Personality Story';
    const short_name = 'AI Story';
    const description =
        '会話からMBTIを推定し、あなたの物語を生成する対話型Webアプリ';
    const start_url = '/';
    const theme_color = '#ffffff';
    const background_color = '#ffffff';
    const display: MetadataRoute.Manifest['display'] = 'standalone';

    return {
        name,
        short_name,
        description,
        start_url,
        scope: '/',
        lang: 'ja',
        dir: 'ltr',
        display,
        theme_color,
        background_color,
        icons: [
            { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
                src: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    };
}
