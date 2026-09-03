import { Box, Switch, Typography, styled } from '@mui/material';

export const SettingsHeader = styled(Box)(() => ({
  padding: '16px 24px',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}));

export const HeaderLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}));

export const HeaderIcon = styled(Box)(() => ({
  width: 32,
  height: 32,
  borderRadius: 10,
  backgroundColor: '#e0e7ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: 16,
    color: '#6366f1',
  },
}));

export const HeaderTitle = styled(Typography)(() => ({
  fontSize: 15,
  fontWeight: 600,
  color: '#1f2937',
}));

export const HeaderBadges = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}));

export const HeaderBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'variant',
})<{ variant?: 'default' | 'warning' }>(({ variant = 'default' }) => ({
  padding: '4px 12px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 8,
  backgroundColor: variant === 'warning' ? '#fef3c7' : '#f3f4f6',
  color: variant === 'warning' ? '#b45309' : '#4b5563',
}));

export const SettingsContent = styled(Box)(() => ({
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  flex: 1,
  minHeight: 0,
}));

export const InputCardsRow = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  '@media (max-width: 900px)': {
    gridTemplateColumns: '1fr',
  },
}));

export const InputCard = styled(Box)(() => ({
  padding: 16,
  backgroundColor: '#f9fafb',
  borderRadius: 12,
}));

export const InputLabel = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 500,
  color: '#6b7280',
  marginBottom: 8,
}));

export const StyledInput = styled('input')(() => ({
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#374151',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  transition: 'all 150ms ease',
  '&:hover': {
    borderColor: '#d1d5db',
  },
  '&:focus': {
    borderColor: '#a5b4fc',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const ToggleCard = styled(Box)(() => ({
  padding: 16,
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}));

export const ToggleCardLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}));

export const ToggleIconWrapper = styled(Box)(() => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: '#d1fae5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 16,
    color: '#059669',
  },
}));

export const ToggleTextGroup = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
}));

export const ToggleTitle = styled(Typography)(() => ({
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
}));

export const ToggleSubtitle = styled(Typography)(() => ({
  fontSize: 11,
  fontWeight: 400,
  color: '#9ca3af',
}));

export const StyledSwitch = styled(Switch)(() => ({
  width: 44,
  height: 24,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      '& + .MuiSwitch-track': {
        backgroundColor: '#6366f1',
        opacity: 1,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
  '& .MuiSwitch-track': {
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    opacity: 1,
  },
}));

export const MappingSection = styled(Box)(() => ({
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
}));

export const MappingHeader = styled(Box)(() => ({
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}));

export const MappingHeaderLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
}));

export const MappingTitle = styled(Typography)(() => ({
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
}));

export const StatsBadgesRow = styled(Box)(() => ({
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
}));

export const StatBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'variant',
})<{
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}>(({ variant = 'default' }) => {
  const variants = {
    default: { bg: '#e5e7eb', color: '#4b5563' },
    success: { bg: '#d1fae5', color: '#047857' },
    error: { bg: '#fee2e2', color: '#dc2626' },
    warning: { bg: '#fef3c7', color: '#b45309' },
    info: { bg: '#dbeafe', color: '#1d4ed8' },
  };
  const v = variants[variant];

  return {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 4,
    backgroundColor: v.bg,
    color: v.color,
  };
});

export const ValidationToggle = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const ValidationLabel = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#6b7280',
}));

export const SmallSwitch = styled(Switch)(() => ({
  width: 36,
  height: 20,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      '& + .MuiSwitch-track': {
        backgroundColor: '#6366f1',
        opacity: 1,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
  '& .MuiSwitch-track': {
    borderRadius: 10,
    backgroundColor: '#d1d5db',
    opacity: 1,
  },
}));

export const MappingTableContainer = styled(Box)(() => ({
  width: '100%',
  flex: 1,
  minHeight: 256,
  maxHeight: 'none',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 3,
  },
}));

export const MappingTable = styled('table')(() => ({
  width: '100%',
  fontSize: 13,
  borderCollapse: 'collapse',
}));

export const MappingTableHead = styled('thead')(() => ({
  backgroundColor: '#f9fafb',
  position: 'sticky',
  top: 0,
  zIndex: 1,
}));

export const TableHeadCell = styled('th')(() => ({
  padding: '8px 16px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #e5e7eb',
  '&:last-child': {
    textAlign: 'right',
  },
}));

export const StyledTableRow = styled('tr')(() => ({
  transition: 'background-color 100ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
}));

export const TableBodyCell = styled('td')(() => ({
  padding: '10px 16px',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  '&:last-child': {
    textAlign: 'right',
  },
}));

export const ColumnName = styled('span')(() => ({
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 12,
}));

export const EmptyCell = styled('span')(() => ({
  color: '#d1d5db',
}));

export const TypeBadge = styled('span')(() => ({
  padding: '2px 8px',
  fontSize: 10,
  fontWeight: 600,
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  borderRadius: 4,
}));

export const MappingStatusBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'variant',
})<{
  variant: 'notInDb' | 'notInDf' | 'typeMismatch' | 'ok' | 'softCast';
}>(({ variant }) => {
  const variants = {
    notInDb: { bg: '#fee2e2', color: '#dc2626' },
    notInDf: { bg: '#fef3c7', color: '#b45309' },
    typeMismatch: { bg: '#fce7f3', color: '#be185d' },
    ok: { bg: '#d1fae5', color: '#047857' },
    softCast: { bg: '#dbeafe', color: '#1d4ed8' },
  };
  const v = variants[variant];

  return {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    backgroundColor: v.bg,
    color: v.color,
    borderRadius: 4,
  };
});

export const WarningBanner = styled(Box)(() => ({
  padding: 12,
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}));

export const WarningIconWrapper = styled(Box)(() => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: '#fef3c7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 12,
    color: '#d97706',
  },
}));

export const WarningText = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#92400e',
  lineHeight: 1.5,
}));

export const StepCard = styled(Box)(() => ({
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
}));
