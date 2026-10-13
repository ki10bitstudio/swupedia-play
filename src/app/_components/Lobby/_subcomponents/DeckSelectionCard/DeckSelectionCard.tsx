import React, { ChangeEvent, useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Link,
    Tooltip,
    Checkbox,
    FormControlLabel,
    Divider,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps, IDeckSelectionCardProps } from '@/app/_components/Lobby/LobbyTypes';
import LobbyReadyButtons from '@/app/_components/Lobby/_subcomponents/LobbyReadyButtons/LobbyReadyButtons';
import {
    IDeckValidationFailures,
    DeckValidationFailureReason,
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { DefaultFormat, GamesToWinMode, IMatchConfiguration } from '@/app/_constants/constants';
import { useDeckErrors } from '@/app/_hooks/useDeckErrors';

// The deck always arrives with the lobby (swupedia.com sends it), so this card has no deck
// selection or import: it shows the ready controls, the deck's validation state and the
// private lobby's game settings.
const DeckSelectionCard: React.FC<IDeckSelectionCardProps> = ({
    readyStatus,
    owner,
}) => {
    const { lobbyState, connectedPlayer, sendLobbyMessage } = useGame();

    const [deckImportErrorsSeen, setDeckImportErrorsSeen] = useState(false);

    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;

    const matchConfig: IMatchConfiguration = {
        format: lobbyState?.gameFormat || DefaultFormat.format,
        cardPool: lobbyState?.cardPool || DefaultFormat.cardPool,
        gamesToWinMode: lobbyState?.winHistory.gamesToWinMode || DefaultFormat.gamesToWinMode,
    }

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;

    // Lobby settings
    const requestUndo = lobbyState?.settings.requestUndo || false;

    // For deck error display
    const { errorState, setError, clearErrorsFunc, setModalOpen } = useDeckErrors();
    const [displayError, setDisplayError] = useState(false);
    const [blockError, setBlockError] = useState(false);

    const opponentReady = opponentUser?.ready;
    const disableSettings = !owner || readyStatus || opponentReady;

    // ------------------------Additional functions------------------------//
    const handleChangeUndoSetting = async (checked: boolean) => {
        sendLobbyMessage(['updateSetting', 'requestUndo', checked]);
    };

    const hasSomeNonSideboardingErrors = (deckErrors: IDeckValidationFailures): boolean => {
        if (!deckErrors) return false;
        return Object.keys(deckErrors).some(key =>
            key !== DeckValidationFailureReason.MinMainboardSizeNotMet &&
            key !== DeckValidationFailureReason.MaxSideboardSizeExceeded
        );
    };

    // ------------------ Listen for changes to deckErrors ------------------ //
    useEffect(() => {
        // get error messages
        const deckErrors: IDeckValidationFailures = connectedUser?.deckErrors;
        const temporaryErrors: IDeckValidationFailures = connectedUser?.importDeckErrors;
        if ((!deckErrors || Object.entries(deckErrors).length === 0) && (!temporaryErrors || Object.entries(temporaryErrors).length === 0)) {
            // No validation errors => clear any old error states
            clearErrorsFunc();
            setModalOpen(false);
            setDisplayError(false);
            setBlockError(false);
            return;
        }


        // Determine if a blocking error exists (ignoring NotImplemented and temporary errors)
        // we want two errors that won't trigger the

        if (deckErrors && Object.keys(deckErrors).length > 0) {
            // Show a short inline error message and store the full list
            setDisplayError(true);
            if (hasSomeNonSideboardingErrors(connectedUser.deckErrors)) {
                setError('Deck is invalid', connectedUser.deckErrors, 'Deck Validation Error','error');
            } else {
                setError('Sideboarding restrictions not met');
            }
            setBlockError(true);

            // Only open modal if there are validation errors besides the two excluded types
            if (hasSomeNonSideboardingErrors(deckErrors)) {
                setModalOpen(true);
            } else {
                setModalOpen(false);
            }
        }else{
            clearErrorsFunc();
            setModalOpen(false);
            setDisplayError(false);
            setBlockError(false);
        }
        if (temporaryErrors && !deckImportErrorsSeen) {
            if (hasSomeNonSideboardingErrors(temporaryErrors)) {
            // Only 'notImplemented' or no errors => clear them out
                setDisplayError(true);
                setError('Couldn\'t import. Deck is invalid.',temporaryErrors, 'Deck Validation Error', 'error');
                setModalOpen(true);
            } else {
                setDisplayError(true);
                setError('Sideboarding restrictions not met');
                setModalOpen(false);
            }
        }
    }, [connectedUser]);

    // ------------------------STYLES------------------------//
    const styles = {
        setUpCard: {
            paddingLeft: '20px',
            paddingRight: '20px',
        },
        initiativeCardStyle: {
            background: '#18325199',
            display: 'flex',
            padding: '20px',
            flexDirection: 'column',
            maxHeight: '45vh',
        },
        gameHeaderStyle: {
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            mb: 1,
        },
        errorMessageStyle: {
            color: 'var(--initiative-red);',
            mt: '0.5rem',
            mb: '0px'
        },
        errorMessageLink:{
            cursor: 'pointer',
            color: 'var(--selection-red);',
            textDecorationColor: 'var(--initiative-red);',
        },
        // Styles for game settings components (can be disabled)
        settingsCheckboxStyle: {
            color: disableSettings ? '#b0b0b0' : '#fff', // Lighter color when disabled and unchecked
            '&.Mui-checked': {
                color: '#fff',
            },
            '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
            },
            opacity: disableSettings ? 0.5 : 1, // Slightly less opacity when disabled and checked
        },
        settingsCheckboxAndRadioGroupTextStyle: {
            color: disableSettings ? '#c0c0c0' : '#fff',  // Lighter color when disabled
            fontSize: '1rem',
        },
    }

    return (
        <Card sx={styles.initiativeCardStyle}>
            {!opponentUser ? (
                // If opponent is null, show "Waiting for an opponent" UI
                <CardContent sx={styles.setUpCard}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ marginTop: '6px' }}>
                            Waiting for your opponent
                        </Typography>
                    </Box>
                </CardContent>
            ) : (
                // If opponent is not null - show ready buttons
                <>
                    {/* Game X Setup Header for Bo3 mode */}
                    {isBo3Mode && (
                        <Typography variant="h5" sx={styles.gameHeaderStyle}>
                            {currentGameNumber === 1 ? 'Best-of-Three Setup' : `Game ${currentGameNumber} Setup`}
                        </Typography>
                    )}
                    <LobbyReadyButtons
                        readyStatus={readyStatus}
                        isOwner={owner}
                        blockError={blockError}
                        hasDeck={!!(connectedUser && connectedUser.deck)}
                    />
                </>
            )}

            {(displayError || blockError) && (
                <Typography variant={'body1'} color={'error'} sx={styles.errorMessageStyle}>
                    {errorState.summary}{' '}
                    {errorState.details && (
                        <Link
                            sx={styles.errorMessageLink}
                            onClick={() => setModalOpen(true) }
                        >
                            Details
                        </Link>
                    )}
                </Typography>
            )}

            {errorState.details && (
                <ErrorModal
                    title={errorState.title}
                    open={errorState.modalOpen}
                    onClose={() => {
                        setModalOpen(false)
                        setDeckImportErrorsSeen(true);
                    }}
                    errors={errorState.details}
                    matchConfig={matchConfig}
                    modalType={errorState.modalType}
                    footerLink={errorState.footerLink}
                />
            )}
            {lobbyState.isPrivate && (
                <>
                    <Divider sx={{ mt: 1, borderColor: '#666' }} />
                    <Typography variant="h5" sx={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', mt: 1, mb: 0.5 }}>
                        Game Settings
                    </Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                sx={styles.settingsCheckboxStyle}
                                checked={requestUndo}
                                disabled={!owner || readyStatus || opponentReady}
                                onChange={(e: ChangeEvent<HTMLInputElement>, checked: boolean) =>
                                    handleChangeUndoSetting(checked)
                                }
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
                                <span style={{ ...styles.settingsCheckboxAndRadioGroupTextStyle }}>
                                    Undo Requests
                                </span>
                                <Tooltip title="Uses the same rules for Undo as public games. Limited number of free undos, then requires opponent approval. If this is disabled, there are no limits on undo.">
                                    <Info
                                        sx={{
                                            fontSize: '14px',
                                            color: '#1976d2',
                                            backgroundColor: '#fff',
                                            borderRadius: '50%',
                                            cursor: 'help',
                                            opacity: disableSettings ? 0.5 : 1
                                        }}
                                    />
                                </Tooltip>
                            </Box>
                        }
                    />
                </>
            )}
        </Card>
    )
};

export default DeckSelectionCard;
