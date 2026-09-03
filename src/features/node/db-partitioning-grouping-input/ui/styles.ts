import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { alpha, Box, styled } from '@mui/material';

export const GroupingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const ModeSelectContainer = styled(Box)({
  position: 'relative',
  width: '100%',
});

export const ModeSelectTrigger = styled('button')<{
  hasValue?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}>(({ theme, hasValue, hasError, disabled }) => ({
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${
    hasError
      ? theme.palette.error.main
      : hasValue
        ? theme.palette.primary.main
        : theme.palette.divider
  }`,
  borderRadius: 8,
  backgroundColor: disabled
    ? theme.palette.grey[50]
    : theme.palette.background.paper,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: '0.8125rem',
  color: hasValue ? theme.palette.text.primary : theme.palette.text.secondary,
  transition: 'all 0.15s ease',
  fontFamily: 'inherit',
  '&:hover:not(:disabled)': {
    borderColor: hasError
      ? theme.palette.error.main
      : theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
  },
  '&:focus': {
    outline: 'none',
    borderColor: hasError
      ? theme.palette.error.main
      : theme.palette.primary.main,
  },
}));

export const ModeSelectValue = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  textAlign: 'left',
});

export const PlaceholderText = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.8125rem',
}));

export const SelectChevron = styled(KeyboardArrowDownIcon, {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{
  isOpen?: boolean;
}>(({ theme, isOpen }) => ({
  fontSize: 18,
  color: theme.palette.text.secondary,
  opacity: 0.5,
  transition: 'transform 0.15s ease',
  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  flexShrink: 0,
}));

export const DropdownPortal = styled(Box)(({ theme }) => ({
  position: 'fixed',
  zIndex: 9999,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  maxHeight: 280,
  overflowY: 'auto',
  animation: 'fadeIn 0.15s ease',
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
}));

export const ModeOption = styled('button')<{ isSelected?: boolean }>(
  ({ theme, isSelected }) => ({
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    backgroundColor: isSelected
      ? alpha(theme.palette.primary.main, 0.08)
      : 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    fontSize: '0.8125rem',
    color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
    transition: 'background-color 0.15s ease',
    fontFamily: 'inherit',
    textAlign: 'left',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
  })
);

export const ParametersGrid = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const ParameterRow = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const ParameterLabel = styled('label')(({ theme }) => ({
  fontSize: '0.6875rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
}));

export const ParameterInput = styled('input')<{ hasError?: boolean }>(
  ({ theme, hasError }) => ({
    padding: '8px 10px',
    border: `1px solid ${hasError ? theme.palette.error.main : theme.palette.divider}`,
    borderRadius: 6,
    fontSize: '0.8125rem',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    outline: 'none',
    '&:focus': {
      borderColor: hasError
        ? theme.palette.error.main
        : theme.palette.primary.main,
    },
    '&::placeholder': {
      color: theme.palette.text.disabled,
    },
  })
);

export const HelperText = styled('span')(({ theme }) => ({
  fontSize: '0.6875rem',
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));

export const ClearButton = styled('button')(({ theme }) => ({
  padding: 4,
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  color: theme.palette.text.secondary,
  transition: 'all 0.15s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
  },
}));

export const ModeSelectActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
});

export const ModeInfoBlock = styled(Box)(({ theme }) => ({
  marginTop: 8,
  padding: 10,
  backgroundColor: alpha(theme.palette.info.main, 0.04),
  border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
  borderRadius: 6,
}));

export const ModeInfoDescription = styled('div')(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.primary,
  marginBottom: 6,
  lineHeight: 1.4,
}));

export const ModeInfoExample = styled('div')(({ theme }) => ({
  fontSize: '0.6875rem',
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
  lineHeight: 1.3,
}));
