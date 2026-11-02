import { clearPlaySession } from './playSession';

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
 * Why a player was sent back, as the `launch` query flag swupedia.com's play console shows as its
 * "Launch again" state. Ticket redemption failures map onto these (`redeemTicket.ts`); `ended` is
 * a game session the bot server no longer has.
 */
export const LAUNCH_FLAGS = ['expired', 'used', 'in-progress', 'busy', 'deck', 'bot-deck', 'failed', 'ended'] as const;

export type LaunchFlag = (typeof LAUNCH_FLAGS)[number];

export const isLaunchFlag = (value: unknown): value is LaunchFlag =>
    typeof value === 'string' && (LAUNCH_FLAGS as readonly string[]).includes(value);

/**
 * Where the player goes when they leave the play site: swupedia.com's play console in
 * production, the local dev launcher in development, with `?launch=<flag>` when there is a
 * reason to show. The target is fixed and the flag is the typed union, never a value taken from
 * the URL, so the play site cannot be used as an open redirect.
 *
 * Leaving ends the player's hold on the game in this tab, so this also clears the stored play
 * session (in the browser; a no-op on the server).
 */
export const exitUrl = (flag?: LaunchFlag): string => {
    clearPlaySession();
    const base = process.env.NODE_ENV === 'development' ? '/' : swupediaUrl('/play');
    return flag ? `${base}?launch=${flag}` : base;
};

/**
 * Full-page navigation to `exitUrl(flag)`, which also drops the socket. It replaces the current
 * history entry, so Back from swupedia.com does not land on the game that was just left.
 */
export const goToExit = (flag?: LaunchFlag): void => {
    window.location.replace(exitUrl(flag));
};
