import React from 'react';
import SwupediaMark from '@/assets/swupedia-mark.svg';
import '@/app/_theme/launching.css';

/**
 * "Launching…": swupedia.com's header band with the swupedia mark, and the busy Launch button from
 * its play console, on Ground. The entry route shows it while the ticket is redeemed, and the lobby keeps showing
 * it until the first lobby state arrives, so the member sees one launch from the console to the
 * lobby rather than a second loading screen. No hooks and no MUI: in production the entry route
 * renders it on the server, before any client JS.
 */
const LaunchingState: React.FC = () => (
    <div className="swu-launching">
        <header className="swu-launching__header">
            <div className="swu-launching__masthead">
                <SwupediaMark className="swu-launching__mark" />
            </div>
        </header>
        <main className="swu-launching__main">
            <div className="swu-launching__bar" role="status" aria-live="polite">
                <span className="swu-launching__button">
                    {/* lucide's loader-circle, the icon of swupedia.com's Spinner. */}
                    <svg
                        className="swu-launching__spinner"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Launching…
                </span>
                <p className="swu-launching__status">Opening the play site…</p>
            </div>
        </main>
    </div>
);

export default LaunchingState;
