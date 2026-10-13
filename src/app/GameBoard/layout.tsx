import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Game',
};

export default function GameBoardLayout({ children }: { children: React.ReactNode }) {
    return children;
}
