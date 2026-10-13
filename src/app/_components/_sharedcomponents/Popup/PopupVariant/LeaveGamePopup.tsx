import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { Box, Typography } from '@mui/material';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { GamesToWinMode } from '@/app/_constants/constants';
import { goToExit } from '@/app/_utils/siteUrls';

interface LeaveGamePopupProps {
    uuid: string;
}

export const LeaveGamePopupModule = ({ uuid }: LeaveGamePopupProps) => {
    const { sendMessage, gameState, lobbyState } = useGame();
    const { closePopup } = usePopup();
    const hasWinner = !!gameState?.winners.length;
    
    // Check if we're in a Bo3 match
    const isBo3Mode = lobbyState?.winHistory?.gamesToWinMode === GamesToWinMode.BestOfThree;
    
    const handleConfirm = () => {
        sendMessage('manualDisconnect');
        closePopup(uuid);
        goToExit();
    };

    const handleCancel = () => {
        closePopup(uuid);
    };

    // Determine the appropriate leave message
    const getLeaveMessage = () => {
        if (hasWinner) {
            return 'Leave the game and return to SWUPedia?';
        }
        if (isBo3Mode) {
            return 'Leaving the game will concede the best-of-three set.';
        }
        return 'Leaving the game will concede.';
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(false)}>
                <Typography sx={titleStyle}>Leave Game</Typography>
            </Box>
            <Typography sx={textStyle}>
                {getLeaveMessage()}
            </Typography>
            <Box sx={footerStyle}>
                <PreferenceButton
                    variant={'standard'}
                    buttonFnc={handleCancel}
                    text={'Cancel'}
                />
                <PreferenceButton
                    variant={'concede'}
                    buttonFnc={handleConfirm}
                    text={'Leave game'}
                />

            </Box>
        </Box>
    );
};