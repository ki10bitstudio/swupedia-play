/**
 * Stand-in for next-auth's client API, which this site no longer has. A player is identified by the
 * play session the bot server hands back for a play ticket (see `playSession.ts`), not by a
 * sign-in, so there is never an authenticated session here.
 *
 * It keeps the shape the two upstream contexts read (`User.context`, `Game.context`), so only their
 * import lines differ from upstream and an upstream rebase stays cheap.
 */

export interface ISession {
    jwtToken?: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
        image?: string;
        provider: string;
        userId?: string;
    };
}

export type SessionStatus = 'authenticated' | 'unauthenticated' | 'loading';

export interface IUseSessionResult {
    data: ISession | null;
    status: SessionStatus;
    update: (data?: unknown) => Promise<ISession | null>;
}

// One object for the life of the page, so contexts that list the session in an effect's
// dependencies never see it change.
const UNAUTHENTICATED: IUseSessionResult = {
    data: null,
    status: 'unauthenticated',
    update: async () => null,
};

export const useSession = (): IUseSessionResult => UNAUTHENTICATED;

export const signIn: (...args: unknown[]) => void = () => {};

export const signOut: (...args: unknown[]) => void = () => {};
