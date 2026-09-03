import * as React from 'react';
import MuiAlert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { mergeSx } from './control-styles.ts';
import { getRadius } from './theme-style-helpers.ts';

type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

const severityMap: Record<AlertVariant, 'info' | 'success' | 'warning' | 'error'> = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  destructive: 'error',
};

export interface AlertProps
  extends Omit<React.ComponentProps<typeof MuiAlert>, 'severity' | 'variant'> {
  variant?: AlertVariant;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'default', sx, ...props }, ref) => (
    <MuiAlert
      ref={ref}
      severity={severityMap[variant]}
      variant='outlined'
      sx={mergeSx(
        theme => ({
          borderRadius: getRadius(theme, 6),
          alignItems: 'flex-start',
        }),
        sx
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof Typography>
>(({ sx, ...props }, ref) => (
  <Typography
    ref={ref}
    component='p'
    sx={{ fontWeight: 600, mb: 0.5, ...((sx as object) ?? {}) }}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ sx, ...props }, ref) => (
  <Box
    ref={ref}
    sx={{ fontSize: 14, lineHeight: 1.6, ...((sx as object) ?? {}) }}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';
