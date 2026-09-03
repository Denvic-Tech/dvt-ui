import { styled } from '@mui/material/styles';

export const FilterRoot = styled('div')(() => ({
  position: 'relative',
  display: 'inline-flex',
}));

export const FilterTrigger = styled('button', {
  shouldForwardProp: prop => prop !== 'hasActiveFilters',
})<{ hasActiveFilters?: boolean }>(({ hasActiveFilters }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 0,
  padding: '8px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 'normal',
  color: hasActiveFilters ? '#6366f1' : '#374151',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  boxShadow: 'none',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(hasActiveFilters && {
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
  }),
  '&:hover': {
    borderColor: hasActiveFilters ? '#a5b4fc' : '#d1d5db',
    backgroundColor: '#f8fafc',
  },
}));

export const FilterTriggerLabel = styled('span')(() => ({
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
}));

export const FilterBadge = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  padding: '2px 8px',
  backgroundColor: '#e0e7ff',
  color: '#6366f1',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 10,
  lineHeight: 1.2,
}));

export const TriggerSpacer = styled('span')(() => ({
  flex: 1,
}));

export const FilterDropdown = styled('div')(() => ({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 320,
  backgroundColor: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
  border: '1px solid #e2e8f0',
  overflow: 'hidden',
  zIndex: 100,
}));

export const DropdownHeader = styled('div')(() => ({
  padding: '14px 16px',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export const DropdownTitle = styled('span')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#1e293b',
}));

export const ResetButton = styled('button')(() => ({
  fontSize: 13,
  color: '#6366f1',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  transition: 'color 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    color: '#4f46e5',
  },
  '&:disabled': {
    color: '#cbd5e1',
    cursor: 'not-allowed',
  },
}));

export const FilterSections = styled('div')(() => ({
  maxHeight: 400,
  overflowY: 'auto',
}));

export const FilterSection = styled('div')(() => ({
  borderBottom: '1px solid #f1f5f9',
  '&:last-child': {
    borderBottom: 'none',
  },
}));

export const FilterSectionHeader = styled('button', {
  shouldForwardProp: prop => prop !== 'isExpanded',
})<{ isExpanded?: boolean }>(({ isExpanded }) => ({
  width: '100%',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  backgroundColor: isExpanded ? '#f8fafc' : 'transparent',
  transition: 'background-color 150ms ease',
  border: 'none',
  textAlign: 'left',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#f8fafc',
  },
}));

export const FilterSectionLabel = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}));

export const FilterSectionIcon = styled('div')(() => ({
  width: 20,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#64748b',
  flexShrink: 0,
}));

export const FilterSectionName = styled('span')(() => ({
  fontSize: 14,
  color: '#1e293b',
}));

export const FilterSectionMeta = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
}));

export const ActiveFilterBadge = styled('span')(() => ({
  padding: '2px 8px',
  backgroundColor: '#dcfce7',
  color: '#16a34a',
  fontSize: 11,
  fontWeight: 500,
  borderRadius: 6,
  maxWidth: 160,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const ChevronIcon = styled('div', {
  shouldForwardProp: prop => prop !== 'isExpanded',
})<{ isExpanded?: boolean }>(({ isExpanded }) => ({
  width: 16,
  height: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  transition: 'transform 150ms ease',
  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
  flexShrink: 0,
}));

export const FilterSectionContent = styled('div')(() => ({
  padding: '8px 16px 16px',
}));

export const SearchInput = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  backgroundColor: '#f8fafc',
  borderRadius: 8,
  marginBottom: 8,
}));

export const SearchInputField = styled('input')(() => ({
  flex: 1,
  border: 'none',
  backgroundColor: 'transparent',
  fontSize: 13,
  outline: 'none',
  color: '#1e293b',
  fontFamily: 'inherit',
  '&::placeholder': {
    color: '#94a3b8',
  },
}));

export const OptionsList = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  maxHeight: 200,
  overflowY: 'auto',
}));

export const OptionItem = styled('button', {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
  transition: 'background-color 150ms ease',
  border: 'none',
  textAlign: 'left',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: isSelected ? '#f5f3ff' : '#f8fafc',
  },
}));

export const FilterCheckbox = styled('div', {
  shouldForwardProp: prop => prop !== 'isChecked',
})<{ isChecked?: boolean }>(({ isChecked }) => ({
  width: 16,
  height: 16,
  borderRadius: 4,
  border: isChecked ? 'none' : '2px solid #d1d5db',
  backgroundColor: isChecked ? '#6366f1' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 150ms ease',
}));

export const OptionLabel = styled('span')(() => ({
  fontSize: 13,
  color: '#475569',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));
