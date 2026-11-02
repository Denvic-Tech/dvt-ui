import type { SxProps, Theme } from '@mui/material';

export const productTitleSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 0.05,
  lineHeight: 1,
  color: 'text.primary',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export const productTitleMetaRowSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 0.75,
  minWidth: 0,
};

export const productTitleBrandSx: SxProps<Theme> = {
  fontWeight: 400,
  fontSize: 14,
  fontFamily:
    '"SF Pro Display", "Geist Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  letterSpacing: '0.01em',
  color: '#7C8794',
};

export const productTitleAccentSx: SxProps<Theme> = {
  display: 'inline-block',
  fontWeight: 700,
  fontSize: 20,
  color: theme =>
    theme.palette.mode === 'dark' ? theme.palette.text.primary : '#0A4F6E',
};

export const productVersionSx: SxProps<Theme> = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: 'text.secondary',
  opacity: 0.68,
};
