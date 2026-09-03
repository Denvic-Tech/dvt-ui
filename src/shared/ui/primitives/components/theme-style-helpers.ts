import { alpha, type Theme } from '@mui/material/styles';

type ControlSize = 'lg' | 'md' | 'sm' | 'xs';
type ShadowLevel = 'md' | 'sm' | 'xs';

const uniformElevationShadow = '0 2px 8px rgba(15, 23, 42, 0.08)';

const controlHeightBySize: Record<ControlSize, number> = {
  xs: 28,
  sm: 32,
  md: 42,
  lg: 44,
};

const controlRadiusBySize: Record<ControlSize, number> = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
};

export const getRadius = (theme: Theme, delta = 0): string =>
  `${theme.shape.borderRadius + delta}px`;

export const getControlHeight = (size: ControlSize = 'md'): number =>
  controlHeightBySize[size];

export const getControlRadiusValue = (size: ControlSize = 'md'): number =>
  controlRadiusBySize[size];

export const getControlRadius = (
  _theme: Theme,
  size: ControlSize = 'md'
): string => `${getControlRadiusValue(size)}px`;

export const getSurfaceShadow = (
  _theme: Theme,
  _level: ShadowLevel = 'sm'
): string => uniformElevationShadow;

export const getPrimaryGradient = (theme: Theme): string =>
  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;

export const getPrimaryShadow = (_theme: Theme): string =>
  uniformElevationShadow;

export const getPrimaryHoverShadow = (_theme: Theme): string =>
  uniformElevationShadow;

export const getInsetSurfaceStyles = (
  theme: Theme,
  {
    backgroundOpacity,
    radiusDelta = 4,
    shadow = 'xs',
  }: {
    backgroundOpacity?: number;
    radiusDelta?: number;
    shadow?: ShadowLevel;
  } = {}
): Record<string, unknown> => ({
  backgroundColor: alpha(
    theme.palette.background.paper,
    backgroundOpacity ?? (theme.palette.mode === 'light' ? 0.72 : 0.56)
  ),
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: getRadius(theme, radiusDelta),
  boxShadow: getSurfaceShadow(theme, shadow),
});
