import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const SettingsLayout = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(340px, 42%) minmax(0, 1fr)',
  height: '100%',
  minHeight: 280,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  overflow: 'hidden',
  background: theme.palette.background.paper,
  fontFamily: 'Inter, sans-serif',
  '@media (max-width: 760px)': {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'minmax(180px, 1fr) minmax(220px, 1fr)',
  },
}));

export const SettingsSidebar = styled(Box)(({ theme }) => ({
  minHeight: 0,
  minWidth: 0,
  overflowY: 'auto',
  borderRight: `1px solid ${theme.palette.divider}`,
  '@media (max-width: 760px)': {
    borderRight: 0,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

export const SettingsSection = styled(Box)(({ theme }) => ({
  padding: '18px 20px',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const SectionTitle = styled(Typography)({
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  lineHeight: '16px',
  color: '#9b9ba6',
  textTransform: 'uppercase',
  marginBottom: 10,
});

export const DdlPanel = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  background: '#f7f7f8',
});

export const DdlHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 12px 8px 18px',
  minHeight: 46,
  boxSizing: 'border-box',
  flexShrink: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));
