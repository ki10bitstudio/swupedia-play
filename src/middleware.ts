import { NextRequest, NextResponse } from 'next/server';
import { exitUrl } from '@/app/_utils/siteUrls';
import { s3ImageURL } from '@/app/_utils/s3Utils';

// The play site is the entry route, the lobby and the board. Every other path is sent back where
// a player comes from, as a server-side 307: swupedia.com's play console in production, the dev
// launcher at / in development.
//
// / passes in every environment: the play ticket arrives in its URL fragment, which never reaches
// the server, so only the page itself can tell a launch from a stray visit.
const PAGES = new Set(['/', '/lobby', '/GameBoard']);

const originOf = (url: string | undefined): string => {
    try {
        return url ? new URL(url).origin : '';
    } catch {
        return '';
    }
};

// The bot server, over HTTP for the redeem call and the settings poll and over a WebSocket for the
// game, and the card-image host.
const BOT_ORIGIN = originOf(process.env.NEXT_PUBLIC_ROOT_URL);
const BOT_SOCKET_ORIGIN = BOT_ORIGIN.replace(/^http/, 'ws');
const IMAGE_ORIGIN = originOf(s3ImageURL(''));

/**
 * The production Content-Security-Policy. Scripts need this request's nonce, which Next applies to
 * its own script tags when it finds the policy on the request (so pages render per request; see
 * the root layout); scripts those load are trusted through 'strict-dynamic'. Styles allow inline
 * because Emotion (MUI) injects style tags at runtime.
 */
const contentSecurityPolicy = (nonce: string): string => [
    'default-src \'self\'',
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    'style-src \'self\' \'unsafe-inline\'',
    `img-src 'self' data: blob: ${IMAGE_ORIGIN}`,
    'font-src \'self\'',
    'media-src \'self\'',
    `connect-src 'self' ${BOT_ORIGIN} ${BOT_SOCKET_ORIGIN}`,
    'object-src \'none\'',
    'base-uri \'none\'',
    'form-action \'none\'',
    'frame-ancestors \'none\'',
].join('; ');

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    let response: NextResponse;

    if (!PAGES.has(pathname)) {
        // new URL handles both the relative dev exit and the absolute production one.
        response = NextResponse.redirect(new URL(exitUrl(), request.url));
    } else if (process.env.NODE_ENV === 'production') {
        const nonce = btoa(crypto.randomUUID());
        const policy = contentSecurityPolicy(nonce);
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('Content-Security-Policy', policy);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set('Content-Security-Policy', policy);
    } else {
        // Development runs without the policy: Next's dev client needs eval.
        response = NextResponse.next();
    }

    // Nothing on the play site is passed on as a Referer, in case a URL ever carries more than it
    // should.
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
}

export const config = {
    // Everything except Next's own files and files in public/ (paths with a dot).
    matcher: ['/((?!_next/|.*\\.).*)'],
};
