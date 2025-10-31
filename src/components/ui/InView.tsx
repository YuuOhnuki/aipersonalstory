'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
    children: React.ReactNode;
    effect?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom-in';
    className?: string;
    rootMargin?: string;
};

export default function InView({
    children,
    effect = 'fade',
    className = '',
    rootMargin = '0px 0px -10% 0px',
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) setVisible(true);
                });
            },
            { root: null, rootMargin, threshold: 0.1 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [rootMargin]);
    const eff =
        effect === 'fade'
            ? 'animate-fade-in'
            : effect === 'slide-up'
              ? 'animate-slide-up'
              : effect === 'slide-left'
                ? 'animate-slide-left'
                : effect === 'slide-right'
                  ? 'animate-slide-right'
                  : effect === 'zoom-in'
                    ? 'animate-zoom-in'
                    : '';
    return (
        <div
            ref={ref}
            className={[visible ? eff : 'opacity-0', className]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </div>
    );
}
