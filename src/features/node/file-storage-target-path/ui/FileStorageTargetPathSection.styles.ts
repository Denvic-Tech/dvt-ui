import { styled } from '@mui/material/styles';

import { CODE_FONT_FAMILY } from '@/shared/ui/node-input/HighlightedSingleLineField.shared';

import type { Tone } from './FileStorageTargetPathSection.helpers';

export const SectionRoot = styled('div')({
  minWidth: 0,
});

export const SectionHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
  flexWrap: 'wrap',
});

export const TitleGroup = styled('div')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
});

export const SectionTitle = styled('span')(({ theme }) => ({
  fontSize: 13,
  fontWeight: 700,
  color: theme.palette.grey[900],
}));

export const SectionDescription = styled('div')(({ theme }) => ({
  marginTop: -2,
  marginBottom: 8,
  fontSize: 11.5,
  lineHeight: 1.45,
  color: theme.palette.grey[500],
}));

export const SectionBadge = styled('span')({
  fontSize: 10.5,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: 0.3,
  padding: '0 7px',
  borderRadius: 5,
  background: '#eef2ff',
  color: '#4f46e5',
});

export const HeaderSpacer = styled('div')({
  flex: 1,
});

export const ModeToggleGroup = styled('div')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  marginBottom: 10,
  flexWrap: 'wrap',
  width: '100%',
  padding: 4,
  borderRadius: 12,
  background: '#f1f3f7',
  boxSizing: 'border-box',
});

export const ModeToggleButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active, theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 28,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid transparent',
  background: active ? '#ffffff' : 'transparent',
  color: active ? theme.palette.grey[900] : theme.palette.grey[600],
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  lineHeight: 1,
  cursor: 'pointer',
  transition:
    'border-color 150ms ease, background-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
  boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
  '&:hover': {
    background: active ? '#ffffff' : 'transparent',
    color: active ? theme.palette.grey[900] : theme.palette.grey[600],
    boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: active
      ? '0 1px 2px rgba(15,23,42,0.08), 0 0 0 3px rgba(99,102,241,0.12)'
      : '0 0 0 3px rgba(99,102,241,0.12)',
  },
  '&:disabled': {
    cursor: 'not-allowed',
    pointerEvents: 'none',
    opacity: 0.45,
    color: theme.palette.grey[400],
    boxShadow: 'none',
  },
}));

export const ExpressionToggleButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'color 150ms ease, opacity 150ms ease',
  background: 'transparent',
  border: 'none',
  color: active ? '#4f46e5' : '#94a3b8',
  '&:focus-visible': {
    outline: 'none',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}));

export const PathFieldRow = styled('div', {
  shouldForwardProp: prop => prop !== 'expr' && prop !== 'hasError',
})<{ expr: boolean; hasError: boolean }>(({ expr, hasError }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 6px 6px 14px',
  borderRadius: 12,
  background: '#ffffff',
  border: `1px solid ${
    hasError ? '#ef4444' : expr ? 'rgba(139,92,246,0.33)' : '#e2e8f0'
  }`,
  transition: 'all 150ms ease',
  minWidth: 0,
  '&:focus-within': {
    borderColor: hasError ? '#ef4444' : expr ? '#4f46e5' : '#6366f1',
    boxShadow: `0 0 0 3px ${
      hasError
        ? 'rgba(239,68,68,0.12)'
        : expr
          ? 'rgba(79,70,229,0.12)'
          : 'rgba(99,102,241,0.12)'
    }`,
  },
}));

export const IconBox = styled('span')({
  width: 16,
  height: 16,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const PathInput = styled('input', {
  shouldForwardProp: prop => prop !== 'expr',
})<{ expr: boolean }>(({ expr, theme }) => ({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: '6px 0',
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 13.5,
  fontWeight: 600,
  color: expr ? '#4f46e5' : '#1e293b',
  '&::placeholder': {
    color: theme.palette.grey[500],
    opacity: 1,
  },
}));

export const ExpressionInputShell = styled('div')({
  flex: 1,
  minWidth: 0,
  '& > .MuiFormControl-root': {
    width: '100%',
    margin: 0,
  },
  '& .MuiFormHelperText-root': {
    display: 'none',
  },
  '& > .MuiFormControl-root > .MuiBox-root': {
    minWidth: 0,
    minHeight: '0 !important',
    height: 'auto !important',
    border: 'none',
    borderRadius: 0,
    backgroundColor: 'transparent',
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'transparent',
    },
  },
  '& > .MuiFormControl-root > .MuiBox-root > .MuiBox-root': {
    minHeight: '0 !important',
    padding: '6px 0 !important',
  },
  '& .dvt-inline-monaco, & .dvt-inline-monaco > div': {
    minHeight: 20,
  },
  '& .dvt-inline-monaco .monaco-editor, & .dvt-inline-monaco .monaco-editor .overflow-guard':
    {
      minHeight: '20px !important',
      height: '20px !important',
    },
  '& .dvt-inline-monaco .monaco-editor .view-lines, & .dvt-inline-monaco .view-line':
    {
      color: '#4f46e5',
    },
  '& .dvt-inline-monaco .view-line': {
    fontWeight: 600,
  },
});

export const BrowseButton = styled('button')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 8px',
  borderRadius: 8,
  border: 'none',
  background: '#e8e8f8',
  color: '#6366f1',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
  marginRight: 4,
  transition: 'all 150ms ease',
  '&:hover': {
    background: '#dcdcf2',
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
});

export const FieldHint = styled('div', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: Tone }>(({ theme, tone }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  marginTop: 7,
  fontSize: 11.5,
  color:
    tone === 'error'
      ? '#ef4444'
      : tone === 'warning'
        ? '#d97706'
        : theme.palette.grey[500],
}));

export const FooterText = styled('div')(({ theme }) => ({
  marginTop: 6,
  fontSize: 11.5,
  color: theme.palette.grey[500],
}));
