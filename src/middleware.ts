import { NextRequest, NextResponse } from 'next/server';
import { exitUrl } from '@/app/_utils/siteUrls';

// The play site is the entry route, the lobby and the board. Every other path is sent back where
// a player comes from, as a server-side 307: swupedia.com's play console in production, the dev
// launcher at / in development.
//
// / passes in every environment: the play ticket arrives in its URL fragment, which never reaches
// the server, so only the page itself can tell a launch from a stray visit.
const PAGES = new Set(['/', '/lobby', '/GameBoard']);

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (PAGES.has(pathname)) {
        return NextResponse.next();
    }
    // new URL handles both the relative dev exit and the absolute production one.
    return NextResponse.redirect(new URL(exitUrl(), request.url));
}

export const config = {
    // Everything except Next's own files and files in public/ (paths with a dot).
    matcher: ['/((?!_next/|.*\\.).*)'],
};
