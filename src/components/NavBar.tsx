'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from './ui/Button';

export default function NavBar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);
    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 dark:bg-black/20 border-b border-black/5 dark:border-white/10">
            <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between relative">
                <Link href="/" className="font-semibold tracking-tight">
                    Synchronauts
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                    <Link
                        href="/"
                        className={
                            pathname === '/'
                                ? 'text-black dark:text-white'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                        }
                    >
                        ホーム
                    </Link>
                    <Link
                        href="/chat"
                        className={
                            pathname?.startsWith('/chat')
                                ? 'text-black dark:text-white'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                        }
                    >
                        チャット
                    </Link>
                    <Link
                        href="/result"
                        className={
                            pathname?.startsWith('/result')
                                ? 'text-black dark:text-white'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                        }
                    >
                        結果
                    </Link>
                    <Link
                        href="/detail"
                        className={
                            pathname?.startsWith('/detail')
                                ? 'text-black dark:text-white'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                        }
                    >
                        詳細診断
                    </Link>
                    <Link
                        href="/history"
                        className={
                            pathname?.startsWith('/history')
                                ? 'text-black dark:text-white'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                        }
                    >
                        履歴
                    </Link>
                </nav>
                <button
                    type="button"
                    aria-label="メニュー"
                    className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={() => setMobileOpen((v) => !v)}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {mobileOpen ? (
                            <>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </>
                        ) : (
                            <>
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </>
                        )}
                    </svg>
                </button>
                <div className="hidden md:flex items-center gap-2">
                    <Link href="/chat">
                        <Button size="sm" variant="secondary">
                            はじめる
                        </Button>
                    </Link>
                </div>
                {mobileOpen && (
                    <div className="absolute top-full right-4 mt-2 w-56 rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg py-2 md:hidden">
                        <Link
                            href="/"
                            className={`block px-4 py-2 text-sm ${
                                pathname === '/'
                                    ? 'text-black dark:text-white'
                                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            ホーム
                        </Link>
                        <Link
                            href="/chat"
                            className={`block px-4 py-2 text-sm ${
                                pathname?.startsWith('/chat')
                                    ? 'text-black dark:text-white'
                                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            チャット
                        </Link>
                        <Link
                            href="/result"
                            className={`block px-4 py-2 text-sm ${
                                pathname?.startsWith('/result')
                                    ? 'text-black dark:text-white'
                                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            結果
                        </Link>
                        <Link
                            href="/detail"
                            className={`block px-4 py-2 text-sm ${
                                pathname?.startsWith('/detail')
                                    ? 'text-black dark:text-white'
                                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            詳細診断
                        </Link>
                        <Link
                            href="/history"
                            className={`block px-4 py-2 text-sm ${
                                pathname?.startsWith('/history')
                                    ? 'text-black dark:text-white'
                                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            履歴
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
