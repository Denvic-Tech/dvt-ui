import * as React from 'react';
import { Box } from '@mui/material';

type PageToolbarProps = {
  justify?: 'flex-start' | 'flex-end' | 'space-between';
  children: React.ReactNode;
};

// Actions and status of a tab, at the top of its content.
export const PageToolbar = ({
  justify = 'flex-end',
  children,
}: PageToolbarProps) => (
  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: justify,
      gap: 1.5,
      mb: 2,
    }}
  >
    {children}
  </Box>
);
