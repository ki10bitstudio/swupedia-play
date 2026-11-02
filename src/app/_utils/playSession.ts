/**
 * The play session: what the bot server hands back for a redeemed play ticket, and what the lobby
 * and board connect with (`auth: { playSession }` on the socket).
 *
 * It lives in `sessionStorage`, so a refresh in the same tab returns to the game while other tabs
 * and later visits don't get it. Every way off the play site clears it (`exitUrl()` in
 * `siteUrls.ts`). The secret is never logged.
 */

export const PLAY_SESSION_KEY = 'swupedia.play.session';

export interface IPlaySession {

    /** The game-session secret: 256 bits, base64url (43 characters). */
    session: string;

    /** The user id the bot server assigned for this game; the board's connected player. */
    userId: string;

    /** The ticket's username, as the bot server cleaned it up. */
    username: string;

    /** When the game is ended by the server at the latest, epoch seconds. */
    deadline: number;
}

const SESSION_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** An `IPlaySession` from untrusted JSON (the redeem response, or storage), or null if it isn't one. */
export const parsePlaySession = (value: unknown): IPlaySession | null => {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const { session, userId, username, deadline } = value as Record<string, unknown>;
    if (
        typeof session !== 'string' || !SESSION_PATTERN.test(session) ||
        typeof userId !== 'string' || userId.length === 0 || userId.length > 128 ||
        typeof username !== 'string' ||
        typeof deadline !== 'number' || !Number.isFinite(deadline)
    ) {
        return null;
    }
    return { session, userId, username, deadline };
};

/** The stored session, or null when there is none (or storage is unavailable). */
export const readPlaySession = (): IPlaySession | null => {
    try {
        const raw = window.sessionStorage.getItem(PLAY_SESSION_KEY);
        return raw ? parsePlaySession(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
};

/** Stores the session for this tab. False when storage refused it. */
export const storePlaySession = (playSession: IPlaySession): boolean => {
    try {
        window.sessionStorage.setItem(PLAY_SESSION_KEY, JSON.stringify(playSession));
        return true;
    } catch {
        return false;
    }
};

/** Forgets the session. A no-op on the server. */
export const clearPlaySession = (): void => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.sessionStorage.removeItem(PLAY_SESSION_KEY);
    } catch {
        // Storage unavailable: there is nothing stored to clear.
    }
};

/** True while the session's deadline has not passed. */
export const isPlaySessionLive = (playSession: IPlaySession, now: number = Date.now()): boolean =>
    playSession.deadline * 1000 > now;
