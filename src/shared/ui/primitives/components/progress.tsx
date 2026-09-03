import * as React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';

export interface ProgressProps extends React.ComponentProps<typeof LinearProgress> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLSpanElement, ProgressProps>(
  ({ value = 0, sx, ...props }, ref) => (
    <LinearProgress
      ref={ref}
      variant='determinate'
      value={value}
      sx={{
        height: 8,
        borderRadius: 999,
        backgroundColor: theme => alpha(theme.palette.text.secondary, 0.16),
        '& .MuiLinearProgress-bar': {
          borderRadius: 999,
        },
        ...((sx as object) ?? {}),
      }}
      {...props}
    />
  )
);
Progress.displayName = 'Progress';
