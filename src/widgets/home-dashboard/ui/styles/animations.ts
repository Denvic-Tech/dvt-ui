import { keyframes, type SxProps, type Theme } from '@mui/material';

const floatA = keyframes`
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(5vw, 4vh, 0) scale(1.12); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const floatB = keyframes`
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-4vw, 5vh, 0) scale(1.08); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const floatC = keyframes`
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(3vw, -4vh, 0) scale(1.16); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const rise = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const backgroundBlobSx = (
  animationName: ReturnType<typeof keyframes>,
  animationDuration: string,
  background: string,
  placement: SxProps<Theme>
): SxProps<Theme> => ({
  position: 'absolute',
  borderRadius: '50%',
  filter: 'blur(72px)',
  opacity: 0.88,
  animation: `${animationName} ${animationDuration} ease-in-out infinite`,
  background,
  ...placement,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
});

export const appearSx = (delayMs: number): SxProps<Theme> => ({
  animation: `${rise} 420ms cubic-bezier(.2,.75,.25,1) both`,
  animationDelay: `${delayMs}ms`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
});

export const homeBackgroundBlobs = {
  floatA,
  floatB,
  floatC,
};
