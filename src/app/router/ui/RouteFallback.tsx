import React from 'react';
import { Box } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Centered spinner shown while a lazily loaded route chunk or its data is
 * still on the way. Keeps the app bar in place and reserves vertical space so
 * the layout does not jump when the page arrives.
 */
export const RouteFallback: React.FC = () => (
  <Box
    sx={{
      minHeight: 320,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress />
  </Box>
);
