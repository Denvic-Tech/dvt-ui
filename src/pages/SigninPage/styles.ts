import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material/styles';

import { FieldState } from './helpers';

type FieldVisualStyle = {
  borderColor: string;
  boxShadow: string;
  backgroundColor: string;
  iconColor: string;
};

type RootCssVars = CSSProperties & {
  '--card-shadow': string;
  '--color-primary': string;
  '--color-text': string;
  '--color-text-secondary': string;
  '--color-label': string;
};

const fieldStateStyles: Record<FieldState, FieldVisualStyle> = {
  default: {
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    backgroundColor: 'rgba(255,255,255,0.8)',
    iconColor: '#94a3b8',
  },
  focus: {
    borderColor: '#4f46e5',
    boxShadow: '0 0 0 3px rgba(79,70,229,0.1)',
    backgroundColor: '#ffffff',
    iconColor: '#4f46e5',
  },
  error: {
    borderColor: '#fca5a5',
    boxShadow: '0 0 0 3px rgba(220,38,38,0.08)',
    backgroundColor: '#ffffff',
    iconColor: '#dc2626',
  },
  success: {
    borderColor: '#6ee7b7',
    boxShadow: '0 0 0 3px rgba(5,150,105,0.06)',
    backgroundColor: '#ffffff',
    iconColor: '#059669',
  },
};

export const rootCssVars: RootCssVars = {
  '--card-shadow': '0 2px 8px rgba(15, 23, 42, 0.08)',
  '--color-primary': '#4f46e5',
  '--color-text': '#1e1b4b',
  '--color-text-secondary': '#64748b',
  '--color-label': '#334155',
};

export const pageContainerSx: SxProps<Theme> = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: 2.5,
  fontFamily: 'inherit',
  background:
    'linear-gradient(145deg, #f1f0fb 0%, #e8e6f0 30%, #f5f3f0 70%, #ece9e4 100%)',
  isolation: 'isolate',
  zIndex: 1,
};

export const primaryOrbSx: SxProps<Theme> = {
  position: 'fixed',
  width: '35vw',
  height: '35vw',
  minWidth: '250px',
  minHeight: '250px',
  maxWidth: '600px',
  maxHeight: '600px',
  borderRadius: '50%',
  background:
    'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
  top: '-8vw',
  right: '-8vw',
  pointerEvents: 'none',
  zIndex: 0,
};

export const secondaryOrbSx: SxProps<Theme> = {
  position: 'fixed',
  width: '28vw',
  height: '28vw',
  minWidth: '200px',
  minHeight: '200px',
  maxWidth: '500px',
  maxHeight: '500px',
  borderRadius: '50%',
  background:
    'radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)',
  bottom: '-6vw',
  left: '-6vw',
  pointerEvents: 'none',
  zIndex: 0,
};

export const contentWrapperSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '40px',
};

export const brandRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: '11px',
};

export const brandTitleSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 0.05,
  lineHeight: 1,
  color: 'text.primary',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export const brandTitleMetaRowSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 0.75,
  minWidth: 0,
};

export const brandTitleBrandSx: SxProps<Theme> = {
  fontWeight: 400,
  fontSize: 13,
  fontFamily:
    '"SF Pro Display", "Geist Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  letterSpacing: '0.01em',
};

export const brandTitleAccentSx: SxProps<Theme> = {
  display: 'inline-block',
  fontWeight: 700,
  fontSize: 17,
  background:
    'linear-gradient(135deg, #2f7a4f 0%, #23856d 24%, #1e7f8d 52%, #256f9f 76%, #315f97 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
};

export const brandVersionSx: SxProps<Theme> = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: 'text.secondary',
  opacity: 0.68,
};

export const formContainerSx: SxProps<Theme> = {
  width: '100%',
  p: '36px 32px 28px',
  borderRadius: '28px',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.6)',
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: 'var(--card-shadow)',
};

export const headingSx: SxProps<Theme> = {
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  color: 'var(--color-text)',
  lineHeight: 1.25,
};

export const subtitleSx: SxProps<Theme> = {
  mt: '6px',
  fontSize: '13.5px',
  fontWeight: 400,
  color: 'var(--color-text-secondary)',
};

export const emailSectionSx: SxProps<Theme> = { mt: '22px', mb: '32px' };

export const passwordSectionSx: SxProps<Theme> = { mb: '32px' };

export const fieldLabelSx: SxProps<Theme> = {
  display: 'block',
  mb: '6px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-label)',
};

export const getFieldShellSx = (state: FieldState): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  px: '14px',
  height: '46px',
  borderRadius: '12px',
  border: '1.5px solid',
  borderColor: fieldStateStyles[state].borderColor,
  boxShadow: fieldStateStyles[state].boxShadow,
  backgroundColor: fieldStateStyles[state].backgroundColor,
  transition: 'all 0.2s ease',
});

export const getFieldIconColor = (state: FieldState): string =>
  fieldStateStyles[state].iconColor;

export const fieldInputSx: SxProps<Theme> = {
  flex: 1,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: '#1e1b4b',
  fontSize: '14px',
  fontWeight: 400,
  fontFamily: 'inherit',
  '&::placeholder': {
    color: '#94a3b8',
  },
};

export const getValidationMessageRowSx = (
  visible: boolean
): SxProps<Theme> => ({
  mt: visible ? '5px' : 0,
  height: visible ? '18px' : 0,
  opacity: visible ? 1 : 0,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  transition: 'all 0.2s ease',
});

export const warningMessageTextSx: SxProps<Theme> = {
  fontSize: '11px',
  fontWeight: 400,
  lineHeight: 1,
  color: '#f59e0b',
};

export const errorMessageTextSx: SxProps<Theme> = {
  fontSize: '12px',
  fontWeight: 400,
  lineHeight: 1,
  color: '#dc2626',
};

export const passwordToggleButtonSx: SxProps<Theme> = {
  border: 'none',
  p: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: '#4f46e5',
  },
};

export const getSubmitButtonSx = (isSubmitting: boolean): SxProps<Theme> => ({
  mt: '2px',
  height: '46px',
  borderRadius: '12px',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '15px',
  fontWeight: 600,
  fontFamily: 'inherit',
  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  transition: 'all 0.2s ease',
  opacity: isSubmitting ? 0.7 : 1,
  transform: isSubmitting ? 'scale(0.98)' : 'scale(1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
  '&.Mui-disabled': {
    color: '#a0a0a0',
    background: '#e0e0e0',
    boxShadow: 'none',
  },
});

export const loadingIndicatorSx: SxProps<Theme> = { color: '#ffffff' };

export const footerTextSx: SxProps<Theme> = {
  mt: '10px',
  fontSize: '12px',
  color: '#64748b',
  textAlign: 'center',
};

export const serverErrorSx: SxProps<Theme> = {
  mt: '10px',
  fontSize: '12px',
  color: '#dc2626',
};

export const iconShrinkSx: SxProps<Theme> = { flexShrink: 0 };
