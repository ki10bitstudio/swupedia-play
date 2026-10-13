import { NextRequest, NextResponse } from 'next/server';
import { exitUrl } from '@/app/_utils/siteUrls';

// The play site is the lobby and the board. Every other path is sent back where a player
// comes from, as a server-side 307: swupedia.com's play console in production, the dev
// launcher at / in development (where / itself is served).
const PAGES = new Set(['/lobby', '/GameBoard']);

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (PAGES.has(pathname)) {
        return NextResponse.next();
    }
    if (process.env.NODE_ENV === 'development') {
        return pathname === '/' ? NextResponse.next() : NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.redirect(exitUrl());
}

export const config = {
    // Everything except Next's own files, the auth API and files in public/ (paths with a dot).
    matcher: ['/((?!_next/|api/auth/|.*\\.).*)'],
};
