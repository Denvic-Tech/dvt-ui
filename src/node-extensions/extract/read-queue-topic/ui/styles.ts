import { alpha, Box, styled, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

/* ================= Accordion Layout ================= */

export const AccordionContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
});

export const AccordionItem = styled(Box)<{ hasError?: boolean }>(
  ({ theme, hasError }) => ({
    border: `1px solid ${
      hasError ? theme.palette.error.main : theme.palette.divider
    }`,
    borderRadius: 8,
    overflow: 'visible',
    backgroundColor: theme.palette.background.paper,
    transition: 'border-color 0.2s ease',
  })
);

export const AccordionHeader = styled('button')<{ isOpen?: boolean }>(
  ({ theme, isOpen }) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    border: 'none',
    borderRadius: isOpen ? '8px 8px 0 0' : '8px',
    backgroundColor: isOpen
      ? theme.palette.background.paper
      : alpha(theme.palette.grey[50], 0.8),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    '&:hover': {
      backgroundColor: isOpen
        ? alpha(theme.palette.grey[50], 0.5)
        : alpha(theme.palette.grey[100], 0.6),
    },
  })
);

export const AccordionHeaderLeft = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const AccordionIcon = styled(Box)<{
  isOpen?: boolean;
  hasError?: boolean;
}>(({ theme, isOpen, hasError }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: hasError
    ? alpha(theme.palette.error.main, 0.1)
    : isOpen
      ? alpha(theme.palette.primary.main, 0.1)
      : theme.palette.grey[100],
  color: hasError
    ? theme.palette.error.main
    : isOpen
      ? theme.palette.primary.main
      : theme.palette.text.secondary,
  transition: 'all 0.2s ease',
}));

export const AccordionTitle = styled(Typography)<{ isOpen?: boolean }>(
  ({ theme, isOpen }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: isOpen ? theme.palette.text.primary : theme.palette.text.secondary,
  })
);

export const AccordionBadge = styled(Box)(({ theme }) => ({
  padding: '2px 8px',
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  fontSize: '0.75rem',
  fontWeight: 600,
}));

export const RequiredStar = styled('span')(({ theme }) => ({
  color: theme.palette.error.main,
  marginLeft: 2,
  fontSize: '0.875rem',
  fontWeight: 600,
}));

export const ErrorBadge = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 8px',
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.error.main, 0.1),
  color: theme.palette.error.main,
  fontSize: '0.6875rem',
  fontWeight: 500,
  marginLeft: 8,
}));

export const CollapsedValue = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.primary.main,
  fontWeight: 500,
  marginLeft: 'auto',
  marginRight: 12,
  maxWidth: 250,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '2px 10px',
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  borderRadius: 12,
}));

export const AccordionChevron = styled(KeyboardArrowDownIcon)<{
  isOpen?: boolean;
}>(({ theme, isOpen }) => ({
  fontSize: 20,
  color: theme.palette.text.secondary,
  opacity: 0.5,
  transition: 'transform 0.2s ease',
  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  flexShrink: 0,
}));

export const AccordionContent = styled(Box)(({ theme }) => ({
  padding: 16,
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  borderRadius: '0 0 8px 8px',
}));

export const FieldGroup = styled(Box)({
  marginBottom: 16,
  '&:last-child': {
    marginBottom: 0,
  },
});

export const FieldLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  marginBottom: 6,
}));

export const ConnectionInput = styled(Box)({
  display: 'flex',
  gap: 8,
});

export const StyledInput = styled('input')(({ theme }) => ({
  flex: 1,
  padding: '10px 12px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  fontSize: '0.8125rem',
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.primary,
  outline: 'none',
  '&:focus': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
  },
  '&:disabled': {
    color: theme.palette.text.secondary,
  },
}));

export const RefreshButton = styled('button')(({ theme }) => ({
  padding: '10px 12px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  backgroundColor: theme.palette.background.paper,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  '&:hover': {
    backgroundColor: theme.palette.grey[50],
    borderColor: theme.palette.grey[300],
  },
}));

export const StatusBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'connected',
})<{ connected?: boolean }>(({ theme, connected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 8,
  backgroundColor: connected
    ? alpha(theme.palette.success.main, 0.08)
    : alpha(theme.palette.warning.main, 0.08),
  border: `1px solid ${
    connected
      ? alpha(theme.palette.success.main, 0.2)
      : alpha(theme.palette.warning.main, 0.2)
  }`,
}));

export const SelectedTableBox = styled(Box)(({ theme }) => ({
  padding: '10px 14px',
  backgroundColor: alpha(theme.palette.primary.main, 0.06),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  borderRadius: 8,
}));

export const TableBrowserContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  overflow: 'hidden',
  height: 360,
  display: 'flex',
  flexDirection: 'column',
}));

export const ColumnSelectorContainer = styled(Box)({
  minHeight: 400,
  maxHeight: 600,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});
