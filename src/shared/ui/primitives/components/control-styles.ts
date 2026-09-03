import { alpha, type SxProps, type Theme } from '@mui/material/styles';

import {
  getControlHeight,
  getControlRadius,
  getRadius,
} from './theme-style-helpers';

const outlinedControlRootSx: SxProps<Theme> = theme => ({
  minHeight: getControlHeight(),
  borderRadius: getControlRadius(theme),
  backgroundColor: alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'light' ? 0.94 : 0.72
  ),
  boxShadow: 'none',
  transition:
    'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
  '& fieldset': {
    borderColor: theme.palette.divider,
    borderRadius: getControlRadius(theme),
    transition: 'border-color 150ms ease',
  },
  '&:hover fieldset': {
    borderColor: alpha(theme.palette.primary.main, 0.34),
  },
  '&.Mui-focused': {
    boxShadow: `0 0 0 3px ${alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.1 : 0.18
    )}`,
  },
  '&.Mui-focused fieldset': {
    borderColor: alpha(theme.palette.primary.main, 0.34),
    borderWidth: 1,
  },
  '&.Mui-disabled': {
    backgroundColor: alpha(theme.palette.text.secondary, 0.08),
  },
  '&.Mui-disabled fieldset': {
    borderColor: alpha(theme.palette.text.secondary, 0.18),
  },
});

export const textFieldControlSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': outlinedControlRootSx,
  '& .MuiInputBase-input': {
    py: '10.5px',
  },
  '& .MuiInputBase-inputMultiline': {
    py: 0,
  },
  '& .MuiInputAdornment-root': {
    color: 'text.secondary',
  },
};

export const singleLineTextFieldControlSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    boxSizing: 'border-box',
    height: `${getControlHeight()}px`,
  },
  '& .MuiInputBase-input': {
    boxSizing: 'border-box',
    height: '100%',
    py: 0,
  },
  '& .MuiAutocomplete-input': {
    py: 0,
  },
};

export const selectControlSx: SxProps<Theme> = theme => ({
  ...(typeof outlinedControlRootSx === 'function'
    ? outlinedControlRootSx(theme)
    : outlinedControlRootSx),
  boxSizing: 'border-box',
  height: `${getControlHeight()}px`,
  '& .MuiSelect-select': {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    height: '100%',
    minHeight: 'unset',
    py: 0,
    pr: '36px !important',
  },
  '& .MuiTypography-root': {
    font: 'inherit',
    lineHeight: 'inherit',
  },
  '& .MuiSelect-icon': {
    color: 'text.secondary',
    right: 12,
  },
});

export const selectMenuPaperSx: SxProps<Theme> = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: theme => getRadius(theme, 6),
  boxShadow: theme => '0 2px 8px rgba(15, 23, 42, 0.08)',
  mt: 0.75,
};

export const controlTriggerSx: SxProps<Theme> = theme => ({
  minHeight: getControlHeight(),
  width: '100%',
  justifyContent: 'space-between',
  px: 1.75,
  borderRadius: getControlRadius(theme),
  borderColor: theme.palette.divider,
  backgroundColor: alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'light' ? 0.94 : 0.72
  ),
  color: 'text.primary',
  boxShadow: 'none',
  transition:
    'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.34),
    backgroundColor: alpha(
      theme.palette.background.paper,
      theme.palette.mode === 'light' ? 0.94 : 0.72
    ),
    boxShadow: 'none',
  },
  '&:focus-visible': {
    boxShadow: `0 0 0 3px ${alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.1 : 0.18
    )}`,
  },
});

export const mergeSx = (
  base: SxProps<Theme>,
  sx?: SxProps<Theme>
): SxProps<Theme> => {
  if (!sx) {
    return base;
  }

  return Array.isArray(sx) ? [base, ...sx] : [base, sx];
};
