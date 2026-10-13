import React from 'react';
import Box from '@mui/material/Box';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';

interface CardLanguageNoticeDialogProps {
    open: boolean;
    onClose: () => void;

    /** Optional zIndex override. Defaults to 1400 so the notice sits above an MUI Dialog (1300). */
    zIndex?: number;
}

const CardLanguageNoticeDialog: React.FC<CardLanguageNoticeDialogProps> = ({
    open,
    onClose,
    zIndex = 1400,
}) => (
    <ConfirmationDialog
        open={open}
        title="Notice on Preview Card Languages"
        message={
            <>
                <Box component="p" sx={{ mt: 0, mb: '1rem' }}>
                    During preview season for a new set, new cards usually become available in English before other languages. As a result, some preview cards <b>may appear in English for a period of days or weeks</b>.
                </Box>
                <Box sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: '0.25rem', color: 'white' }}>
                    Details
                </Box>
                <Box component="p" sx={{ mt: 0, mb: 0 }}>
                    Our English images come from swudb.com, which typically updates day-of with new previews. Other card languages come from the FFG card database, which is updated at a slower rate and often does not show new cards for days or weeks after they are spoiled.
                </Box>
            </>
        }
        hideCancel
        confirmButtonText="Got it"
        confirmButtonVariant="standard"
        width="600px"
        zIndex={zIndex}
        onCancel={onClose}
        onConfirm={onClose}
    />
);

export default CardLanguageNoticeDialog;
