import { alpha, type Theme } from '@mui/material/styles';

import {
  getInsetSurfaceStyles,
  getRadius,
  getSurfaceShadow,
} from '@/shared/ui/primitives/components/theme-style-helpers';

export const uikitNestedSurfaceSx = (theme: Theme) =>
  getInsetSurfaceStyles(theme);

export const uikitElevatedSurfaceSx = (theme: Theme) =>
  getInsetSurfaceStyles(theme, {
    backgroundOpacity: 0.94,
    radiusDelta: 4,
  });

export const uikitSelectableRowSx = (theme: Theme) => ({
  ...getInsetSurfaceStyles(theme, {
    backgroundOpacity: theme.palette.mode === 'light' ? 0.96 : 0.84,
    radiusDelta: 2,
    shadow: 'xs',
  }),
  alignItems: 'flex-start',
  display: 'flex',
  gap: 1.5,
  px: 1.5,
  py: 1.5,
});

export const uikitCodeBlockSx = (theme: Theme) => ({
  ...getInsetSurfaceStyles(theme, {
    backgroundOpacity: theme.palette.mode === 'light' ? 0.72 : 0.56,
    radiusDelta: 4,
    shadow: 'sm',
  }),
  fontFamily: 'monospace',
  fontSize: 12,
  lineHeight: 1.7,
  px: 2,
  py: 1.5,
});

export const createUIKitNavItemSx = (isActive: boolean) => (theme: Theme) => ({
  alignItems: 'center',
  border: '1px solid',
  borderColor: isActive
    ? alpha(theme.palette.primary.main, 0.18)
    : theme.palette.divider,
  borderRadius: getRadius(theme),
  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
  display: 'flex',
  gap: 1.25,
  px: 1.5,
  py: 1.25,
  transition:
    'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
  ...(isActive
    ? {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        boxShadow: getSurfaceShadow(theme, 'xs'),
      }
    : {
        backgroundColor: 'transparent',
      }),
});

export const createUIKitNavIconSx = (isActive: boolean) => (theme: Theme) => ({
  alignItems: 'center',
  backgroundColor: isActive
    ? alpha(theme.palette.primary.main, 0.12)
    : theme.palette.action.hover,
  borderRadius: getRadius(theme),
  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
  display: 'inline-flex',
  height: 36,
  justifyContent: 'center',
  minWidth: 36,
});

export const createUIKitSectionLinkSx =
  (isActive: boolean) => (theme: Theme) => ({
    borderLeft: '1px solid',
    borderColor: isActive
      ? alpha(theme.palette.primary.main, 0.3)
      : theme.palette.divider,
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    display: 'block',
    fontSize: 13,
    lineHeight: 1.5,
    paddingBlock: '4px',
    paddingInline: '12px',
    textDecoration: 'none',
    transition: 'color 150ms ease, border-color 150ms ease',
  });
