import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Inline action inside the empty state description.
export const TokenListEmptyLink = styled('button')({
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  color: '#4343D6',
  font: 'inherit',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'color 150ms ease',
  '&:hover': {
    color: '#2F2FB8',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
});

type TokenListEmptyStateProps = {
  title: string;
  children: React.ReactNode;
};

export const TokenListEmptyState = ({
  title,
  children,
}: TokenListEmptyStateProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      gap: 0.5,
      px: 3,
      py: 4,
      textAlign: 'center',
    }}
  >
    <Typography sx={{ color: '#6B7385', fontSize: 14, fontWeight: 500 }}>
      {title}
    </Typography>
    <Typography sx={{ color: '#9AA0AD', fontSize: 13, lineHeight: '19px' }}>
      {children}
    </Typography>
  </Box>
);
