import { Box, Grid2 as Grid, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { Panel } from '@/shared/ui';
import { mergeSx } from '@/shared/ui/primitives/components/control-styles';

import { uikitCodeBlockSx } from './uikit-styles';

export const UIKitPageLead = ({
  children,
  description,
  title,
}: {
  children?: ReactNode;
  description: ReactNode;
  title: ReactNode;
}) => (
  <Panel component='section' sx={{ display: 'grid', gap: 2.5 }}>
    <Typography component='h1' sx={{ fontSize: 24, fontWeight: 600 }}>
      {title}
    </Typography>
    <Typography color='text.secondary' sx={{ fontSize: 14, lineHeight: 1.6 }}>
      {description}
    </Typography>
    {children}
  </Panel>
);

export const UIKitSection = ({
  children,
  description,
  id,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  id: string;
  title: ReactNode;
}) => (
  <Box component='section' id={id} sx={{ display: 'grid', gap: 2.5 }}>
    <Box sx={{ display: 'grid', gap: 0.5 }}>
      <Typography component='h2' sx={{ fontSize: 20, fontWeight: 600 }}>
        {title}
      </Typography>
      {description ? (
        <Typography
          color='text.secondary'
          sx={{ fontSize: 14, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      ) : null}
    </Box>
    <Box sx={{ display: 'grid', gap: 2 }}>{children}</Box>
  </Box>
);

export const UIKitDemoField = ({
  children,
  hint,
  label,
}: {
  children: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
}) => (
  <Grid container spacing={2}>
    <Grid size={{ md: 5, xs: 12 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{label}</Typography>
      {hint ? (
        <Typography
          color='text.secondary'
          sx={{ fontSize: 12, lineHeight: 1.6 }}
        >
          {hint}
        </Typography>
      ) : null}
    </Grid>
    <Grid size={{ md: 7, xs: 12 }}>{children}</Grid>
  </Grid>
);

export const UIKitCodeBlock = ({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) => <Box sx={mergeSx(uikitCodeBlockSx, sx)}>{children}</Box>;
