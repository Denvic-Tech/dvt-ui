import { keyframes } from '@mui/material';

const homeRise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
`;

const homePop = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
`;

const homeSlide = keyframes`
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: none; }
`;

const homeFade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const homeRing = keyframes`
  from { opacity: 0.7; transform: scale(0.6); }
  to { opacity: 0; transform: scale(1.5); }
`;

const homeSpin = keyframes`
  to { transform: rotate(-360deg); }
`;

const reducedMotion = {
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
} as const;

export const homeAppearSx = (delayMs = 0) => ({
  animation: `${homeRise} 500ms cubic-bezier(.2,.8,.2,1) both`,
  animationDelay: `${delayMs}ms`,
  ...reducedMotion,
});

export const homeRowAppearSx = (delayMs = 0) => ({
  animation: `${homeRise} 350ms cubic-bezier(.2,.8,.2,1) both`,
  animationDelay: `${delayMs}ms`,
  ...reducedMotion,
});

export const homePopAppearSx = {
  animation: `${homePop} 160ms ease-out`,
  ...reducedMotion,
} as const;

export const homeSideAppearSx = {
  animation: `${homeSlide} 140ms ease-out`,
  ...reducedMotion,
} as const;

export const homeFadeInSx = {
  animation: `${homeFade} 300ms ease both`,
  ...reducedMotion,
} as const;

export const homeLiveRingSx = (color: string) => ({
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: '-3px',
    borderRadius: '99px',
    border: `1.5px solid ${color}`,
    animation: `${homeRing} 1.6s ease-out infinite`,
    ...reducedMotion,
  },
});

export const homeSpinSx = {
  animation: `${homeSpin} 0.8s linear infinite`,
  ...reducedMotion,
} as const;
