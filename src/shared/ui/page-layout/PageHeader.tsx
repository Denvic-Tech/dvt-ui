import * as React from 'react';
import { Box, Typography } from '@mui/material';

export type PageHeaderIcon = React.ElementType;

type PageHeaderProps = {
  title: string;
  icon?: PageHeaderIcon;
  actions?: React.ReactNode;
};

// Fixed, so the title and the divider stay in place on every tab with or without
// actions. Actions have to fit into this height.
const HEADER_ROW_HEIGHT = 30;

export const PageHeader = ({ title, icon: Icon, actions }: PageHeaderProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      height: HEADER_ROW_HEIGHT,
      minWidth: 0,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      {Icon ? (
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            color: '#4A4E5C',
            '& svg': { width: 18, height: 18 },
          }}
        >
          <Icon />
        </Box>
      ) : null}
      <Typography
        component='h1'
        noWrap
        sx={{
          color: '#2A2D3A',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: '20px',
        }}
      >
        {title}
      </Typography>
    </Box>

    {actions ? (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          flexShrink: 0,
        }}
      >
        {actions}
      </Box>
    ) : null}
  </Box>
);
