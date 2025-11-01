import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const routes: string[] = [
        '/',
        '/chat',
        '/history',
        '/detail',
        '/result',
        '/share',
    ];

    const now = new Date();

    return routes.map((path) => ({
        url: `${siteUrl}${path}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: path === '/' ? 1.0 : 0.7,
    }));
}
