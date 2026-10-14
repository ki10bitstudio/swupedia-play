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
    // In development / is the dev launcher, which is where exitUrl() points, so let it through.
    if (process.env.NODE_ENV === 'development' && pathname === '/') {
        return NextResponse.next();
    }
    // new URL handles both the relative dev exit and the absolute production one.
    return NextResponse.redirect(new URL(exitUrl(), request.url));
}

export const config = {
    // Everything except Next's own files and files in public/ (paths with a dot).
    matcher: ['/((?!_next/|.*\\.).*)'],
};
