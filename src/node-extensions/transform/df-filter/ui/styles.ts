import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { getTypeColor } from './helpers.ts';

export const DropdownContainer = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
}));

export const SearchContainer = styled(Box)(() => ({
  padding: 8,
  borderBottom: '1px solid #f3f4f6',
}));

export const SearchInputWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 30,
  padding: '0 10px',
  backgroundColor: '#f9fafb',
  borderRadius: 7,
}));

export const SearchInput = styled('input')(() => ({
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: 12,
  fontFamily: 'inherit',
  color: '#111827',
  minWidth: 0,

  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const SearchIcon = styled('svg')(() => ({
  width: 14,
  height: 14,
  color: '#9ca3af',
  flexShrink: 0,
}));

export const ColumnList = styled(Box)(() => ({
  maxHeight: 256,
  overflowY: 'auto',
  padding: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,

  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 2,
  },
}));

export const ColumnItem = styled('button', {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  width: '100%',
  padding: '6px 10px',
  borderRadius: 7,
  border: 'none',
  backgroundColor: isSelected ? '#eef2ff' : 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  transition: 'all 150ms ease',
  fontFamily: 'inherit',

  '&:hover': {
    backgroundColor: isSelected ? '#eef2ff' : '#f9fafb',
  },
}));

export const ColumnName = styled('span', {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: isSelected ? '#4338ca' : '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'left',
  width: '100%',
}));

export const ColumnNameTooltipTarget = styled('span')(() => ({
  display: 'block',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
}));

export const TypeBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'dataType',
})<{ dataType: string }>(({ dataType }) => {
  const color = getTypeColor(dataType);
  return {
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
    backgroundColor: color.bg,
    color: color.text,
    flexShrink: 0,
    lineHeight: 1.2,
  };
});

export const OperationGrid = styled(Box)(() => ({
  padding: 12,
  maxHeight: 320,
  overflowY: 'auto',

  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 2,
  },
}));

export const OperationGroupTitle = styled(Typography)(() => ({
  fontSize: 10,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 8,
}));

export const OperationGroupSection = styled(Box)(() => ({
  '& + &': {
    marginTop: 14,
  },
}));

export const OperationGridContainer = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, var(--operation-tile-width, 60px))',
  gap: 6,
  width: 'fit-content',
}));

export const OperationItem = styled('button', {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  padding: 8,
  borderRadius: 12,
  border: 'none',
  backgroundColor: isSelected ? '#6366f1' : '#f9fafb',
  color: isSelected ? '#ffffff' : '#4b5563',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  transition: 'all 150ms ease',
  fontFamily: 'inherit',

  '&:hover': {
    backgroundColor: isSelected ? '#4f46e5' : '#f3f4f6',
  },

  ...(isSelected
    ? {
        transform: 'scale(1.02)',
      }
    : {}),
}));

export const OperationSymbol = styled('span')(() => ({
  fontSize: 18,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  lineHeight: 1,
}));

export const OperationLabel = styled(Typography)(() => ({
  fontSize: 9,
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
  textAlign: 'center',
  color: 'inherit',
  lineHeight: 1.1,
}));

export const SelectorTriggerButton = styled('button')(() => ({
  minWidth: 170,
  width: '100%',
  height: 30,
  padding: '0 10px',
  borderRadius: 8,
  border: '1.5px solid #e5e7eb',
  backgroundColor: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',

  '&:hover': {
    borderColor: '#d1d5db',
  },

  '&:focus-visible': {
    outline: 'none',
    borderColor: '#a5b4fc',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
  },
}));

export const SelectorTriggerLeft = styled(Box)(() => ({
  minWidth: 0,
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  overflow: 'hidden',
}));

export const SelectorTriggerText = styled(Typography)(() => ({
  fontSize: 12,
  color: '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

export const SelectorTriggerSymbol = styled('span')(() => ({
  fontSize: 14,
  lineHeight: 1,
  color: '#4b5563',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}));

export const SelectorChevron = styled('span')(() => ({
  color: '#9ca3af',
  fontSize: 12,
  lineHeight: 1,
  flexShrink: 0,
}));

export const EmptyState = styled(Typography)(() => ({
  fontSize: 12,
  color: '#9ca3af',
  padding: '8px 10px',
}));

export const FilterHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '8px 16px',
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  borderBottom: '1px solid #f3f4f6',
  flexWrap: 'wrap',
}));

export const HeaderLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  flexWrap: 'wrap',
}));

export const HeaderLabel = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 400,
  color: '#6b7280',
}));

export const LogicToggleContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--df-filter-logic-toggle-bg, #ffffff)',
  borderRadius: 7,
  border: '1px solid var(--df-filter-logic-toggle-border, #e5e7eb)',
  padding: 1,
}));

export const LogicToggleButton = styled('button', {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive }) => ({
  padding: '2px 10px',
  minHeight: 22,
  borderRadius: 5,
  border: 'none',
  backgroundColor: isActive
    ? 'var(--df-filter-logic-toggle-active-bg, #6366f1)'
    : 'transparent',
  color: isActive
    ? '#ffffff'
    : 'var(--df-filter-logic-toggle-inactive-color, #6b7280)',
  fontSize: 11,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'all 150ms ease',

  '&:hover': {
    backgroundColor: isActive
      ? 'var(--df-filter-logic-toggle-active-hover-bg, #4f46e5)'
      : 'var(--df-filter-logic-toggle-inactive-hover-bg, #f3f4f6)',
    color: isActive
      ? '#ffffff'
      : 'var(--df-filter-logic-toggle-inactive-hover-color, #374151)',
  },

  '&:focus-visible': {
    outline: 'none',
    boxShadow:
      '0 0 0 3px var(--df-filter-logic-toggle-focus-ring, rgba(99,102,241,0.18))',
  },

  ...(isActive
    ? {
        boxShadow:
          'var(--df-filter-logic-toggle-active-shadow, 0 2px 8px rgba(15, 23, 42, 0.08))',
      }
    : {}),
}));

export const HeaderRight = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexWrap: 'wrap',
}));

export const AddConditionButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: 'var(--df-filter-add-condition-color, #4b5563)',
  cursor: 'pointer',
  transition: 'all 150ms ease',

  '&:hover': {
    backgroundColor: 'var(--df-filter-add-condition-hover-bg, #f3f4f6)',
    color: 'var(--df-filter-add-condition-hover-color, #1f2937)',
  },

  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(148,163,184,0.2)',
  },

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const AddGroupButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: 'var(--df-filter-add-group-color, #6366f1)',
  cursor: 'pointer',
  transition: 'all 150ms ease',

  '&:hover': {
    backgroundColor: 'var(--df-filter-add-group-hover-bg, #eef2ff)',
    color: 'var(--df-filter-add-group-hover-color, #4f46e5)',
  },

  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.18)',
  },

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const EmptyStateContainer = styled(Box)(() => ({
  padding: 16,
}));

export const EmptyStateGrid = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,

  '@media (max-width: 900px)': {
    gridTemplateColumns: '1fr',
  },
}));

export const GhostCardCondition = styled('button')(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: 24,
  backgroundColor: 'transparent',
  border: '2px dashed #e5e7eb',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',

  '&:hover': {
    borderColor: '#a5b4fc',
    backgroundColor: 'rgba(238, 242, 255, 0.3)',
  },

  '&:hover .ghost-icon': {
    backgroundColor: '#e0e7ff',
  },

  '&:hover .ghost-icon svg': {
    color: '#6366f1',
  },

  '&:hover .ghost-title': {
    color: '#4f46e5',
  },
}));

export const GhostCardGroup = styled('button')(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: 24,
  backgroundColor: 'transparent',
  border: '2px dashed #e5e7eb',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',

  '&:hover': {
    borderColor: '#c4b5fd',
    backgroundColor: 'rgba(245, 243, 255, 0.3)',
  },

  '&:hover .ghost-icon': {
    backgroundColor: '#ede9fe',
  },

  '&:hover .ghost-icon svg': {
    color: '#8b5cf6',
  },

  '&:hover .ghost-title': {
    color: '#7c3aed',
  },
}));

export const GhostIconContainer = styled(Box)(() => ({
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',

  '& svg': {
    width: 20,
    height: 20,
    color: '#9ca3af',
    transition: 'color 150ms ease',
  },
}));

export const GhostCardTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 500,
  color: '#4b5563',
  transition: 'color 150ms ease',
}));

export const GhostCardSubtitle = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#9ca3af',
}));

export const EmptyStateHint = styled(Box)(() => ({
  marginTop: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
}));

export const HintIcon = styled('svg')(() => ({
  width: 14,
  height: 14,
  color: '#0288d1',
}));

export const HintText = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#0288d1',
}));
