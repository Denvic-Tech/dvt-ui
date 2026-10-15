import { Box, Portal, useTheme } from '@mui/material';
import type * as React from 'react';

import { getHomeCssVars } from '../styles/tokens';

/** Portal that keeps home dashboard tokens available to floating layers. */
export const HomePortal = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();

  return (
    <Portal>
      <Box
        sx={{
          display: 'contents',
          fontFamily: theme.typography.fontFamily,
          ...getHomeCssVars(theme.palette.mode),
        }}
      >
        {children}
      </Box>
    </Portal>
  );
};
