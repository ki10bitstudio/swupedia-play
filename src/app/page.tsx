import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import PlayEntry from '@/app/_components/PlayEntry/PlayEntry';

// The tab keeps the title swupedia.com's console had when Launch was pressed. Absolute because the
// root layout's template doesn't apply to a page in its own segment.
export const metadata: Metadata = {
    title: { absolute: 'Play vs bot | SWUPedia' },
};

// The entry route.
// - production: the launching state, server-rendered outside ClientProviders (ClientLayout), then
//   PlayEntry redeems the ticket in the URL fragment and opens the lobby, or goes back to
//   swupedia.com/play. The fragment never reaches the server, so this route has to render.
// - development: the dev launcher, or PlayEntry when there is a ticket in the fragment (_dev/DevEntry).
// The dev import sits inside a branch on NODE_ENV, a build-time constant, so the production build
// drops it and the launcher never reaches the client bundle.
export default async function Home() {
    if (process.env.NODE_ENV === 'development') {
        const DevEntry: ComponentType = (await import('@/app/_dev/DevEntry')).default;
        return <DevEntry />;
    }
    return <PlayEntry />;
}
