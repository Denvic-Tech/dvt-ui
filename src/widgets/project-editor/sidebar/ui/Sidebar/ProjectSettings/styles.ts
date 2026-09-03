import { keyframes, styled } from '@mui/material/styles';

import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers.ts';

export const SettingsContainer = styled('div')(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: getRadius(theme),
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}));

export const SettingsHeader = styled('div')(() => ({
  padding: '16px 20px',
  borderBottom: '1px solid #f3f4f6',
}));

export const HeaderTitle = styled('h2')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#1f2937',
  margin: 0,
}));

export const SettingsContent = styled('div')(() => ({
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
}));

export const Section = styled('div')(({ theme }) => ({
  padding: 16,
  backgroundColor: '#f9fafb',
  borderRadius: getRadius(theme),
}));

export const SectionHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
}));

export const SectionIcon = styled('div')<{
  variant: 'info' | 'cache' | 'performance';
}>(({ variant }) => ({
  width: 24,
  height: 24,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,

  ...(variant === 'info' && {
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
  }),
  ...(variant === 'cache' && {
    backgroundColor: '#d1fae5',
    color: '#059669',
  }),
  ...(variant === 'performance' && {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  }),

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const SectionTitle = styled('span')(() => ({
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
}));

export const ToggleRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
}));

export const ToggleLabel = styled('span')(() => ({
  fontSize: 13,
  color: '#4b5563',
}));

export const ToggleSwitch = styled('button')<{ checked: boolean }>(
  ({ checked }) => ({
    width: 40,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 200ms ease',
    backgroundColor: checked ? '#10b981' : '#d1d5db',
    padding: 0,

    '&::after': {
      content: '""',
      position: 'absolute',
      top: 4,
      left: checked ? 20 : 4,
      width: 16,
      height: 16,
      borderRadius: '50%',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      transition: 'left 200ms ease',
    },

    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  })
);

export const FieldLabel = styled('label')(() => ({
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: '#6b7280',
  marginBottom: 6,
}));

export const StyledInput = styled('input')<{
  variant?: 'info' | 'cache' | 'performance';
  hasError?: boolean;
}>(({ variant = 'info', hasError = false }) => {
  const focusColors = {
    info: { border: '#a5b4fc', ring: 'rgba(99, 102, 241, 0.1)' },
    cache: { border: '#6ee7b7', ring: 'rgba(16, 185, 129, 0.1)' },
    performance: { border: '#fcd34d', ring: 'rgba(245, 158, 11, 0.1)' },
  };

  const colors = focusColors[variant];
  const focusBorder = hasError ? '#fca5a5' : colors.border;
  const focusRing = hasError ? 'rgba(248, 113, 113, 0.2)' : colors.ring;

  return {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: '#374151',
    backgroundColor: '#ffffff',
    border: `1px solid ${hasError ? '#fca5a5' : '#e5e7eb'}`,
    borderRadius: 8,
    outline: 'none',
    transition: 'all 150ms ease',

    '&:hover': {
      borderColor: '#d1d5db',
    },

    '&:focus': {
      borderColor: focusBorder,
      boxShadow: `0 0 0 3px ${focusRing}`,
    },

    '&:disabled': {
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      cursor: 'not-allowed',
    },
  };
});

export const FieldHint = styled('p')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  marginTop: 6,
  marginBottom: 0,
}));

export const FieldError = styled('p')(() => ({
  fontSize: 11,
  color: '#ef4444',
  marginTop: 6,
  marginBottom: 0,
}));

export const DisabledOverlay = styled('div')<{ disabled: boolean }>(
  ({ disabled }) => ({
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    transition: 'opacity 200ms ease',
  })
);

export const ValidationBanner = styled('div')(() => ({
  padding: '10px 12px',
  borderRadius: 10,
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  color: '#b91c1c',
  fontSize: 12,
}));

export const SettingsFooter = styled('div')(() => ({
  padding: '12px 16px',
  borderTop: '1px solid #f3f4f6',
  backgroundColor: 'rgba(249, 250, 251, 0.5)',
}));

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const SaveSpinner = styled('span')(() => ({
  width: 14,
  height: 14,
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.6)',
  borderTopColor: '#ffffff',
  animation: `${spin} 0.8s linear infinite`,
}));

export const SaveButton = styled('button', {
  shouldForwardProp: prop => prop !== 'isLoading',
})<{ isLoading?: boolean }>(({ isLoading }) => ({
  width: '100%',
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 500,
  color: '#ffffff',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  ...(isLoading && {
    cursor: 'wait',
  }),

  '&:hover': {
    backgroundColor: '#4f46e5',
  },

  '&:disabled': {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
}));

export const EmptyState = styled('div')(() => ({
  padding: 16,
  color: '#6b7280',
  fontSize: 13,
}));
