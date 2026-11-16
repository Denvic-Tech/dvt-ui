import type { SxProps, Theme } from '@mui/material/styles';

const ACCENT = '#5B5BEF';
const FOCUS_RING = '0 0 0 3px #EEF0FF';
const FIELD_BORDER = '#DDE2EA';

const fieldFocusSx = {
  outline: 'none',
  borderColor: ACCENT,
  boxShadow: FOCUS_RING,
};

export const fieldInputSx: SxProps<Theme> = {
  width: '100%',
  height: 38,
  px: 1.5,
  border: `1px solid ${FIELD_BORDER}`,
  borderRadius: '9px',
  bgcolor: '#fff',
  color: '#1B1F2A',
  fontSize: 14,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  '&.Mui-focused': fieldFocusSx,
  '&.Mui-error': { borderColor: '#E5484D' },
  '& input': { p: 0, height: '100%' },
};

export const fieldTextareaSx: SxProps<Theme> = {
  ...fieldInputSx,
  height: 'auto',
  minHeight: 38,
  py: '8px',
  alignItems: 'flex-start',
  lineHeight: '20px',
  '& textarea': { p: 0 },
};

export const fieldTriggerSx: SxProps<Theme> = {
  width: '100%',
  height: 38,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.5,
  border: `1px solid ${FIELD_BORDER}`,
  borderRadius: '9px',
  bgcolor: '#fff',
  color: '#1B1F2A',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 400,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  '&:focus-visible, &[aria-expanded="true"]': fieldFocusSx,
};

export const fieldHintSx: SxProps<Theme> = {
  mt: 0.75,
  color: '#6B7385',
  fontSize: 12,
  lineHeight: '18px',
};

export const dialogIconButtonSx = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  color: '#6B7385',
  '&:hover': { bgcolor: '#F1F3F8', color: '#1B1F2A' },
} as const;
