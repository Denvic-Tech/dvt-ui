import { Box, keyframes, SxProps, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { alpha, styled } from '@mui/material/styles';

import type { ExecutionStatus } from '@/shared/gatewayClient';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers.ts';

export const pulseKeyframes = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

export const skeletonShimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -100% 0;
  }
`;

// MacOS-like "pop in": quick fade + slight overshoot
export const macosPopInKeyframes = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-6px) scale(0.96);
    filter: blur(2px);
  }
  70% {
    opacity: 1;
    transform: translateY(0) scale(1.02);
    filter: blur(0px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }
`;

export const getNodeWrapperStyles =
  (
    selected: boolean,
    searchMatch: boolean,
    searchActive: boolean
  ): SxProps<Theme> =>
  (theme: Theme) => ({
    position: 'relative',
    display: 'inline-block',
    overflow: 'visible',
    outline: selected ? '2px dashed' : 'none',
    outlineColor: selected ? theme.palette.primary.light : 'transparent',
    outlineOffset: selected ? 6 : 0,
    borderRadius: getRadius(theme),
    boxShadow: searchActive
      ? `0 0 0 3px ${alpha(theme.palette.warning.main, 0.55)}`
      : searchMatch
        ? `0 0 0 2px ${alpha(theme.palette.warning.main, 0.32)}`
        : 'none',
    '&:hover': {
      outline: '2px dashed',
      outlineColor: selected
        ? theme.palette.primary.light
        : alpha(theme.palette.grey[500], 0.35),
      outlineOffset: 6,
    },
    '&.custom-node-error-anchor:hover .custom-node-error-tooltip, &.custom-node-error-anchor:focus-within .custom-node-error-tooltip':
      {
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
        transform:
          'translateY(0) scale(var(--dvt-node-error-tooltip-scale, 1))',
      },
  });

// Мягкое "дыхание" свечения
export const glowBreathKeyframes = keyframes`
  0% {
    opacity: 0.5;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 0.5;
    transform: scale(0.98);
  }
`;

export const getNodeStyles = (
  theme: Theme,
  status: ExecutionStatus,
  selected: boolean,
  cacheEnabled: boolean
): SxProps => {
  const outline = '1px solid';

  let animation: string | undefined = 'none';
  let outlineColor: string;
  let glowColor = 'rgba(0, 0, 0, 0)';

  switch (status) {
    case 'running':
      outlineColor = 'primary.main';
      animation = `${pulseKeyframes} 2s infinite`;
      // primary: rgba(25, 118, 210, x)
      glowColor = 'rgba(25, 118, 210, 0.45)';
      break;
    case 'success':
      outlineColor = 'success.main';
      // success: rgba(46, 125, 50, x)
      glowColor = 'rgba(46, 125, 50, 0.40)';
      break;
    case 'error':
      outlineColor = 'error.main';
      // error: rgba(211, 47, 47, x)
      glowColor = 'rgba(211, 47, 47, 0.45)';
      break;
    case 'idle':
    default:
      outlineColor = 'transparent';
      glowColor = 'rgba(0, 0, 0, 0)';
      break;
  }

  if (selected) {
    glowColor = 'rgba(25, 118, 210, 0.25)';
  }

  // Показываем красивый glow для всех “живых” статусов + выбранных нод
  const hasGlow =
    status === 'running' || status === 'success' || status === 'error';

  return {
    outline,
    outlineColor,
    outlineWidth: '4px',
    borderRadius: getRadius(theme),
    minWidth: 260,
    maxWidth: 420,
    backgroundColor: cacheEnabled
      ? theme.palette.mode === 'dark'
        ? '#16251a'
        : '#f2f8f3'
      : 'background.paper',
    transition:
      'box-shadow 0.25s ease-out, border-color 0.25s ease-out, transform 0.15s ease-out',
    opacity: 1,
    animation,
    position: 'relative',
    overflow: 'hidden',

    // Базовая тень для карточки
    boxShadow: hasGlow ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 1,

    '&:hover': {
      transform: 'none',
      boxShadow: hasGlow ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 1,
    },

    // Красивое мягкое свечение по краям
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: -3,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      boxShadow: hasGlow ? `0 0 18px 4px ${glowColor}` : 'none',
      opacity: hasGlow ? 1 : 0,
      transition: 'opacity 0.3s ease-out, box-shadow 0.3s ease-out',
      // “Дыхание” только для running
      animation:
        status === 'running'
          ? `${glowBreathKeyframes} 2.4s ease-in-out infinite`
          : 'none',
    },
  };
};

export const ErrorTooltipContainer = styled(Box)(() => ({
  position: 'relative',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  minWidth: '100%',
  width: 'max-content',
  boxSizing: 'border-box',
  padding: '8px 12px',
  paddingRight: 28,
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  maxWidth: 280,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#dc2626',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

export const ErrorTooltipLayer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  bottom: 'calc(100% + 12px)',
  zIndex: theme.zIndex.mobileStepper,
  '--dvt-node-error-tooltip-scale': 1,
  opacity: 0,
  visibility: 'hidden',
  pointerEvents: 'none',
  transform: 'translateY(4px) scale(var(--dvt-node-error-tooltip-scale, 1))',
  transformOrigin: 'bottom left',
  transition: 'opacity 150ms ease, transform 150ms ease, visibility 150ms ease',
}));

export const ErrorText = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1.5,
  color: '#ffffff',
  wordBreak: 'break-word',
}));

export const CopyIconContainer = styled(Box)(() => ({
  position: 'absolute',
  top: 8,
  right: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 150ms ease',
  '.tooltip-container:hover &': {
    opacity: 1,
  },
}));

export const CopyIcon = styled('svg')(() => ({
  width: 14,
  height: 14,
  color: 'rgba(255, 255, 255, 0.7)',
  '&:hover': {
    color: '#ffffff',
  },
}));

export const CopiedText = styled(Typography)(() => ({
  fontSize: 10,
  fontWeight: 500,
  color: '#ffffff',
  lineHeight: 1,
}));

export const TooltipArrow = styled(Box)(() => ({
  position: 'absolute',
  bottom: -6,
  left: 16,
  width: 12,
  height: 12,
  backgroundColor: '#ef4444',
  transform: 'rotate(45deg)',
  transition: 'background-color 150ms ease',
  '.tooltip-container:hover &': {
    backgroundColor: '#dc2626',
  },
}));
