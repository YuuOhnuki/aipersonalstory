import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import LiquidBackground from '@/components/LiquidBackground';
import ConsentBanner from '@/components/ConsentBanner';

import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'AI Personality Story',
        template: '%s | AI Personality Story',
    },
    description: '会話からMBTIを推定し、あなたの物語を生成する対話型Webアプリ',
    applicationName: 'AI Personality Story',
    openGraph: {
        type: 'website',
        url: siteUrl,
        siteName: 'AI Personality Story',
        title: 'AI Personality Story',
        description:
            '会話からMBTIを推定し、あなたの物語を生成する対話型Webアプリ',
        images: [
            {
                url: '/api/image/avatar?type=INFP&title=AI%20Personality%20Story',
                width: 800,
                height: 800,
            },
        ],
        locale: 'ja_JP',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Personality Story',
        description:
            '会話からMBTIを推定し、あなたの物語を生成する対話型Webアプリ',
        images: ['/api/image/avatar?type=INFP&title=AI%20Personality%20Story'],
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-[var(--background)] text-[var(--foreground)]`}
            >
                <LiquidBackground />
                <NavBar />
                <main className="mx-auto max-w-6xl px-4 animate-fade-in">
                    {children}
                </main>
                <Footer />
                <ConsentBanner />
                <Analytics />
            </body>
        </html>
    );
}
