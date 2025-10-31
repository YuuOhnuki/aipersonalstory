import React from 'react';
import { ComponentProps } from 'react';

export function Section({ className, ...props }: ComponentProps<'section'>) {
    return (
        <section
            className={['py-16 md:py-24', className].filter(Boolean).join(' ')}
            {...props}
        />
    );
}

export default Section;
