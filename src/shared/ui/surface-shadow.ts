import { alpha, type Theme } from '@mui/material/styles';

// Shadow of the top-level surfaces lying on the page background.
export const getSurfaceShadow = (theme: Theme): string =>
  `0 11px 26px ${alpha(
    theme.palette.common.black,
    theme.palette.mode === 'light' ? 0.038 : 0.9
  )}, 0 3px 10px ${alpha(
    theme.palette.common.black,
    theme.palette.mode === 'light' ? 0.024 : 0.55
  )}`;
