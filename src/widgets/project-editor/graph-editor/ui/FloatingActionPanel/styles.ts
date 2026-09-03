import { keyframes, styled } from '@mui/material/styles';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';

export type ActionButtonVariant =
  | 'primary'
  | 'danger'
  | 'danger-subtle'
  | 'default';
export type ActionButtonLoadingTone = 'primary' | 'danger' | null;

export const PanelContainer = styled('div')(({ theme }) => ({
  position: 'absolute',
  right: 16,
  padding: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  backgroundColor: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  transition: 'bottom 0.2s ease-in-out',
  zIndex: theme.zIndex.modal,
}));

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const ActionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'variant' && prop !== 'loadingTone',
})<{
  variant?: ActionButtonVariant;
  loadingTone?: ActionButtonLoadingTone;
}>(({ variant = 'default', loadingTone = null }) => ({
  width: 44,
  height: 44,
  borderRadius: 12,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 150ms ease',

  ...(loadingTone === 'primary' && {
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
    boxShadow: 'none',
    cursor: 'default',
    pointerEvents: 'none',
  }),

  ...(loadingTone === 'danger' && {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    boxShadow: 'none',
    cursor: 'default',
    pointerEvents: 'none',
  }),

  ...(variant === 'primary' &&
    !loadingTone && {
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      color: '#ffffff',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',

      '&:hover': {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        transform: 'scale(1.02)',
      },
    }),

  ...(variant === 'danger' &&
    !loadingTone && {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ffffff',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',

      '&:hover': {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        transform: 'scale(1.02)',
      },
    }),

  ...(variant === 'danger-subtle' &&
    !loadingTone && {
      backgroundColor: '#fef2f2',
      color: '#ef4444',

      '&:hover': {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
      },
    }),

  ...(variant === 'default' &&
    !loadingTone && {
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',

      '&:hover': {
        backgroundColor: '#e5e7eb',
        color: '#4b5563',
      },
    }),

  '&:active': {
    transform: 'scale(0.95)',
  },

  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.16)',
  },

  '&:disabled': {
    opacity: loadingTone ? 1 : 0.5,
    cursor: loadingTone ? 'default' : 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
    pointerEvents: loadingTone ? 'none' : undefined,
  },

  '& svg': {
    width: 20,
    height: 20,
  },

  '& svg[data-spinning="true"]': {
    animation: `${spin} 0.8s linear infinite`,
  },
}));

export const ActionDivider = styled('div')(() => ({
  width: 24,
  height: 1,
  margin: '8px auto',
  backgroundColor: '#e5e7eb',
}));

const bounceDot = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
`;

export const BouncingDotsContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
}));

export const BouncingDot = styled('div', {
  shouldForwardProp: prop => prop !== 'color' && prop !== 'delay',
})<{ color: string; delay: number }>(({ color, delay }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: color,
  animation: `${bounceDot} 1s ease-in-out infinite`,
  animationDelay: `${delay}s`,
}));
