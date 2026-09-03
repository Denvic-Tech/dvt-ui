import * as React from 'react';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import MuiChip from '@mui/material/Chip';
import { alpha, type Theme } from '@mui/material/styles';

type ChipVariant =
  | 'outline'
  | 'solid'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'neutral';

const colorMap = (theme: Theme) => ({
  outline: {
    bg: 'transparent',
    color: theme.palette.text.secondary,
    border: alpha(theme.palette.text.secondary, 0.28),
  },
  solid: {
    bg: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.main,
    border: alpha(theme.palette.primary.main, 0.16),
  },
  success: {
    bg: alpha(theme.palette.success.main, 0.12),
    color: theme.palette.success.main,
    border: alpha(theme.palette.success.main, 0.18),
  },
  warning: {
    bg: alpha(theme.palette.warning.main, 0.12),
    color: theme.palette.warning.main,
    border: alpha(theme.palette.warning.main, 0.2),
  },
  destructive: {
    bg: alpha(theme.palette.error.main, 0.12),
    color: theme.palette.error.main,
    border: alpha(theme.palette.error.main, 0.18),
  },
  neutral: {
    bg: alpha(theme.palette.text.secondary, 0.1),
    color: theme.palette.text.secondary,
    border: alpha(theme.palette.text.secondary, 0.12),
  },
});

export interface ChipProps extends Omit<
  React.ComponentProps<typeof MuiChip>,
  'children' | 'icon' | 'label' | 'onDelete' | 'variant'
> {
  children: React.ReactNode;
  onRemove?: () => void;
  startIcon?: React.ReactElement;
  variant?: ChipVariant;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    { children, onRemove, startIcon, variant = 'outline', sx, ...props },
    ref
  ) => {
    return (
      <MuiChip
        ref={ref}
        label={children}
        deleteIcon={<CancelRoundedIcon />}
        size='small'
        sx={theme => {
          const tone = colorMap(theme)[variant];

          return {
            backgroundColor: tone.bg,
            border: `1px solid ${tone.border}`,
            borderRadius: '999px',
            color: tone.color,
            fontWeight: 500,
            '& .MuiChip-label': { px: 1.1 },
            ...((sx as object) ?? {}),
          };
        }}
        {...(startIcon ? { icon: startIcon } : {})}
        {...(onRemove ? { onDelete: onRemove } : {})}
        {...props}
      />
    );
  }
);
Chip.displayName = 'Chip';
