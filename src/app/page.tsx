import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';
import { exitUrl } from '@/app/_utils/siteUrls';

// The entry route. The play ticket (a later unit) will be read here. Until then:
// - development: the dev launcher stands in for the ticket;
// - production: there is nothing to show without a ticket, so go to swupedia.com's play console
//   (src/middleware.ts answers / with a 307 before this renders; the redirect here is a fallback).
// The launcher's import sits inside a branch on NODE_ENV, a build-time constant, so the
// production build drops it and the launcher never reaches the client bundle.
export default async function Home() {
    if (process.env.NODE_ENV === 'development') {
        const DevLauncher: ComponentType = (await import('@/app/_dev/DevLauncher')).default;
        return <DevLauncher />;
    }
    redirect(exitUrl());
}
