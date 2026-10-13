import React from 'react';
import { Box, ButtonBase } from '@mui/material';
import DeckSelectionCard from '@/app/_components/Lobby/_subcomponents/DeckSelectionCard/DeckSelectionCard';
import Bo3ScoreCard from '@/app/_components/Lobby/_subcomponents/Bo3ScoreCard/Bo3ScoreCard';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { GamesToWinMode } from '@/app/_constants/constants';
import { goToExit } from '@/app/_utils/siteUrls';
import SwupediaMark from '@/assets/swupedia-mark.svg';

const SetUp: React.FC = ({
}) => {
    const { lobbyState, connectedPlayer, sendMessage } = useGame();

    // find the user
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const currentGameNumber = winHistory?.currentGameNumber || 1;

    // Determine if we should show Bo3ScoreCard (Bo3 mode and game 2+)
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const showBo3ScoreCard = isBo3Mode && currentGameNumber > 1;

    // The swupedia mark is the way out of the lobby: abandon it the way upstream's
    // "Exit Game Lobby" did, then return to swupedia.com's play console.
    const handleExit = () => {
        sendMessage('manualDisconnect');
        goToExit();
    }

    // ------------------------STYLES------------------------//
    const styles = {
        markButton: {
            alignSelf: 'flex-start',
            mb: '1.0em',
            borderRadius: '0.4em',
            '&:hover': { opacity: '0.8' },
            '&:focus-visible': { outline: '2px solid #4cc2ff', outlineOffset: '4px' },
        },
        mark: {
            height: '4.2em',
            width: 'auto',
            display: 'block',
        },
        boxContainer: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
    }

    return (
        <Box sx={styles.boxContainer}>
            <ButtonBase
                sx={styles.markButton}
                onClick={handleExit}
                aria-label="Leave the lobby and return to SWUPedia"
                title="Leave the lobby and return to SWUPedia"
            >
                <Box component={SwupediaMark} sx={styles.mark} />
            </ButtonBase>
            {showBo3ScoreCard ? (
                <Bo3ScoreCard
                    owner={lobbyState ? lobbyState.lobbyOwnerId === connectedPlayer : false}
                    readyStatus={connectedUser ? connectedUser.ready : false}
                />
            ) : (
                <DeckSelectionCard
                    owner={lobbyState ? lobbyState.lobbyOwnerId === connectedPlayer : false}
                    readyStatus={connectedUser ? connectedUser.ready : false}
                />
            )}
        </Box>
    );
};

export default SetUp;
