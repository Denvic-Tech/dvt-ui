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
  color: 'text.secondary',
};

export const productTitleAccentSx: SxProps<Theme> = {
  display: 'inline-block',
  fontWeight: 700,
  fontSize: 20,
  background:
    'linear-gradient(135deg, #2f7a4f 0%, #23856d 24%, #1e7f8d 52%, #256f9f 76%, #315f97 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
};

export const productVersionSx: SxProps<Theme> = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: 'text.secondary',
  opacity: 0.68,
};
