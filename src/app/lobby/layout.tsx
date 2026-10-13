import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Lobby',
};

export default function LobbyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
