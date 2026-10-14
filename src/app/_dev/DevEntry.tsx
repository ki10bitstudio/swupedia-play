'use client';

// Development's `/`: a launch link with a ticket in the fragment (`/#ticket=…`, signed by the bot
// repo's `pnpm play:sign` or a local swupedia.com) redeems against a local `pnpm serve` exactly as
// in production; anything else is the dev launcher, which plays against `pnpm karabast`
// anonymously. page.tsx only imports this in development.
import React, { useState } from 'react';
import DevLauncher from './DevLauncher';
import PlayEntry from '@/app/_components/PlayEntry/PlayEntry';
import { ticketFromFragment } from '@/app/_utils/redeemTicket';

const DevEntry: React.FC = () => {
    // In development `/` sits inside ClientProviders, which never renders on the server, so the
    // fragment can be read during the first render.
    const [hasTicket] = useState(() => ticketFromFragment(window.location.hash) !== null);
    return hasTicket ? <PlayEntry /> : <DevLauncher />;
};

export default DevEntry;
