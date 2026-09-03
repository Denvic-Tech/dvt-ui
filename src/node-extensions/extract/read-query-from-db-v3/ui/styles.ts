import { alpha, Box, styled } from '@mui/material';

export const FieldGroup = styled(Box)({});

export const FieldLabel = styled('div')(({ theme }) => ({
  ...theme.typography.body2,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
}));

export const ConnectionInput = styled(Box)({
  display: 'flex',
  gap: 8,
});

export const StyledInput = styled('input')(({ theme }) => ({
  flex: 1,
  padding: '10px 12px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
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
  borderRadius: theme.shape.borderRadius,
  backgroundColor: connected
    ? alpha(theme.palette.success.main, 0.08)
    : alpha(theme.palette.warning.main, 0.08),
  border: `1px solid ${
    connected
      ? alpha(theme.palette.success.main, 0.2)
      : alpha(theme.palette.warning.main, 0.2)
  }`,
}));
