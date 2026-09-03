import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

export const Spinner = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof CircularProgress>
>(({ size = 16, ...props }, ref) => (
  <CircularProgress ref={ref} size={size} {...props} />
));
Spinner.displayName = 'Spinner';
