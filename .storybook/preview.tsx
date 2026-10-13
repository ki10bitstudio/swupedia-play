import type { Preview } from '@storybook/nextjs';
import { GlobalStyles } from '@mui/material';
import { ThemeContextProvider } from '../src/app/_contexts/Theme.context';
import { geistMono, geistSans, rulesFont } from '../src/app/_theme/fonts';

const preview: Preview = {
    decorators: [
        (Story) => (
            <ThemeContextProvider>
                <GlobalStyles styles={{
                    ':root': {
                        '--font-geist-sans': geistSans.style.fontFamily,
                        '--font-geist-mono': geistMono.style.fontFamily,
                        '--font-rules': rulesFont.style.fontFamily,
                    },
                    // Let Storybook's background control supply the preview background.
                    body: { backgroundImage: 'none' },
                }} />
                <Story />
            </ThemeContextProvider>
        ),
    ],
    parameters: {
        backgrounds: {
            options: {
                dark: { name: 'Dark', value: 'rgba(0, 0, 0, 0.8)' },
            },
        },
    },
    initialGlobals: {
        backgrounds: { value: 'dark' },
    },
};

export default preview;
