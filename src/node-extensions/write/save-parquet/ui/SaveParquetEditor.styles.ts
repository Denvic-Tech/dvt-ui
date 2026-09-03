import {
  FormControlLabel,
  ListSubheader,
  MenuItem,
  Switch,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { CODE_FONT_FAMILY } from '@/shared/ui/node-input/HighlightedSingleLineField.shared';

import type { Tone } from './SaveParquetEditor.helpers';

const resolveDtypePalette = (dtype: string) => {
  const normalized = dtype.trim().toUpperCase();

  if (normalized.includes('TIMESTAMP')) {
    return { bg: '#fce7f3', color: '#be185d' };
  }
  if (
    normalized.includes('DATE') ||
    normalized.includes('TIME') ||
    normalized.includes('DURATION')
  ) {
    return { bg: '#ecfeff', color: '#0f766e' };
  }
  if (normalized.includes('BOOL')) {
    return { bg: '#fef3c7', color: '#b45309' };
  }
  if (normalized.includes('INT') || normalized.includes('UINT')) {
    return { bg: '#d1fae5', color: '#047857' };
  }
  if (
    normalized.includes('FLOAT') ||
    normalized.includes('DOUBLE') ||
    normalized.includes('DECIMAL')
  ) {
    return { bg: '#f3e8ff', color: '#8b5cf6' };
  }
  if (
    normalized.includes('STRING') ||
    normalized.includes('STR') ||
    normalized.includes('TEXT') ||
    normalized.includes('CHAR') ||
    normalized.includes('OBJECT')
  ) {
    return { bg: '#eef2ff', color: '#4f46e5' };
  }
  if (normalized.includes('BINARY') || normalized.includes('BYTE')) {
    return { bg: '#ede9fe', color: '#6d28d9' };
  }

  return { bg: '#f1f5f9', color: '#475569' };
};

export const EditorCard = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  paddingInline: 8,
});

export const ThreeColumns = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
  '@media (max-width: 980px)': {
    gridTemplateColumns: '1fr 1fr',
  },
  '@media (max-width: 720px)': {
    gridTemplateColumns: '1fr',
  },
});

export const FieldLabel = styled('div')(({ theme }) => ({
  fontSize: 13,
  fontWeight: 600,
  color: theme.palette.grey[900],
  marginBottom: 6,
}));

export const ExpressionFieldHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  minHeight: 24,
  marginBottom: 6,
});

export const ExpressionFieldLabel = styled(FieldLabel)({
  minWidth: 0,
  marginBottom: 0,
});

export const ExpressionModeButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
  padding: '3px 7px',
  border: 'none',
  borderRadius: 6,
  background: active ? '#eef2ff' : 'transparent',
  color: active ? '#4f46e5' : '#94a3b8',
  fontSize: 10.5,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 150ms ease, color 150ms ease',
  '&:hover': {
    background: '#eef2ff',
    color: '#4f46e5',
  },
  '&:focus-visible': {
    outline: '2px solid #c7d2fe',
    outlineOffset: 1,
  },
}));

export const TextInputBox = styled('input', {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ hasError = false, theme }) => ({
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 42,
  padding: '10px 12px',
  borderRadius: 10,
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 13,
  color: '#1e293b',
  background: '#f8fafc',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  outline: 'none',
  transition: 'all 150ms ease',
  '&:focus': {
    borderColor: hasError ? '#ef4444' : '#c7d2fe',
    boxShadow: hasError
      ? '0 0 0 3px rgba(239,68,68,0.12)'
      : '0 0 0 3px rgba(199,210,254,0.45)',
  },
  '&::placeholder': {
    color: theme.palette.grey[500],
    opacity: 1,
  },
}));

export const FieldHintBottom = styled('div', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: Tone }>(({ theme, tone }) => ({
  fontSize: 11.5,
  color: tone === 'error' ? '#ef4444' : theme.palette.grey[500],
  marginTop: 6,
  lineHeight: 1.45,
}));

export const PartitionCard = styled('div')({
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
});

export const SoftDivider = styled('div')({
  height: 1,
  background: '#eef2f7',
});

export const ToggleOption = styled(FormControlLabel)(({ theme }) => ({
  margin: 0,
  minWidth: 0,
  width: '100%',
  gap: 10,
  alignItems: 'center',
  '.MuiFormControlLabel-label': {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[900],
    lineHeight: 1.4,
  },
}));

export const StyledSwitch = styled(Switch)({
  width: 34,
  height: 20,
  padding: 0,
  display: 'flex',
  '& .MuiSwitch-switchBase': {
    padding: 2,
    transitionDuration: '150ms',
    '&.Mui-checked': {
      transform: 'translateX(14px)',
      color: '#ffffff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#6366f1',
        opacity: 1,
        borderColor: '#6366f1',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 16,
    height: 16,
    boxShadow: 'none',
  },
  '& .MuiSwitch-track': {
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    opacity: 1,
    border: '1px solid #e2e8f0',
    transition: 'all 150ms ease',
  },
});

export const SchemaCard = styled('div', {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ hasError = false }) => ({
  background: '#ffffff',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 14,
  padding: 18,
  minHeight: 440,
}));

export const SchemaHeader = styled('div')({
  marginBottom: 14,
});

export const SchemaTitleRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
});

export const SchemaTitle = styled('span')(({ theme }) => ({
  fontSize: 14,
  fontWeight: 700,
  color: theme.palette.grey[900],
}));

export const SchemaCountBadge = styled('span')({
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: 0.3,
  padding: '2px 7px',
  borderRadius: 5,
  background: '#eef2ff',
  color: '#4f46e5',
});

export const SchemaSubtitle = styled('div')({
  fontSize: 12,
  color: '#64748b',
  marginTop: 3,
});

export const SchemaToolbar = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 10,
  '@media (max-width: 860px)': {
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
});

export const SearchBox = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 11px',
  background: '#f8fafc',
  borderRadius: 9,
  border: '1px solid #e2e8f0',
  transition: 'all 150ms ease',
  '&:focus-within': {
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(199,210,254,0.45)',
  },
});

export const SearchInput = styled('input')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 12.5,
  color: '#1e293b',
  '&::placeholder': {
    color: theme.palette.grey[500],
    opacity: 1,
  },
}));

export const TabsGroup = styled('div')({
  display: 'flex',
  gap: 2,
  padding: 3,
  borderRadius: 9,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  flexShrink: 0,
  '@media (max-width: 860px)': {
    width: '100%',
    flexWrap: 'wrap',
  },
});

export const TabButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 11px',
  border: 'none',
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  background: active ? '#ffffff' : 'transparent',
  color: active ? '#4f46e5' : '#64748b',
  boxShadow: active ? '0 1px 3px rgba(15,23,42,0.06)' : 'none',
  transition: 'all 150ms ease',
}));

export const TabCount = styled('span', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 18,
  fontSize: 10.5,
  fontWeight: 700,
  padding: '0 6px',
  borderRadius: 999,
  background: active ? '#eef2ff' : '#e2e8f0',
  color: active ? '#4f46e5' : '#64748b',
}));

export const BulkRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
  flexWrap: 'wrap',
});

const bulkButtonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 11px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
} as const;

export const PrimaryBulkButton = styled('button')({
  ...bulkButtonBase,
  border: 'none',
  background: '#eef2ff',
  color: '#4f46e5',
  '&:hover:not(:disabled)': {
    background: '#c7d2fe',
  },
});

export const SecondaryBulkButton = styled('button')({
  ...bulkButtonBase,
  background: 'transparent',
  color: '#64748b',
  border: '1px solid #e2e8f0',
  '&:hover:not(:disabled)': {
    background: '#f8fafc',
  },
});

export const SchemaTable = styled('div')({
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  overflow: 'hidden',
});

export const SchemaTableHead = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 110px minmax(0, 1fr)',
  gap: 16,
  padding: '9px 14px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  fontSize: 10.5,
  fontWeight: 700,
  color: '#94a3b8',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  '@media (max-width: 720px)': {
    display: 'none',
  },
});

export const SchemaTableBody = styled('div')({
  minHeight: 240,
  maxHeight: 360,
  overflowY: 'auto',
});

export const SchemaRow = styled('div', {
  shouldForwardProp: prop => prop !== 'configured' && prop !== 'last',
})<{ configured: boolean; last: boolean }>(({ configured, last }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 110px minmax(0, 1fr)',
  gap: 16,
  padding: '9px 14px',
  alignItems: 'center',
  borderBottom: last ? 'none' : '1px solid #eef2f7',
  background: configured ? '#fbfaff' : 'transparent',
  '@media (max-width: 720px)': {
    gridTemplateColumns: '1fr',
    gap: 10,
  },
}));

export const SchemaCell = styled('div')({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const MobileCellLabel = styled('div')({
  display: 'none',
  '@media (max-width: 720px)': {
    display: 'block',
    fontSize: 10.5,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

export const ColumnName = styled('div')({
  fontSize: 13,
  color: '#1e293b',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const DtypeBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'dtype',
})<{ dtype: string }>(({ dtype }) => {
  const palette = resolveDtypePalette(dtype);

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    padding: '2px 9px',
    borderRadius: 6,
    background: palette.bg,
    color: palette.color,
    fontFamily: CODE_FONT_FAMILY,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
  };
});

export const SelectFieldWrap = styled('div')({
  position: 'relative',
  minWidth: 0,
});

export const SelectTrigger = styled('button', {
  shouldForwardProp: prop => prop !== 'open' && prop !== 'hasError',
})<{ open: boolean; hasError?: boolean }>(({ open, hasError = false }) => ({
  width: '100%',
  minHeight: 34,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 13,
  color: '#1e293b',
  background: '#f8fafc',
  border: `1px solid ${hasError ? '#ef4444' : open ? '#c7d2fe' : '#e2e8f0'}`,
  textAlign: 'left',
  transition: 'all 150ms ease',
  boxShadow: open && !hasError ? '0 0 0 3px rgba(199,210,254,0.45)' : 'none',
}));

export const SelectValueText = styled('span')({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const SelectGroupLabel = styled(ListSubheader)({
  padding: '8px 12px 4px',
  fontSize: 10.5,
  fontWeight: 700,
  color: '#94a3b8',
  letterSpacing: 0.6,
  background: '#f8fafc',
  textTransform: 'uppercase',
  lineHeight: 1.2,
});

export const SelectOption = styled(MenuItem, {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  width: '100%',
  minHeight: 32,
  padding: '6px 12px',
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 13,
  background: active ? '#eef2ff' : '#ffffff',
  color: active ? '#4f46e5' : '#1e293b',
  fontWeight: active ? 600 : 500,
  transition: 'background 150ms ease',
  '&:hover': {
    background: active ? '#eef2ff' : '#f8fafc',
  },
}));

export const SelectOptionText = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const RowErrorText = styled('div')({
  fontSize: 11,
  color: '#ef4444',
  lineHeight: 1.4,
});

export const EmptyState = styled('div')({
  padding: '18px 14px',
  fontSize: 12.5,
  color: '#64748b',
  textAlign: 'center',
});

export const getAutocompleteTextFieldSx = (theme: any, hasError = false) => ({
  '& .MuiOutlinedInput-root': {
    minHeight: 42,
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    transition: 'all 150ms ease',
    alignItems: 'center',
    cursor: 'pointer',
    '& fieldset': {
      borderColor: hasError ? '#ef4444' : '#e2e8f0',
    },
    '&:hover fieldset': {
      borderColor: hasError ? '#ef4444' : '#cbd5e1',
    },
    '&.Mui-focused fieldset': {
      borderColor: hasError ? '#ef4444' : '#c7d2fe',
    },
    '&.Mui-focused': {
      boxShadow: hasError
        ? '0 0 0 3px rgba(239,68,68,0.12)'
        : '0 0 0 3px rgba(199,210,254,0.45)',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: CODE_FONT_FAMILY,
    fontSize: 13,
    fontWeight: 500,
    color: '#1e293b',
    paddingTop: '0 !important',
    paddingBottom: '0 !important',
    cursor: 'pointer',
    userSelect: 'none',
    caretColor: 'transparent',
  },
  '& .MuiInputBase-input::placeholder': {
    color: theme.palette.grey[500],
    opacity: 1,
  },
  '& .MuiChip-root': {
    height: 24,
    borderRadius: 6,
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    fontFamily: CODE_FONT_FAMILY,
    '.MuiChip-label': {
      fontSize: 11.5,
      fontWeight: 600,
    },
  },
  '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
    color: '#94a3b8',
    cursor: 'pointer',
  },
  '& .MuiAutocomplete-endAdornment': {
    cursor: 'pointer',
  },
});

export const autocompleteListboxSx = {
  padding: 0.5,
  '& .MuiAutocomplete-option': {
    minHeight: 34,
    borderRadius: '8px',
    fontFamily: CODE_FONT_FAMILY,
    fontSize: 13,
    color: '#1e293b',
    cursor: 'pointer',
    '&[aria-selected="true"]': {
      backgroundColor: '#eef2ff',
      color: '#4f46e5',
    },
    '&.Mui-focused': {
      backgroundColor: '#f8fafc',
    },
    '&[aria-selected="true"].Mui-focused': {
      backgroundColor: '#eef2ff',
    },
  },
} as const;

export const autocompletePaperSx = {
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  boxShadow: '0 10px 28px rgba(15,23,42,0.12)',
} as const;
