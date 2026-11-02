import { IPlaySession, parsePlaySession } from './playSession';
import { LaunchFlag } from './siteUrls';

/**
 * Redeeming a play ticket with the bot server (`POST /api/play/redeem`), the contract in
 * swupedia-ui's docs/plans/play-vs-bot.md ("The contract between the play client and the bot
 * server"). The ticket travels only in this request's body: never in a URL, never with cookies.
 */

export type RedeemResult =
    | { ok: true; playSession: IPlaySession }
    | { ok: false; flag: LaunchFlag };

/** A redemption that hasn't answered by then counts as failed. */
export const REDEEM_TIMEOUT_MS = 15_000;

// The bot server's error codes that swupedia.com's console has its own sentence for. Every other
// code (malformed, invalid, roster, failed, anything unknown) reads as `failed`. A Map, so a code
// such as "constructor" can't pick up an Object.prototype member.
const FLAG_FOR_ERROR = new Map<string, LaunchFlag>([
    ['expired', 'expired'],
    ['used', 'used'],
    ['in-progress', 'in-progress'],
    ['busy', 'busy'],
    ['deck', 'deck'],
    ['bot-deck', 'bot-deck'],
]);

/** The ticket from the launch link's fragment (`#ticket=<JWS>`), or null when it has none. */
export const ticketFromFragment = (hash: string): string | null => {
    const ticket = new URLSearchParams(hash.replace(/^#/, '')).get('ticket');
    return ticket ? ticket : null;
};

export const redeemTicket = async (ticket: string): Promise<RedeemResult> => {
    const failed: RedeemResult = { ok: false, flag: 'failed' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REDEEM_TIMEOUT_MS);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/play/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket }),
            credentials: 'omit',
            cache: 'no-store',
            referrerPolicy: 'no-referrer',
            signal: controller.signal,
        });
        const body: unknown = await response.json().catch(() => null);
        if (response.ok) {
            const playSession = parsePlaySession(body);
            return playSession ? { ok: true, playSession } : failed;
        }
        const code = typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined;
        const flag = typeof code === 'string' ? FLAG_FOR_ERROR.get(code) : undefined;
        return flag ? { ok: false, flag } : failed;
    } catch {
        // Unreachable server, CORS refusal, or the timeout's abort.
        return failed;
    } finally {
        clearTimeout(timer);
    }
};
