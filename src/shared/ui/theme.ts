import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';
import { ruRU } from '@mui/x-date-pickers/locales';

import { getControlRadiusValue } from './primitives/components/theme-style-helpers';

const uniformElevationShadow = '0 2px 8px rgba(15, 23, 42, 0.08)';

const fontFamily = [
  '"Geist Variable"',
  '"SF Pro Display"',
  '"SF Pro Text"',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'sans-serif',
].join(', ');

const buildTheme = (mode: PaletteMode) => {
  const isLight = mode === 'light';
  const primaryMain = '#6366f1';
  const secondaryMain = '#8b5cf6';
  const backgroundDefault = isLight ? '#eef2f8' : '#0f172a';
  const backgroundPaper = isLight ? '#ffffff' : '#111827';
  const textPrimary = isLight ? '#1f2937' : '#f8fafc';
  const textSecondary = isLight ? '#6b7280' : '#94a3b8';
  const divider = isLight
    ? 'rgba(148, 163, 184, 0.24)'
    : 'rgba(148, 163, 184, 0.18)';
  const surfaceHover = isLight
    ? 'rgba(247, 248, 252, 0.86)'
    : 'rgba(30, 41, 59, 0.72)';
  const controlRadius = getControlRadiusValue();
  const surfaceRadius = 18;

  return createTheme(
    {
      cssVariables: true,
      palette: {
        mode,
        background: {
          default: backgroundDefault,
          paper: backgroundPaper,
        },
        primary: {
          main: primaryMain,
          dark: '#4f46e5',
          light: '#818cf8',
        },
        secondary: {
          main: secondaryMain,
          dark: '#7c3aed',
          light: '#a78bfa',
        },
        error: {
          main: '#dc2626',
        },
        warning: {
          main: '#d97706',
        },
        info: {
          main: '#2563eb',
        },
        success: {
          main: '#15803d',
        },
        text: {
          primary: textPrimary,
          secondary: textSecondary,
        },
        divider,
      },
      shape: {
        borderRadius: surfaceRadius,
      },
      typography: {
        fontFamily,
        h1: {
          fontSize: '2rem',
          fontWeight: 600,
          letterSpacing: '-0.03em',
        },
        h2: {
          fontSize: '1.5rem',
          fontWeight: 600,
          letterSpacing: '-0.03em',
        },
        h3: {
          fontSize: '1.125rem',
          fontWeight: 600,
          letterSpacing: '-0.02em',
        },
        body1: {
          fontSize: '0.95rem',
          lineHeight: 1.65,
        },
        body2: {
          fontSize: '0.875rem',
          lineHeight: 1.6,
        },
        button: {
          fontSize: '0.875rem',
          fontWeight: 500,
          letterSpacing: 0,
          textTransform: 'none',
        },
        caption: {
          color: textSecondary,
          fontSize: '0.75rem',
          lineHeight: 1.5,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundAttachment: 'fixed',
              backgroundImage:
                mode === 'light'
                  ? 'radial-gradient(circle at top, rgba(191, 219, 254, 0.45) 0%, rgba(191, 219, 254, 0) 34%), linear-gradient(180deg, #f8faff 0%, #eef2f8 100%)'
                  : 'radial-gradient(circle at top, rgba(79, 70, 229, 0.22) 0%, rgba(79, 70, 229, 0) 34%), linear-gradient(180deg, #101827 0%, #0f172a 100%)',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: controlRadius,
              minHeight: 40,
              paddingInline: 16,
            },
            contained: {
              boxShadow: uniformElevationShadow,
              '&:hover': {
                boxShadow: uniformElevationShadow,
              },
            },
            outlined: {
              borderColor: divider,
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: controlRadius,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              backgroundColor: alpha(backgroundPaper, isLight ? 0.94 : 0.72),
              borderRadius: controlRadius,
              transition:
                'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(primaryMain, 0.34),
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${alpha(primaryMain, isLight ? 0.1 : 0.18)}`,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(primaryMain, 0.34),
                borderWidth: 1,
              },
              '&.Mui-disabled': {
                backgroundColor: alpha(textSecondary, isLight ? 0.08 : 0.12),
              },
            },
            input: {
              paddingBlock: '10.5px',
            },
          },
        },
        MuiFormLabel: {
          styleOverrides: {
            root: {
              color: textPrimary,
              fontSize: 13,
              fontWeight: 500,
              '&.Mui-focused': {
                color: textPrimary,
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 999,
              fontWeight: 500,
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              alignItems: 'flex-start',
              borderRadius: surfaceRadius,
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              border: `1px solid ${divider}`,
              borderRadius: surfaceRadius,
              boxShadow: uniformElevationShadow,
              marginTop: 6,
            },
          },
        },
        MuiPopover: {
          styleOverrides: {
            paper: {
              border: `1px solid ${divider}`,
              borderRadius: surfaceRadius,
              boxShadow: uniformElevationShadow,
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: surfaceRadius,
              boxShadow: uniformElevationShadow,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              boxShadow: uniformElevationShadow,
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: isLight
                ? 'rgba(15, 23, 42, 0.92)'
                : 'rgba(248, 250, 252, 0.94)',
              borderRadius: controlRadius,
              color: isLight ? '#f8fafc' : '#0f172a',
              fontSize: 12,
              lineHeight: 1.5,
              padding: '8px 10px',
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              backgroundColor: primaryMain,
              borderRadius: 999,
              height: 3,
            },
            root: {
              minHeight: 40,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              borderRadius: controlRadius,
              color: textSecondary,
              minHeight: 40,
              minWidth: 0,
              paddingInline: 12,
              '&.Mui-selected': {
                color: textPrimary,
              },
            },
          },
        },
        MuiCheckbox: {
          styleOverrides: {
            root: {
              color: textSecondary,
            },
          },
        },
        MuiRadio: {
          styleOverrides: {
            root: {
              color: textSecondary,
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            switchBase: {
              '&.Mui-checked': {
                color: '#fff',
              },
            },
            track: {
              backgroundColor: alpha(textSecondary, 0.32),
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              backgroundColor: surfaceHover,
              borderBottomColor: divider,
            },
            body: {
              borderBottomColor: divider,
            },
          },
        },
        MuiLinearProgress: {
          styleOverrides: {
            root: {
              backgroundColor: alpha(textSecondary, 0.16),
              borderRadius: 999,
            },
            bar: {
              borderRadius: 999,
            },
          },
        },
      },
    },
    ruRU
  );
};

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');
