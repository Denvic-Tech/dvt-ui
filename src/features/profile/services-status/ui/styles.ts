import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PageContainer = styled(Box)(({ theme }) => ({
  padding: 32,
  backgroundColor: '#f9fafb',
  borderRadius: 24,
  border: '1px solid #eef2f7',
  boxSizing: 'border-box',
  [theme.breakpoints.down('sm')]: {
    padding: 20,
    borderRadius: 20,
  },
}));

export const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 32,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const PageHeading = styled(Box)(() => ({
  minWidth: 0,
}));

export const PageTitleRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  [theme.breakpoints.down('sm')]: {
    gap: 8,
  },
}));

export const PageTitle = styled(Typography)(() => ({
  fontSize: 20,
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.2,
}));

export const PageDescription = styled(Typography)(() => ({
  fontSize: 14,
  color: '#6b7280',
  marginTop: 6,
}));

export const VersionBadge = styled('span')(() => ({
  padding: '4px 10px',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 8,
  whiteSpace: 'nowrap',
}));

export const RefreshButton = styled('button')(() => ({
  padding: '10px 16px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  minHeight: 44,
  '&:hover:not(:disabled)': {
    backgroundColor: '#f9fafb',
  },
  '&:disabled': {
    cursor: 'default',
    opacity: 0.7,
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}));

export const HeaderActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  [theme.breakpoints.down('md')]: {
    justifyContent: 'flex-start',
  },
}));

export const AutoRefreshButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ active = false }) => ({
  padding: '10px 16px',
  backgroundColor: active ? '#eff6ff' : '#ffffff',
  border: `1px solid ${active ? '#bfdbfe' : '#e5e7eb'}`,
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: active ? '#1d4ed8' : '#374151',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  minHeight: 44,
  '&:hover': {
    backgroundColor: active ? '#dbeafe' : '#f9fafb',
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}));

export const SectionsStack = styled(Box)(() => ({
  display: 'grid',
  gap: 24,
}));

export const CategorySection = styled(Box)(() => ({
  marginBottom: 0,
}));

export const CategoryHeader = styled('button')(() => ({
  width: '100%',
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
  fontFamily: 'inherit',
}));

export const CategoryTitleGroup = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}));

export const CategoryIcon = styled(Box)(() => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& svg': {
    width: 16,
    height: 16,
    color: '#6b7280',
  },
}));

export const CategoryTitle = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 600,
  color: '#111827',
}));

export const CategoryCount = styled('span')(() => ({
  padding: '2px 8px',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 12,
  whiteSpace: 'nowrap',
}));

export const CategoryContent = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const EmptyStateCard = styled(Box)(() => ({
  padding: 24,
  backgroundColor: '#ffffff',
  borderRadius: 16,
  border: '1px dashed #d1d5db',
  color: '#6b7280',
  fontSize: 14,
}));

export const ServiceCard = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  transition: 'box-shadow 150ms ease, border-color 150ms ease',
  '&:hover': {
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    borderColor: '#dbe2ea',
  },
}));

export const CardHeader = styled(Box)(({ theme }) => ({
  padding: '20px 20px 16px 20px',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const CardTitleGroup = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  flexWrap: 'wrap',
}));

export const CardTitle = styled(Typography)(() => ({
  fontSize: 18,
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.2,
}));

export const TaskBadge = styled('span')(() => ({
  padding: '4px 10px',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}));

export const TaskBadgeDot = styled('span')(() => ({
  width: 6,
  height: 6,
  backgroundColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'serviceStatsTaskPulse 2s infinite',
  '@keyframes serviceStatsTaskPulse': {
    '0%, 100%': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '50%': {
      opacity: 0.55,
      transform: 'scale(0.88)',
    },
  },
}));

export const StatusBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'status',
})<{ status?: 'running' | 'stopped' | 'error' }>(({ status = 'running' }) => {
  const colors = {
    running: { bg: '#d1fae5', color: '#059669' },
    stopped: { bg: '#f3f4f6', color: '#6b7280' },
    error: { bg: '#fee2e2', color: '#dc2626' },
  };

  return {
    padding: '4px 10px',
    backgroundColor: colors[status].bg,
    color: colors[status].color,
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 12,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    '& svg': {
      width: 14,
      height: 14,
    },
  };
});

export const StatsGrid = styled(Box)(({ theme }) => ({
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const StatCard = styled(Box)(() => ({
  padding: 12,
  backgroundColor: '#f9fafb',
  borderRadius: 12,
}));

export const StatHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 6,
}));

export const StatIcon = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    width: 14,
    height: 14,
    color: '#6b7280',
  },
}));

export const StatLabel = styled(Typography)(() => ({
  fontSize: 12,
  color: '#6b7280',
}));

export const StatValue = styled(Typography)(() => ({
  fontSize: 20,
  fontWeight: 700,
  color: '#111827',
  marginBottom: 8,
  lineHeight: 1.1,
}));

export const StatProgressBar = styled(Box)(() => ({
  width: '100%',
  height: 6,
  backgroundColor: '#e5e7eb',
  borderRadius: 3,
  overflow: 'hidden',
  marginBottom: 6,
}));

export const StatProgressFill = styled(Box, {
  shouldForwardProp: prop => prop !== 'percent',
})<{ percent: number }>(({ percent }) => {
  let color = '#10b981';
  if (percent >= 50) color = '#f59e0b';
  if (percent >= 80) color = '#ef4444';

  return {
    height: '100%',
    width: `${Math.min(Math.max(percent, 0), 100)}%`,
    backgroundColor: color,
    borderRadius: 3,
    transition: 'width 300ms ease',
  };
});

export const StatDetail = styled(Typography)(() => ({
  fontSize: 11,
  color: '#9ca3af',
  lineHeight: 1.4,
}));

export const TaskBlock = styled(Box)(() => ({
  margin: '16px 20px',
  padding: 16,
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 12,
}));

export const TaskBlockHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const TaskBlockLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}));

export const TaskBlockIcon = styled(Box)(() => ({
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: '#3b82f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& svg': {
    width: 20,
    height: 20,
    color: '#ffffff',
  },
}));

export const TaskBlockTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#1e40af',
}));

export const TaskBlockRight = styled(Box)(() => ({
  textAlign: 'right',
}));

export const TaskBlockValue = styled(Typography)(() => ({
  fontSize: 20,
  fontWeight: 700,
  color: '#1e40af',
  lineHeight: 1.1,
}));

export const TaskBlockPercent = styled(Typography)(() => ({
  fontSize: 12,
  color: '#3b82f6',
}));

export const TaskProgressBar = styled(Box)(() => ({
  width: '100%',
  height: 8,
  backgroundColor: '#bfdbfe',
  borderRadius: 4,
  overflow: 'hidden',
}));

export const TaskProgressFill = styled(Box, {
  shouldForwardProp: prop => prop !== 'percent',
})<{ percent: number }>(({ percent }) => ({
  height: '100%',
  width: `${Math.min(Math.max(percent, 0), 100)}%`,
  backgroundColor: '#3b82f6',
  borderRadius: 4,
  transition: 'width 300ms ease',
}));

export const DetailsToggle = styled('button')(() => ({
  width: '100%',
  padding: '12px 20px',
  marginTop: 12,
  backgroundColor: 'transparent',
  border: 'none',
  borderTop: '1px solid #f3f4f6',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontSize: 14,
  color: '#6b7280',
  fontFamily: 'inherit',
  transition: 'background-color 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
  '& svg': {
    width: 16,
    height: 16,
    transition: 'transform 200ms ease',
  },
}));

export const DetailsPanel = styled(Box)(() => ({
  padding: '16px 20px 20px 20px',
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #f3f4f6',
}));

export const DetailsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '4px 24px',
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const DetailRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 0',
  minWidth: 0,
}));

export const DetailIcon = styled(Box)(() => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& svg': {
    width: 16,
    height: 16,
    color: '#9ca3af',
  },
}));

export const DetailContent = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const DetailLabel = styled(Typography)(() => ({
  fontSize: 12,
  color: '#6b7280',
}));

export const DetailValue = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 500,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const UnavailableState = styled(Box)(() => ({
  margin: '0 20px 20px 20px',
  padding: 20,
  borderRadius: 12,
  border: '1px dashed #d1d5db',
  backgroundColor: '#f9fafb',
}));

export const UnavailableTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
}));

export const UnavailableDescription = styled(Typography)(() => ({
  fontSize: 13,
  color: '#6b7280',
}));
