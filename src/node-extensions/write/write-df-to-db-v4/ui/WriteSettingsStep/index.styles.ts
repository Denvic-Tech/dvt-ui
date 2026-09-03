import { Box, styled, Switch, Typography } from '@mui/material';

import { getDataTypeTone } from '../dataTypeTone';

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
  overflowY: 'auto',
  overflowX: 'hidden',
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
  minHeight: 260,
}));

export const MappingHeader = styled(Box)(() => ({
  padding: '12px 16px',
  backgroundColor: '#ffffff',
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

export const MappingTableContainer = styled(Box)(() => ({
  width: '100%',
  flex: 1,
  minHeight: 180,
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
  // Фиксированная раскладка: ширины колонок берутся из ячеек шапки и не
  // пересчитываются по содержимому строк. Это удерживает выравнивание шапки
  // при виртуализации (TableVirtuoso рендерит разные строки по мере скролла).
  tableLayout: 'fixed',
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
  height: 48,
  transition: 'background-color 100ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
}));

export const TableBodyCell = styled('td')(() => ({
  height: 48,
  boxSizing: 'border-box',
  padding: '8px 16px',
  verticalAlign: 'middle',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  transition: 'background-color 140ms ease',
  '&:last-child': {
    textAlign: 'right',
  },
}));

export const ColumnName = styled('span')(() => ({
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 12,
}));

export const EmptyCell = styled('span')(() => ({
  color: '#d1d5db',
}));

export const NullableControl = styled('label')({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: 'fit-content',
  minHeight: 32,
  gap: 5,
  cursor: 'pointer',
  userSelect: 'none',
  '& input:focus-visible + span': {
    outline: '2px solid rgba(99, 102, 241, 0.22)',
    outlineOffset: 2,
  },
});

export const NullableCheckboxInput = styled('input')({
  position: 'absolute',
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: 'none',
});

export const NullableCheckboxMark = styled('span', {
  shouldForwardProp: prop => prop !== 'checked',
})<{ checked: boolean }>(({ checked }) => ({
  position: 'relative',
  width: 14,
  height: 14,
  flex: '0 0 14px',
  boxSizing: 'border-box',
  border: checked ? '1px solid #6366f1' : '1px solid #d8dce3',
  borderRadius: 3,
  backgroundColor: checked ? '#6366f1' : '#ffffff',
  boxShadow: 'none',
  transition: 'border-color 120ms ease, background-color 120ms ease',
  '&::after': checked
    ? {
        content: '""',
        position: 'absolute',
        left: 4,
        top: 2,
        width: 3,
        height: 6,
        border: 'solid #ffffff',
        borderWidth: '0 1.25px 1.25px 0',
        transform: 'rotate(45deg)',
      }
    : undefined,
}));

export const NullableControlLabel = styled('span', {
  shouldForwardProp: prop => prop !== 'checked',
})<{ checked: boolean }>(({ checked }) => ({
  color: checked ? '#374151' : '#9ca3af',
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 11,
  fontWeight: checked ? 600 : 500,
  lineHeight: '14px',
  transition: 'color 120ms ease',
}));

export const NullableReadOnlyChip = styled('span', {
  shouldForwardProp: prop => prop !== 'nullable',
})<{ nullable: boolean }>(({ nullable }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  minHeight: 18,
  boxSizing: 'border-box',
  padding: '2px 7px',
  borderRadius: 5,
  backgroundColor: nullable ? '#fff3d6' : '#e9f7ee',
  color: nullable ? '#a85d00' : '#267a46',
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 9,
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: 0.35,
  whiteSpace: 'nowrap',
  '&::before': {
    content: '""',
    width: 5,
    height: 5,
    flex: '0 0 5px',
    borderRadius: '50%',
    backgroundColor: nullable ? '#c77a0a' : '#3c9460',
  },
}));

export const TypeBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'dataType',
})<{ dataType: string }>(({ dataType }) => {
  const tone = getDataTypeTone(dataType);

  return {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    backgroundColor: tone.background,
    color: tone.color,
    borderRadius: 4,
  };
});

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

export const ColumnActionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'actionType' && prop !== 'selected',
})<{
  actionType: 'add_column' | 'drop_column' | 'recreate_column';
  selected: boolean;
}>(({ actionType, selected }) => {
  const variants = {
    add_column: {
      color: '#4f46e5',
      border: '#c7d2fe',
      hover: '#eef2ff',
      selectedColor: '#047857',
      selectedBorder: '#a7f3d0',
      selectedBg: '#ecfdf5',
      selectedHover: '#d1fae5',
    },
    drop_column: {
      color: '#dc2626',
      border: '#fecaca',
      hover: '#fef2f2',
      selectedColor: '#b91c1c',
      selectedBorder: '#fecaca',
      selectedBg: '#fef2f2',
      selectedHover: '#fee2e2',
    },
    recreate_column: {
      color: '#b45309',
      border: '#fde68a',
      hover: '#fffbeb',
      selectedColor: '#92400e',
      selectedBorder: '#fde68a',
      selectedBg: '#fffbeb',
      selectedHover: '#fef3c7',
    },
  };
  const v = variants[actionType];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 30,
    boxSizing: 'border-box',
    padding: '5px 10px',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 140ms ease',
    color: selected ? v.selectedColor : v.color,
    backgroundColor: selected ? v.selectedBg : 'transparent',
    border: `1px solid ${selected ? v.selectedBorder : v.border}`,
    '&:hover': {
      backgroundColor: selected ? v.selectedHover : v.hover,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${v.border}`,
    },
  };
});

export const ColumnActionCheck = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 14,
  flexShrink: 0,
  fontSize: 11,
  lineHeight: 1,
  '& svg': {
    display: 'block',
  },
}));

export const ColumnActionLabel = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  height: 14,
  lineHeight: 1,
  transform: 'translateY(-1px)',
}));

export const ColumnActionDismiss = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 14,
  flexShrink: 0,
  marginLeft: 2,
  opacity: 0.72,
  lineHeight: 1,
  '& svg': {
    display: 'block',
  },
}));

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
