import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { mergeSx } from './control-styles.ts';
import { getRadius, getSurfaceShadow } from './theme-style-helpers.ts';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Paper>
>(({ sx, ...props }, ref) => (
  <Paper
    ref={ref}
    elevation={0}
    sx={mergeSx(
      theme => ({
        borderRadius: getRadius(theme, 8),
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.94 : 0.9)} 100%)`,
        boxShadow: getSurfaceShadow(theme, 'sm'),
        overflow: 'hidden',
      }),
      sx
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ sx, ...props }, ref) => (
  <Box ref={ref} sx={{ display: 'grid', gap: 1, px: 3, py: 2.5, ...((sx as object) ?? {}) }} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<typeof Typography>
>(({ sx, ...props }, ref) => (
  <Typography
    ref={ref}
    component='h3'
    sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, ...((sx as object) ?? {}) }}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof Typography>
>(({ sx, ...props }, ref) => (
  <Typography
    ref={ref}
    component='p'
    sx={{ fontSize: 14, lineHeight: 1.6, color: 'text.secondary', ...((sx as object) ?? {}) }}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ sx, ...props }, ref) => (
  <Box ref={ref} sx={{ px: 3, py: 2.5, ...((sx as object) ?? {}) }} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ sx, ...props }, ref) => (
  <Box
    ref={ref}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 3,
      py: 2.5,
      ...((sx as object) ?? {}),
    }}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
