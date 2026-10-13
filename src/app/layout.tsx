// layout.tsx
import type { Metadata, Viewport } from 'next';
import React from 'react';
import ClientLayout from './ClientLayout';
import { fontVariables } from './_theme/fonts';
import './_theme/firstPaint.css';
import './_utils/s3Utils';

export const metadata: Metadata = {
    title: { template: '%s | SWUPedia', default: 'SWUPedia' },
    description: 'Play Star Wars: Unlimited against the SWUPedia bot.',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#01070f',
    colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${fontVariables} dark`}>
            <body>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
