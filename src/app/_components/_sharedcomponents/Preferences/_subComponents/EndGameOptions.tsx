import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import Bo3ScoreDisplay from '@/app/_components/_sharedcomponents/Preferences/_subComponents/Bo3ScoreDisplay';
import { useGame } from '@/app/_contexts/Game.context';
import { useEffect, useState } from 'react';
import { GamesToWinMode, IBo3SetEndResult } from '@/app/_constants/constants';
import { useServerSettings } from '@/app/_contexts/ServerSettings.context';
import { goToExit } from '@/app/_utils/siteUrls';

// End-of-game actions. A rematch is a new launch from swupedia.com, so upstream's rematch,
// requeue and report controls are gone; "Play again" returns to swupedia.com's play console.
function EndGameOptions() {
    const { sendLobbyMessage, sendMessage, lobbyState, connectedPlayer, isSpectator, gameState, getOpponent } = useGame();
    const { gamesEnabled, hasLoaded } = useServerSettings();
    const [confirmConcedeBo3, setConfirmConcedeBo3] = useState<boolean>(false);

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const winsPerPlayer: Record<string, number> = winHistory?.winsPerPlayer || {};
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const hasConfirmedNextGame = lobbyState?.hasConfirmedNextGame || false;
    const setEndResult: IBo3SetEndResult | null = winHistory?.setEndResult || null;

    // Determine if we're in Bo3 mode and if the set is complete
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const isBo3SetComplete = isBo3Mode && !!setEndResult;

    useEffect(() => {
        if (confirmConcedeBo3) {
            const timer = setTimeout(() => setConfirmConcedeBo3(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmConcedeBo3]);

    // ------------------------ Button Handlers ------------------------//

    const handlePlayAgain = () => {
        sendMessage('manualDisconnect');
        goToExit();
    };

    // Click handler for the Concede Bo3 Set button.
    const handleConcedeBo3 = () => {
        if (!confirmConcedeBo3) {
            setConfirmConcedeBo3(true);
        } else {
            // Send the lobby message only on the second click
            sendLobbyMessage(['concedeBo3']);
            // Reset the confirmation
            setConfirmConcedeBo3(false);
        }
    };

    // For proceeding to next game in Bo3 mid-set:
    const handleProceedToNextGame = () => {
        sendLobbyMessage(['proceedToNextBo3Game']);
    };

    // For Ready for Next Game (Bo3 mid-set only):
    let readyForNextGameButtonText = 'Ready for Next Game';
    let readyForNextGameButtonDisabled = false;
    if (hasConfirmedNextGame) {
        readyForNextGameButtonText = 'Waiting for opponent...';
        readyForNextGameButtonDisabled = true;
    }

    // Check if maintenance mode is enabled
    const isMaintenanceMode = hasLoaded && !gamesEnabled;

    // ------------------------ Styles ------------------------//
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        typeographyStyle: {
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
        contentContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            mb: '20px',
        }
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Actions</Typography>
                <Divider sx={{ mb: '20px' }} />

                {/* Ready for Next Game - Bo3 mid-set only (shown first) */}
                {isBo3Mode && !isBo3SetComplete && !isSpectator && !isMaintenanceMode && (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton
                            variant={'standard'}
                            text={readyForNextGameButtonText}
                            buttonFnc={handleProceedToNextGame}
                            disabled={readyForNextGameButtonDisabled}
                            sx={hasConfirmedNextGame ? {
                                minWidth: '140px',
                            } : {
                                minWidth: '140px',
                                background: 'linear-gradient(#0a3d1e, #0a3d1e) padding-box, linear-gradient(to top, #1cb34a, #0a3d1e) border-box',
                                '&:hover': {
                                    background: 'linear-gradient(#0d4d26, #0d4d26) padding-box, linear-gradient(to top, #2ad44c, #0a3d1e) border-box',
                                },
                            }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            {hasConfirmedNextGame
                                ? 'Waiting for your opponent to confirm they are ready.'
                                : 'Confirm you are ready to proceed to the next game.'}
                        </Typography>
                    </Box>
                )}

                {/* Concede Bo3 Set - Bo3 mid-set only (non-spectator) */}
                {isBo3Mode && !isBo3SetComplete && !isSpectator ? (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton
                            variant={'concede'}
                            text={confirmConcedeBo3 ? 'Are you sure?' : 'Concede Bo3 Set'}
                            buttonFnc={handleConcedeBo3}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Yield entire Bo3 set. The set will count as a loss.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton variant={'standard'} text={isSpectator ? 'Leave' : 'Play again'} buttonFnc={handlePlayAgain} sx={{ minWidth: '140px' }} />
                        <Typography sx={styles.typeographyStyle}>
                            {isSpectator ? 'Return to SWUPedia.' : 'Return to SWUPedia to start a new game.'}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Bo3 Score Section */}
            {isBo3Mode && gameState?.players && (
                <Bo3ScoreDisplay
                    currentGameNumber={currentGameNumber}
                    winsPerPlayer={winsPerPlayer}
                    players={gameState.players}
                    connectedPlayer={connectedPlayer}
                    isBo3SetComplete={isBo3SetComplete}
                    setEndResult={setEndResult}
                    isSpectator={isSpectator}
                    getOpponent={getOpponent}
                    playerNames={winHistory?.playerNames}
                />
            )}
        </>
    );
}

export default EndGameOptions;
