'use client';

// Development-only stand-in for the play ticket: paste a deck, pick a format, create a private
// lobby against the bot as the anonymous user, then open the lobby. page.tsx only imports this
// in development, so it is not part of the production client bundle.
import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, CircularProgress, MenuItem, TextField, Typography } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import { getUserPayload } from '@/app/_utils/ServerAndLocalStorageUtils';
import { getReadableDeckErrors } from '@/app/_validators/DeckValidation/getReadableDeckErrors';
import {
    DefaultFormat,
    FormatLabels,
    getFormatConfig,
    getFormatsFromConfig,
    LobbyFormatConfigs,
    SwuGameFormat,
} from '@/app/_constants/constants';

const DevLauncher: React.FC = () => {
    const router = useRouter();
    const { user, anonymousUserId } = useUser();
    const [deckText, setDeckText] = useState('');
    const [format, setFormat] = useState<SwuGameFormat>(DefaultFormat.format);
    const [lobbyName, setLobbyName] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors([]);

        let deck: unknown;
        try {
            deck = JSON.parse(deckText);
        } catch {
            setErrors(['The deck is not valid JSON. Paste a deck exported in swudb JSON format.']);
            return;
        }

        const cardPool = getFormatConfig(LobbyFormatConfigs, format)?.cardPools[0] ?? DefaultFormat.cardPool;
        const payload = {
            user: getUserPayload(user),
            deck,
            isPrivate: true,
            format,
            lobbyName,
            cardPool,
            gamesToWinMode: DefaultFormat.gamesToWinMode,
        };

        setIsCreating(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/create-lobby`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                const messages: string[] = [`Server returned ${response.status}.`];
                if (result.message) {
                    messages.push(result.message);
                }
                if (result.errors && Object.keys(result.errors).length > 0) {
                    messages.push(...getReadableDeckErrors(result.errors, format, cardPool));
                }
                setErrors(messages);
                return;
            }
            router.push('/lobby');
        } catch (error) {
            setErrors([`Could not reach the game server at ${process.env.NEXT_PUBLIC_ROOT_URL}.`, String(error)]);
        } finally {
            setIsCreating(false);
        }
    };

    // ----------------Styles----------------//
    const styles = {
        page: {
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            px: '16px',
            py: '3rem',
        },
        form: {
            width: '100%',
            maxWidth: '40rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
        },
        rubric: {
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#8aa2b8',
            mb: 0,
        },
        title: {
            fontSize: '1.75rem',
            fontWeight: 700,
            mb: 0,
        },
        hint: {
            fontSize: '0.85rem',
            color: '#8aa2b8',
            mb: 0,
        },
        field: {
            '& .MuiInputLabel-root': { color: '#8aa2b8' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#4cc2ff' },
            '& .MuiFormHelperText-root': { color: '#8aa2b8', mx: 0 },
        },
        deckInput: {
            '& .MuiInputLabel-root': { color: '#8aa2b8' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#4cc2ff' },
            '& textarea': {
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.8rem',
            },
        },
        errorBox: {
            border: '1px solid #ff6467',
            borderRadius: '6px',
            p: '0.75rem 1rem',
        },
        errorText: {
            color: '#ff6467',
            fontSize: '0.9rem',
            mb: '0.25rem',
        },
        createButton: {
            alignSelf: 'flex-start',
            minWidth: '9rem',
        },
    };

    return (
        <Box sx={styles.page} data-dev-launcher="swupedia-dev-launcher">
            <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
                <Typography sx={styles.rubric}>Development launcher</Typography>
                <Typography sx={styles.title}>Play the bot</Typography>
                <Typography sx={styles.hint}>
                    Stands in for the play ticket from swupedia.com. Creates a private lobby on {process.env.NEXT_PUBLIC_ROOT_URL} as
                    {' '}{user ? user.username : `anonymous ${anonymousUserId?.substring(0, 6) ?? ''}`}, then opens it.
                </Typography>

                <TextField
                    label="Deck (swudb JSON)"
                    multiline
                    minRows={8}
                    maxRows={20}
                    value={deckText}
                    onChange={(e) => setDeckText(e.target.value)}
                    placeholder={'{ "metadata": { "name": "…" }, "leader": { "id": "SOR_005", "count": 1 }, … }'}
                    sx={styles.deckInput}
                    required
                />

                <TextField
                    select
                    label="Format"
                    sx={styles.field}
                    value={format}
                    onChange={(e) => setFormat(e.target.value as SwuGameFormat)}
                >
                    {getFormatsFromConfig(LobbyFormatConfigs).map((f) => (
                        <MenuItem key={f} value={f}>{FormatLabels[f]}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    label="Lobby name"
                    sx={styles.field}
                    value={lobbyName}
                    onChange={(e) => setLobbyName(e.target.value)}
                    placeholder="vs greedy-v3-medium"
                    helperText={'A roster label in the name, such as "vs greedy-v3-medium", picks the bot\'s agent.'}
                />

                {errors.length > 0 && (
                    <Box sx={styles.errorBox} role="alert">
                        {errors.map((message, index) => (
                            <Typography key={index} sx={styles.errorText}>{message}</Typography>
                        ))}
                    </Box>
                )}

                <Button type="submit" variant="contained" disabled={isCreating || !deckText.trim()} sx={styles.createButton}>
                    {isCreating ? <CircularProgress size={20} /> : 'Create'}
                </Button>
            </Box>
        </Box>
    );
};

export default DevLauncher;
