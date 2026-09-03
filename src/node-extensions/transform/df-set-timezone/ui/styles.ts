import { Box, Typography, styled, alpha } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export const CustomSelectContainer = styled(Box)({
  position: 'relative',
});

export const CustomSelectTrigger = styled('button')<{
  hasValue?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}>(({ theme, hasError, disabled }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  border: `1px solid ${
    hasError ? theme.palette.error.main : theme.palette.divider
  }`,
  borderRadius: 8,
  backgroundColor: disabled
    ? theme.palette.grey[50]
    : theme.palette.background.paper,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s ease',
  opacity: disabled ? 0.6 : 1,
  '&:hover': {
    borderColor: disabled ? theme.palette.divider : theme.palette.grey[400],
  },
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

export const CustomSelectValue = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
});

export const CustomSelectActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  marginLeft: 8,
  flexShrink: 0,
});

export const ClearButton = styled('button')(({ theme }) => ({
  padding: 4,
  border: 'none',
  borderRadius: 4,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  transition: 'all 0.15s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
}));

export const SelectChevron = styled(KeyboardArrowDownIcon)<{
  isOpen?: boolean;
}>(({ theme, isOpen }) => ({
  fontSize: 18,
  color: theme.palette.text.secondary,
  transition: 'transform 0.2s ease',
  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
}));

export const DropdownPortal = styled(Box)(({ theme }) => ({
  position: 'fixed',
  maxHeight: 280,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  zIndex: 1300,
}));

export const SearchContainer = styled(Box)(({ theme }) => ({
  padding: '8px 12px',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const SearchInputWrapper = styled(Box)({
  position: 'relative',
  '& svg': {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18,
  },
});

export const SearchInput = styled('input')(({ theme }) => ({
  width: '100%',
  padding: '8px 12px 8px 34px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  fontSize: '0.8125rem',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'all 0.15s ease',
  '&::placeholder': {
    color: theme.palette.text.secondary,
    opacity: 0.6,
  },
  '&:focus': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

export const OptionsList = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 4,
});

export const CustomSelectOption = styled('button')<{ isSelected?: boolean }>(
  ({ theme, isSelected }) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    border: `1px solid ${
      isSelected ? alpha(theme.palette.primary.main, 0.2) : 'transparent'
    }`,
    borderRadius: 8,
    backgroundColor: isSelected
      ? alpha(theme.palette.primary.main, 0.08)
      : 'transparent',
    boxShadow: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: isSelected
        ? alpha(theme.palette.primary.main, 0.12)
        : theme.palette.action.hover,
      borderColor: isSelected
        ? alpha(theme.palette.primary.main, 0.35)
        : theme.palette.divider,
      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
    },
  })
);

export const OptionName = styled(Typography)({
  fontSize: '0.8125rem',
  textAlign: 'left',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const OffsetBadge = styled(Box)(({ theme }) => ({
  padding: '2px 8px',
  borderRadius: 4,
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.grey[700],
  border: `1px solid ${theme.palette.grey[200]}`,
  fontSize: '0.625rem',
  fontWeight: 600,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  flexShrink: 0,
}));

export const PlaceholderText = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  color: theme.palette.text.secondary,
}));

export const EmptyState = styled(Box)(({ theme }) => ({
  padding: 16,
  color: theme.palette.text.secondary,
  fontSize: '0.8125rem',
  textAlign: 'center',
}));
