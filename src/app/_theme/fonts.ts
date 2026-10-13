import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Inter } from 'next/font/google';

// swupedia.com's type, self-hosted by next/font under the same CSS variables swupedia-ui uses:
// Geist (--font-geist-sans) for everything, Geist Mono (--font-geist-mono) for code-like text and
// Inter (--font-rules) for card rules text.
export const geistSans = GeistSans;

export const geistMono = GeistMono;

export const rulesFont = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    variable: '--font-rules',
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${rulesFont.variable}`;
