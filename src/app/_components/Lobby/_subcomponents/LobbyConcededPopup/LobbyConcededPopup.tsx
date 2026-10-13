import React from 'react';
import {
    Box,
    Card,
    CardActions,
    Typography,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { Bo3SetEndedReason, IBo3SetEndResult } from '@/app/_constants/constants';
import { scoreTableStyles, sortPlayersConnectedFirst } from '@/app/_components/_sharedcomponents/Bo3/Bo3ScoreTable.styles';
import { goToExit } from '@/app/_utils/siteUrls';

const LobbyConcededPopup: React.FC = () => {
    const { lobbyState, connectedPlayer, sendMessage, isSpectator } = useGame();

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const winsPerPlayer: Record<string, number> = winHistory?.winsPerPlayer || {};
    const playerNames: Record<string, string> = winHistory?.playerNames || {};
    const setEndResult: IBo3SetEndResult | null = winHistory?.setEndResult || null;
    const users = lobbyState?.users;

    // Helper to get player name with fallback to playerNames from winHistory
    const getPlayerName = (playerId: string): string => {
        const user = users?.find((u: ILobbyUserProps) => u.id === playerId);
        return user?.username || playerNames[playerId] || 'Your opponent';
    };

    // End result description
    let endResultDescription = '';
    if (setEndResult) {
        switch (setEndResult.endedReason) {
            case Bo3SetEndedReason.Concede: {
                const concedingPlayerId = setEndResult.concedingPlayerId;
                if (isSpectator) {
                    const playerIndex = users?.findIndex((u: ILobbyUserProps) => u.id === concedingPlayerId) ?? -1;
                    endResultDescription = playerIndex >= 0 ? `Player ${playerIndex + 1} conceded` : `${getPlayerName(concedingPlayerId)} conceded`;
                } else if (concedingPlayerId === connectedPlayer) {
                    endResultDescription = 'You conceded';
                } else {
                    endResultDescription = `${getPlayerName(concedingPlayerId)} conceded`;
                }
                break;
            }
            case Bo3SetEndedReason.OnePlayerLobbyTimeout: {
                const timeoutPlayerId = setEndResult.timeoutPlayerId;
                if (isSpectator) {
                    const playerIndex = users?.findIndex((u: ILobbyUserProps) => u.id === timeoutPlayerId) ?? -1;
                    endResultDescription = playerIndex >= 0 ? `Player ${playerIndex + 1} timed out` : `${getPlayerName(timeoutPlayerId)} timed out`;
                } else if (timeoutPlayerId === connectedPlayer) {
                    endResultDescription = 'You timed out';
                } else {
                    endResultDescription = `${getPlayerName(timeoutPlayerId)} timed out`;
                }
                break;
            }
            case Bo3SetEndedReason.BothPlayersLobbyTimeout:
                endResultDescription = 'Both players timed out';
                break;
            case Bo3SetEndedReason.WonTwoGames:
                endResultDescription = 'Set completed';
                break;
        }
    }

    // ------------------------ Button Handlers ------------------------//

    // A rematch is a new launch from swupedia.com, so the only way on is back there.
    const handlePlayAgain = () => {
        sendMessage('manualDisconnect');
        goToExit();
    };

    // ------------------------STYLES------------------------//
    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        },
        card: {
            backgroundColor: '#1a1a2e',
            border: '1px solid #444',
            borderRadius: '12px',
            padding: '2rem',
            minWidth: '400px',
            maxWidth: '500px',
        },
        title: {
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            mb: 2,
        },
        concedeNotice: {
            color: '#ff9800',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '1rem',
            mb: 2,
        },
        sectionTitle: {
            color: 'white',
            fontWeight: '600',
            fontSize: '1.1rem',
            mb: 1,
        },
        buttonContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: '12px',
            mt: 2,
        },
        buttonRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        buttonDescription: {
            color: '#878787',
            fontSize: '0.85rem',
        },
        sectionDivider: {
            borderColor: '#444',
            mb: 2,
        },
        actionsDivider: {
            borderColor: '#444',
            mt: 2,
            mb: 2,
        },
    };

    return (
        <Box sx={styles.overlay}>
            <Card sx={styles.card}>
                {/* Title */}
                <Typography sx={styles.title}>
                    Best-of-Three Ended
                </Typography>

                {/* End Result Notice */}
                <Typography sx={styles.concedeNotice}>
                    {endResultDescription}
                </Typography>

                {/* Score Table - hide if both players timed out */}
                {setEndResult?.endedReason !== Bo3SetEndedReason.BothPlayersLobbyTimeout && (
                    <>
                        <Divider sx={styles.sectionDivider} />

                        <Typography sx={styles.sectionTitle}>Final Score</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={scoreTableStyles.headerCell}>
                                            Player
                                        </TableCell>
                                        <TableCell align="center" sx={scoreTableStyles.headerCell}>
                                            Wins
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.keys(winsPerPlayer)
                                        .sort(sortPlayersConnectedFirst(connectedPlayer))
                                        .map((playerId) => {
                                            const wins = winsPerPlayer[playerId] || 0;
                                            const isCurrentPlayer = playerId === connectedPlayer;
                                            const user = lobbyState?.users?.find((u: ILobbyUserProps) => u.id === playerId);
                                            const playerIndex = lobbyState?.users?.findIndex((u: ILobbyUserProps) => u.id === playerId) ?? -1;
                                            let displayName: string;
                                            if (isSpectator) {
                                                displayName = playerIndex >= 0 ? `Player ${playerIndex + 1}` : (playerNames[playerId] || 'Opponent');
                                            } else {
                                                displayName = user?.username || playerNames[playerId] || 'Opponent';
                                            }
                                            return (
                                                <TableRow key={playerId}>
                                                    <TableCell sx={scoreTableStyles.bodyCell}>
                                                        {displayName}{!isSpectator && isCurrentPlayer && ' (You)'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={scoreTableStyles.bodyCellWins}>
                                                        {wins}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                <Divider sx={styles.actionsDivider} />

                {/* Action Buttons */}
                <Typography sx={styles.sectionTitle}>Actions</Typography>
                <CardActions sx={styles.buttonContainer}>
                    <Box sx={styles.buttonRow}>
                        <PreferenceButton
                            variant={'standard'}
                            text={isSpectator ? 'Leave' : 'Play again'}
                            buttonFnc={handlePlayAgain}
                        />
                        <Typography sx={styles.buttonDescription}>
                            {isSpectator ? 'Return to SWUPedia.' : 'Return to SWUPedia to start a new game.'}
                        </Typography>
                    </Box>
                </CardActions>
            </Card>
        </Box>
    );
};

export default LobbyConcededPopup;
