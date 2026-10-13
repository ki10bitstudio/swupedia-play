/**
 * Links from the play site back to swupedia.com.
 *
 * `NEXT_PUBLIC_SWUPEDIA_URL` is the swupedia.com origin (default `https://swupedia.com`).
 * In development every "back to swupedia" destination goes to the local dev launcher at `/`
 * instead, so the play client is usable locally without running the swupedia website.
 */
export const SWUPEDIA_URL = (process.env.NEXT_PUBLIC_SWUPEDIA_URL || 'https://swupedia.com').replace(/\/+$/, '');

/** An absolute swupedia.com URL for `path` (which starts with `/`). */
export const swupediaUrl = (path: string): string => `${SWUPEDIA_URL}${path}`;

/**
 * Where the player goes when they leave the play site: swupedia.com's play console in
 * production, the local dev launcher in development. The target is fixed, never taken from
 * the URL, so the play site cannot be used as an open redirect.
 */
export const exitUrl = (): string =>
    process.env.NODE_ENV === 'development' ? '/' : swupediaUrl('/play');

/** Full-page navigation to `exitUrl()`, which also drops the socket. */
export const goToExit = (): void => {
    window.location.assign(exitUrl());
};
