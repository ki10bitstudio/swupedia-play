import React, {
    useState,
    useEffect,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import Bo3ScoreDisplay from '@/app/_components/_sharedcomponents/Preferences/_subComponents/Bo3ScoreDisplay';
import { useGame } from '@/app/_contexts/Game.context';
import { GamesToWinMode, Bo3SetEndedReason, IBo3SetEndResult, MatchmakingType } from '@/app/_constants/constants';
import { goToExit } from '@/app/_utils/siteUrls';

enum PhaseName {
    Action = 'action',
    Regroup = 'regroup',
    Setup = 'setup',
}

function CurrentGameTab() {
    const { sendGameMessage, getOpponent, connectedPlayer, gameState, isSpectator, lobbyState } = useGame();
    const isDev = process.env.NODE_ENV === 'development';
    const currentPlayer = gameState.players[connectedPlayer];
    const currentPlayerName = currentPlayer?.name;
    const [confirmConcede, setConfirmConcede] = useState<boolean>(false);
    const isPrivateLobby = lobbyState?.gameType === MatchmakingType.PrivateLobby;

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const winsPerPlayer: Record<string, number> = winHistory?.winsPerPlayer || {};
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const setEndResult: IBo3SetEndResult | null = winHistory?.setEndResult || null;

    // Determine if we're in Bo3 mode and if the set is complete
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const isBo3SetComplete = isBo3Mode && (
        setEndResult?.endedReason === Bo3SetEndedReason.WonTwoGames ||
        setEndResult?.endedReason === Bo3SetEndedReason.Concede
    );

    useEffect(() => {
        if(confirmConcede){
            const timer = setTimeout(() => setConfirmConcede(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmConcede]);

    // Click handler for the Concede button.
    const handleConcede = () => {
        if (!confirmConcede) {
            setConfirmConcede(true);
        } else {
            // Send the game message only on the second click
            sendGameMessage(['concede', currentPlayerName]);
            // Reset the confirmation
            setConfirmConcede(false);
        }
    };

    // Click handler for the undo button
    const handleUndoPhase = (phaseName: PhaseName.Action | PhaseName.Regroup) => {
        sendGameMessage(['rollbackToSnapshot', {
            type: 'phase',
            phaseName
        }])
    }

    const handleUndoRegroup = () => {
        handleUndoPhase(PhaseName.Regroup);
    }

    const handleUndoAction = () => {
        handleUndoPhase(PhaseName.Action);
    }

    // Handler for spectators to leave the game
    const handleLeaveSpectatorMode = () => {
        goToExit();
    };

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer:{
            mb:'3.5rem',
        },
        typeographyStyle:{
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
        },
    }

    return (
        <>
            {isSpectator ? (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Leave</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton variant={'concede'} text={'Leave game'} buttonFnc={handleLeaveSpectatorMode}/>
                        <Typography sx={styles.typeographyStyle}>
                            Stop spectating the game and return to SWUPedia.
                        </Typography>
                    </Box>
                </Box>
            ):(
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Concede</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton 
                            variant={'concede'}
                            text={confirmConcede ? 'Are you sure?' : 'Concede Game'}
                            buttonFnc={handleConcede}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Yield current game. This game will count as a loss.
                        </Typography>
                    </Box>
                </Box>
            )}
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
            {(isDev || gameState.undoEnabled) && isPrivateLobby && (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Advanced Undo</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Box sx={{ ...styles.contentContainer, mb: '20px' }}>
                        <PreferenceButton
                            variant={'standard'}
                            text={'Action Phase'}
                            buttonFnc={handleUndoAction}
                            disabled={currentPlayer['availableSnapshots']?.actionPhaseSnapshots === 0}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Revert to the start of the most recent action phase
                        </Typography>
                    </Box>
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton 
                            variant={'standard'} 
                            text={'Regroup Phase'} 
                            buttonFnc={handleUndoRegroup}
                            disabled={currentPlayer['availableSnapshots']?.regroupPhaseSnapshots === 0}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Revert to the start of the most recent regroup phase
                        </Typography>
                    </Box>
                </Box>
            )}
        </>
    );
}
export default CurrentGameTab;
