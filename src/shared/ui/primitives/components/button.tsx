import * as React from 'react';
import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from '@mui/material/Button';
import { alpha, type Theme } from '@mui/material/styles';

import { mergeSx } from './control-styles';
import {
  getControlRadius,
  getPrimaryGradient,
  getPrimaryHoverShadow,
  getPrimaryShadow,
} from './theme-style-helpers';

type ButtonVariant =
  | 'default'
  | 'success'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'subtle'
  | 'destructive'
  | 'toolbar'
  | 'link';

type ButtonSize =
  | 'default'
  | 'xs'
  | 'sm'
  | 'lg'
  | 'pill'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const sxByVariant: Record<ButtonVariant, object | ((theme: Theme) => object)> =
  {
    default: theme => ({
      background: getPrimaryGradient(theme),
      color: theme.palette.primary.contrastText,
      boxShadow: getPrimaryShadow(theme),
      '&:hover': {
        boxShadow: getPrimaryHoverShadow(theme),
      },
    }),
    success: theme => ({
      backgroundColor: theme.palette.success.main,
      color: theme.palette.success.contrastText,
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: theme.palette.success.dark,
        boxShadow: 'none',
      },
    }),
    outline: theme => ({
      borderColor: theme.palette.divider,
      backgroundColor: alpha(
        theme.palette.background.paper,
        theme.palette.mode === 'light' ? 0.88 : 0.72
      ),
      color: theme.palette.text.primary,
    }),
    secondary: theme => ({
      borderColor: theme.palette.divider,
      backgroundColor: alpha(theme.palette.text.secondary, 0.08),
      color: theme.palette.text.primary,
    }),
    ghost: theme => ({
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: alpha(theme.palette.text.secondary, 0.08),
      },
    }),
    subtle: theme => ({
      borderColor: alpha(theme.palette.primary.main, 0.12),
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)} 0%, ${alpha(theme.palette.secondary.light, 0.18)} 100%)`,
      color: theme.palette.primary.main,
    }),
    destructive: theme => ({
      borderColor: alpha(theme.palette.error.main, 0.18),
      backgroundColor: alpha(theme.palette.error.main, 0.1),
      color: theme.palette.error.main,
    }),
    toolbar: theme => ({
      borderColor: theme.palette.divider,
      backgroundColor: alpha(
        theme.palette.background.paper,
        theme.palette.mode === 'light' ? 0.72 : 0.58
      ),
      color: theme.palette.text.secondary,
    }),
    link: theme => ({
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
      boxShadow: 'none',
    }),
  };

const sizeByVariant: Record<
  ButtonSize,
  {
    minHeight: number;
    minWidth?: number;
    px: number;
    radiusSize?: 'lg' | 'md' | 'sm' | 'xs';
    radiusValue?: string;
  }
> = {
  default: { minHeight: 40, px: 2, radiusSize: 'md' },
  xs: { minHeight: 28, px: 1, radiusSize: 'xs' },
  sm: { minHeight: 32, px: 1.5, radiusSize: 'sm' },
  lg: { minHeight: 44, px: 2.5, radiusSize: 'lg' },
  pill: { minHeight: 40, px: 2, radiusValue: '999px' },
  icon: { minHeight: 40, px: 0, minWidth: 40, radiusSize: 'md' },
  'icon-xs': { minHeight: 28, px: 0, minWidth: 28, radiusSize: 'xs' },
  'icon-sm': { minHeight: 32, px: 0, minWidth: 32, radiusSize: 'sm' },
  'icon-lg': { minHeight: 44, px: 0, minWidth: 44, radiusSize: 'lg' },
};

export const buttonVariants = ({
  size = 'default',
  variant = 'default',
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) => `mui-button mui-button-${variant} mui-button-${size}`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = 'default', variant = 'default', sx, ...props }, ref) => {
    const sizeConfig = sizeByVariant[size];
    const muiVariant =
      variant === 'default' ||
      variant === 'success' ||
      variant === 'destructive' ||
      variant === 'subtle'
        ? 'contained'
        : variant === 'outline' ||
            variant === 'secondary' ||
            variant === 'toolbar'
          ? 'outlined'
          : 'text';

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        sx={mergeSx(
          theme => ({
            minHeight: sizeConfig.minHeight,
            minWidth: sizeConfig.minWidth,
            px: sizeConfig.px,
            borderRadius:
              sizeConfig.radiusValue ??
              getControlRadius(theme, sizeConfig.radiusSize ?? 'md'),
            textTransform: 'none',
            fontWeight: 500,
            ...(typeof sxByVariant[variant] === 'function'
              ? sxByVariant[variant](theme)
              : sxByVariant[variant]),
          }),
          sx
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
