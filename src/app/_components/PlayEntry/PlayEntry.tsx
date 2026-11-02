'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LaunchingState from './LaunchingState';
import { redeemTicket, ticketFromFragment } from '@/app/_utils/redeemTicket';
import { isPlaySessionLive, readPlaySession, storePlaySession } from '@/app/_utils/playSession';
import { exitUrl } from '@/app/_utils/siteUrls';

// Once per page load, not once per mount: React's Strict Mode runs effects twice in development,
// and a second redemption of the same ticket would come back `used`.
let started = false;

/**
 * The entry route. swupedia.com's Launch opens `/#ticket=<JWS>` in the same tab; this strips the
 * fragment, redeems the ticket with the bot server, stores the play session and opens the lobby.
 * A failure goes back to swupedia.com's console with the reason as its `launch` flag. Every
 * navigation replaces, so Back from the lobby goes to swupedia.com/play, never to a used ticket.
 *
 * The first render is the launching state, which the server already rendered (H1, H5).
 */
const PlayEntry: React.FC = () => {
    const router = useRouter();

    useEffect(() => {
        if (started) {
            return;
        }
        started = true;

        const openLobby = () => router.replace('/lobby');
        const leave = (...args: Parameters<typeof exitUrl>) => window.location.replace(exitUrl(...args));

        const ticket = ticketFromFragment(window.location.hash);
        // Before any request: the ticket leaves the address bar and history, and from here on it is
        // only in the redeem request's body. Anything else in the URL goes with it.
        window.history.replaceState(null, '', '/');

        if (!ticket) {
            // A refresh of this tab after the launch, or someone arriving with no ticket.
            const stored = readPlaySession();
            if (stored && isPlaySessionLive(stored)) {
                openLobby();
            } else {
                leave(stored ? 'ended' : undefined);
            }
            return;
        }

        router.prefetch('/lobby');
        redeemTicket(ticket).then((result) => {
            if (!result.ok) {
                leave(result.flag);
            } else if (!storePlaySession(result.playSession)) {
                // Without storage the lobby can't find the session; the ticket is spent either way.
                leave('failed');
            } else {
                openLobby();
            }
        });
    }, [router]);

    return <LaunchingState />;
};

export default PlayEntry;
