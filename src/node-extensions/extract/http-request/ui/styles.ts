import { alpha, Box, styled, Tab, Tabs, Typography } from '@mui/material';

export const Container = styled(Box)({
  height: '100%',
  overflow: 'auto',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const Panel = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
}));

export const PanelHeader = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: alpha(theme.palette.grey[50], 0.7),
}));

export const PanelTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
}));

export const PanelBody = styled(Box)({
  padding: 16,
});

export const FieldGroup = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const FieldLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
}));

export const RequestRow = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: 12,
  alignItems: 'center',
});

export const TabsHeader = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.grey[50], 0.6),
}));

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 40,
  '& .MuiTabs-indicator': {
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.palette.primary.main,
  },
}));

export const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 40,
  textTransform: 'none',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  padding: '6px 16px',
  '&.Mui-selected': {
    color: theme.palette.text.primary,
  },
}));

export const TabPanel = styled(Box)(({ theme }) => ({
  padding: 8,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}));

export const HintText = styled(Typography)(({ theme }) => ({
  fontSize: '0.6875rem',
  color: theme.palette.text.disabled,
}));

export const AddRowButton = styled('button')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.grey[50], 0.8),
  color: theme.palette.text.secondary,
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
    borderColor: theme.palette.grey[300],
    color: theme.palette.text.primary,
  },
}));
