import { Box, ListItemButton, styled, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export const CatalogColumns = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  minHeight: 240,
  height: '100%',
  overflow: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '8px',
  backgroundColor: theme.palette.background.paper,
}));

export const ColumnRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 0 0',
  minWidth: 240,
  minHeight: 0,
  overflow: 'hidden',
  '& + &': { borderLeft: `1px solid ${theme.palette.divider}` },
  '&:last-child': { flexGrow: 1.3 },
  '&:nth-child(2):last-child': { flexGrow: 1.5 },
}));

export const ColumnHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.75, 1.5, 1.5),
  flexShrink: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiButton-root': {
    width: 24,
    height: 24,
    minWidth: 24,
    minHeight: 24,
    padding: 0,
    flexShrink: 0,
    color: '#C0C0C8',
    '&:hover': {
      color: '#6B6B76',
      backgroundColor: 'transparent',
    },
    '&[aria-pressed]': {
      '&, &:hover, &:active': { backgroundColor: 'transparent' },
    },
    '&[aria-pressed="true"]': {
      color: theme.palette.primary.main,
      '&:hover': { color: theme.palette.primary.main },
    },
    '& svg': {
      width: 14,
      height: 14,
    },
    '&.Mui-disabled': {
      color: '#C0C0C8',
    },
  },
}));

export const catalogSearchSx: SxProps<Theme> = theme => ({
  '& .MuiOutlinedInput-root': {
    height: 34,
    minHeight: 34,
    px: 1.5,
    borderRadius: '8px',
    backgroundColor: '#F7F7F8',
    fontSize: 14,
    boxShadow: 'none',
    '& fieldset': {
      borderRadius: '8px',
      borderColor: theme.palette.divider,
    },
    '&.Mui-focused': {
      boxShadow: 'none',
    },
  },
  '& .MuiInputBase-input': {
    px: 0,
    '&::placeholder': {
      color: theme.palette.text.disabled,
      opacity: 1,
      fontWeight: 500,
    },
  },
  '& .MuiInputAdornment-root': {
    color: theme.palette.text.disabled,
    mr: 1,
  },
});

export const ColumnBody = styled(Box)({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
});

export const CatalogRow = styled(ListItemButton)(({ theme }) => ({
  height: 38,
  minHeight: 38,
  flexGrow: 0,
  flexShrink: 0,
  gap: theme.spacing(1.25),
  padding: theme.spacing(0, 2),
  borderRadius: 0,
  '&.Mui-selected': { backgroundColor: '#F2F2F4' },
  '&.Mui-selected:hover': { backgroundColor: '#F2F2F4' },
  '&.Mui-focusVisible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: -2,
  },
  '& > svg': {
    fontSize: 17,
    flexShrink: 0,
    color: theme.palette.text.disabled,
  },
}));

export const CatalogName = styled(Typography)({
  minWidth: 0,
  flex: 1,
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  fontWeight: 500,
  color: '#1A1A1F',
});

export const ColumnPlaceholder = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  minHeight: 160,
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  fontSize: 13,
}));
