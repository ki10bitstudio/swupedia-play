import { Theme, createTheme } from '@mui/material/styles';

// swupedia.com's tokens (DESIGN.md front matter in swupedia-ui), copied by hand. A token that
// changes there is changed here too.
const swupedia = {
    beam: '#4cc2ff',
    ground: '#01070f',
    surface: '#141210',
    raised: '#25221d',
    hairline: '#2e2a24',
    foreground: '#e8f2fa',
    mutedForeground: '#8aa2b8',
};

export const theme: Theme = createTheme({
    palette: {
        primary: {
            main: swupedia.beam,
        },
        background: {
            default: swupedia.ground,
            paper: swupedia.surface,
        },
        divider: swupedia.hairline,
        text: {
            primary: swupedia.foreground,
            secondary: swupedia.mutedForeground,
        }
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            iphoneSE: 667,
            iphone12: 844,
            md: 900,
            iphone14max: 932,
            ipadMini: 1024,
            ipadAir: 1180,
            lg: 1200,
            ipadPro: 1366,
            desktopHD: 1600,
            xl: 1920,
            xxl: 2560,
            xxxl: 3840
        },
    },
    typography: {
        fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
        allVariants: {
            color: swupedia.foreground,
            WebkitFontSmoothing: 'auto',
        },
        h1: {
            fontSize: '1.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
        },
        h3: {
            fontSize: '1.15rem',
            fontWeight: 600,
            marginBottom: '0rem',
        },
        h4: {
            fontSize: '1rem',
            fontWeight: 400,
            marginBottom: '0.9rem',
        },
        body1: {
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: '130%',
            marginBottom: '1rem',
            '&:last-child': {
                marginBottom: '0',
            },
        },
        bodyBold: {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: '130%',
            marginBottom: '1rem',
            color: swupedia.foreground,
            fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
        },
        body2: {
            fontSize: '0.75rem',
            fontWeight: 400,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: (theme) => ({
                ':root': {
                    '--selection-green': '#72F979',
                    '--selection-red': '#FF0D0D',
                    '--selection-yellow': '#FFFE50',
                    '--selection-purple': '#C604C6',
                    '--selection-blue': '#66E5FF',
                    '--selection-grey': '#9DB4A0',
                    '--initiative-blue': '#00BAFF',
                    '--initiative-red': '#FF3231',
                    '--font-size-xs': '10px',
                    '--font-size-sm': '12px',
                    '--font-size-md': '14px',
                    '--font-size-lg': '17px',
                    '--font-size-xl': '18px',
                },
                html: {
                    fontSize: 'var(--font-size-md)', // Default to medium
                    [theme.breakpoints.down('sm')]: {
                        fontSize: 'var(--font-size-xs)',
                    },
                    [theme.breakpoints.between('sm', 'md')]: {
                        fontSize: 'var(--font-size-sm)',
                    },
                    [theme.breakpoints.between('md', 'lg')]: {
                        fontSize: 'var(--font-size-md)',
                    },
                    [theme.breakpoints.between('lg', 'xl')]: {
                        fontSize: 'var(--font-size-lg)',
                    },
                    [theme.breakpoints.up('xl')]: {
                        fontSize: 'var(--font-size-xl)',
                    },
                },
                body: {
                    backgroundColor: swupedia.ground,
                    color: swupedia.foreground,
                    maxWidth: '100%',
                    height: '100%',
                    margin: '0',

                },
                b: {
                    fontWeight: 600,
                },
                '::-webkit-scrollbar': {
                    width: '2px',
                    height: '2px',
                },
                '::-webkit-scrollbar-thumb': {
                    backgroundColor: `${swupedia.mutedForeground}B3`,
                    borderRadius: '2px',
                },
                '::-webkit-scrollbar-button': {
                    height: '10px',
                },
            }),
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    paddingLeft: '0px',
                    paddingRight: '0px',
                    // [baseTheme.breakpoints.up("lg")]: {
                    // 	maxWidth: "100%",
                    // },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '.8rem',
                    width: '100%',
                    overflow: 'auto',
                },
            },
            variants: [
                {
                    props: { variant: 'blue' },
                    style: {
                        backgroundColor: `${swupedia.surface}99`,
                        padding: '1.5rem',
                        backdropFilter: 'blur(20px)',
                    },
                },
                {
                    props: { variant: 'black' },
                    style: {
                        backgroundColor: `${swupedia.ground}99`,
                        padding: '1.5rem',
                        backdropFilter: 'blur(20px)',
                    },
                },
            ]
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: 0,
                    '&:last-child': {
                        paddingBottom: 0,
                    },
                },
            },
        },
        MuiTypography: {
            defaultProps: {
                variantMapping: {
                    bodyBold: 'p',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    backgroundColor: swupedia.raised,
                    color: swupedia.foreground,
                    fontWeight: '600',
                    fontSize: '1rem',
                    textTransform: 'none',
                    '&:hover': {
                        backgroundColor: swupedia.hairline,
                    },

                    '&:disabled': {
                        color: `${swupedia.mutedForeground}80`
                    },
                },
            },
        },
        MuiSelect: {
            defaultProps: {
                size: 'small',
            },
            styleOverrides: {
                select: {
                    backgroundColor: swupedia.surface,
                    color: swupedia.foreground,
                    '&:hover': {
                        backgroundColor: swupedia.raised,
                    },
                    '&:focus': {
                        borderRadius: '5px',
                    },
                },
                icon: {
                    color: swupedia.foreground,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: 'small', // Set the default size to 'small' for TextField components
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '5px',
                    backgroundColor: swupedia.surface,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: swupedia.hairline,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: swupedia.hairline,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: swupedia.beam,
                    },
                },
                input: {
                    color: swupedia.foreground,
                    '&::placeholder': {
                        color: swupedia.mutedForeground,
                    },
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: swupedia.surface,
                    borderRadius: '5px',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: swupedia.foreground,
                    '&:hover': {
                        backgroundColor: swupedia.raised,
                    },
                    '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': {
                        backgroundColor: swupedia.raised,
                    },
                    '&:first-of-type': {
                        borderTopLeftRadius: '5px',
                        borderTopRightRadius: '5px',
                    },
                    '&:last-of-type': {
                        borderBottomLeftRadius: '5px',
                        borderBottomRightRadius: '5px',
                    },
                },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                input: {
                    textAlign: 'center',
                },
                listbox: {
                    backgroundColor: swupedia.surface,
                },
                option: {
                    '&:hover': {
                        backgroundColor: swupedia.raised
                    },
                },
            }
        },

    },
});
