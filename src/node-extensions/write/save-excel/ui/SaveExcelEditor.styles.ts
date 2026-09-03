import { FormControlLabel, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';

import { CODE_FONT_FAMILY } from '@/shared/ui/node-input/HighlightedSingleLineField.shared';

import type { Tone } from './SaveExcelEditor.helpers';

export const EditorCard = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  paddingInline: 8,
});

export const FieldLabel = styled('div')(({ theme }) => ({
  fontSize: 12,
  fontWeight: 700,
  color: theme.palette.grey[900],
  marginBottom: 6,
}));

export const TextInputBox = styled('input', {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ hasError = false, theme }) => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 10,
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 13.5,
  color: '#1e293b',
  background: '#ffffff',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  outline: 'none',
  transition: 'all 150ms ease',
  '&:focus': {
    borderColor: hasError ? '#ef4444' : '#6366f1',
    boxShadow: `0 0 0 3px ${
      hasError ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)'
    }`,
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
}));

export const TogglesCard = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  alignItems: 'center',
  columnGap: 20,
  rowGap: 12,
  padding: '12px 16px',
  borderRadius: 12,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  '@media (max-width: 760px)': {
    gridTemplateColumns: '1fr',
  },
});

export const ToggleOption = styled(FormControlLabel)({
  margin: 0,
  minWidth: 0,
  width: '100%',
  gap: 10,
  '.MuiFormControlLabel-label': {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    whiteSpace: 'nowrap',
  },
});

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
