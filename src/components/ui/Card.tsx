import React from 'react';
import { ComponentProps } from 'react';

export function Card({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            className={[
                'rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl shadow-sm',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...props}
        />
    );
}

export function CardBody({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            className={['p-6', className].filter(Boolean).join(' ')}
            {...props}
        />
    );
}

export default Card;
