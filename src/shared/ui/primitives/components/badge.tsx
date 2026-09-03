import * as React from 'react';
import Box from '@mui/material/Box';
import { alpha, type Theme } from '@mui/material/styles';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'destructive';

const paletteByVariant = (theme: Theme) => ({
  default: {
    bg: alpha(theme.palette.text.secondary, 0.14),
    color: theme.palette.text.primary,
    border: alpha(theme.palette.text.secondary, 0.22),
  },
  primary: {
    bg: alpha(theme.palette.primary.main, 0.14),
    color: theme.palette.primary.main,
    border: alpha(theme.palette.primary.main, 0.2),
  },
  success: {
    bg: alpha(theme.palette.success.main, 0.12),
    color: theme.palette.success.main,
    border: alpha(theme.palette.success.main, 0.2),
  },
  warning: {
    bg: alpha(theme.palette.warning.main, 0.14),
    color: theme.palette.warning.main,
    border: alpha(theme.palette.warning.main, 0.22),
  },
  destructive: {
    bg: alpha(theme.palette.error.main, 0.12),
    color: theme.palette.error.main,
    border: alpha(theme.palette.error.main, 0.18),
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', style, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        component='span'
        sx={theme => {
          const palette = paletteByVariant(theme)[variant];

          return {
            alignItems: 'center',
            backgroundColor: palette.bg,
            border: `1px solid ${palette.border}`,
            borderRadius: '999px',
            color: palette.color,
            display: 'inline-flex',
            fontSize: 11,
            fontWeight: 700,
            justifyContent: 'center',
            letterSpacing: '0.04em',
            lineHeight: 1,
            minHeight: 24,
            px: 1.25,
          };
        }}
        style={style}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
