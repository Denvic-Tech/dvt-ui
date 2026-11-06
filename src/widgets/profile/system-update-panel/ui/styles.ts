import { ButtonBase, InputBase, styled } from '@mui/material';

import { ErrorNotice } from '@/shared/ui/error-notice';

const FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const ACCENT = '#5B5BEF';

export const UpdateContent = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxWidth: 640,
  fontFamily: FONT_FAMILY,
  color: '#1B1F2A',
});

// Directly on the panel, like the DCC and Runtime forms.
export const UpdateSection = styled('section')({
  padding: '6px 8px 8px',
});

export const UpdateTitle = styled('h3')({
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '20px',
});

export const UpdateVersion = styled('div')({
  marginTop: 4,
  fontSize: 13,
  lineHeight: '18px',
  color: '#6B7385',
  '& b': {
    fontWeight: 500,
    color: '#1B1F2A',
    fontVariantNumeric: 'tabular-nums',
  },
});

export const FieldLabel = styled('label')({
  display: 'block',
  marginTop: 14,
  fontSize: 12.5,
  fontWeight: 500,
  color: '#4A5161',
});

export const FieldRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 6,
});

export const TagInput = styled(InputBase)({
  width: 320,
  maxWidth: '100%',
  height: 36,
  boxSizing: 'border-box',
  padding: '0 12px',
  border: '1px solid #DDE2EA',
  borderRadius: 9,
  backgroundColor: '#fff',
  fontFamily: FONT_FAMILY,
  fontSize: 13.5,
  color: '#1B1F2A',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  '&.Mui-focused': {
    borderColor: ACCENT,
    boxShadow: '0 0 0 3px #EEF0FF',
  },
  '&.Mui-error': { borderColor: '#F0B4B0' },
  '&.Mui-error.Mui-focused': { boxShadow: '0 0 0 3px #FDECEC' },
  '&.Mui-disabled': { backgroundColor: '#FAFBFC' },
  '& .MuiInputBase-input': { padding: 0 },
  '& .MuiInputBase-input.Mui-disabled': {
    color: '#9AA0AD',
    WebkitTextFillColor: '#9AA0AD',
  },
});

export const UpdateButton = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'busy',
})<{ busy: boolean }>(({ busy }) => ({
  flexShrink: 0,
  gap: 8,
  height: 36,
  padding: '0 14px',
  borderRadius: 8,
  backgroundColor: busy ? '#8C8EF4' : ACCENT,
  color: '#fff',
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'background-color 150ms ease',
  '&:hover': { backgroundColor: busy ? '#8C8EF4' : '#4343D6' },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 3px #EEF0FF' },
  '&.Mui-disabled': busy
    ? { color: '#fff' }
    : { backgroundColor: '#E9ECF2', color: '#A3A9B6' },
}));

export const FieldHint = styled('div', {
  shouldForwardProp: prop => prop !== 'error',
})<{ error: boolean }>(({ error }) => ({
  marginTop: 8,
  fontSize: 12.5,
  lineHeight: '18px',
  color: error ? '#B42318' : '#9AA0AD',
}));

export const StartErrorNotice = styled(ErrorNotice)({
  marginTop: 14,
});
