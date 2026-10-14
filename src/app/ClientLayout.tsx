// ClientLayout.tsx
'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { GameProvider } from '@/app/_contexts/Game.context';
import LaunchingState from '@/app/_components/PlayEntry/LaunchingState';

// While the providers' chunk loads on the way into the lobby, keep showing the launch rather than
// an empty page. Elsewhere (the board, the dev launcher) the plain Ground shows, as before.
const ProvidersLoading = () => (usePathname() === '/lobby' ? <LaunchingState /> : null);

const ClientProviders = dynamic(
    () => import('@/app/_components/ClientProviders/ClientProviders'),
    { ssr: false, loading: ProvidersLoading }
);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const path = usePathname();
    const pagesWithWebsocket = ['/GameBoard', '/lobby'];
    const isPageWithWebsocket = pagesWithWebsocket.includes(path);

    // In production the entry route is the launching state alone: it renders on the server and
    // mounts no context while the ticket is redeemed. (In development / is the dev launcher, which
    // needs the providers.)
    if (path === '/' && process.env.NODE_ENV !== 'development') {
        return <>{children}</>;
    }

    return (
        <>
            {isPageWithWebsocket ? (
                <ClientProviders>
                    <GameProvider>
                        {children}
                    </GameProvider>
                </ClientProviders> 
            ) : (
                <ClientProviders>
                    {children}
                </ClientProviders>
            )}
        </>
    );
}
