import React from 'react';
import { TextField } from '@mui/material';

export interface IStyledTextFieldProps {
    variant?: 'outlined' | 'filled' | 'standard';
    fullWidth?: boolean;
    value?: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    errorMessage?: string;
    [key: string]: unknown;
}

const StyledTextField: React.FC<IStyledTextFieldProps> = ({
    errorMessage,
    ...props
}) => {
    return (
        <TextField
            variant="outlined"
            fullWidth
            error={!!errorMessage}
            helperText={errorMessage || ''}
            {...props}
        />
    );
};

export default StyledTextField;
