import type { SxProps, Theme } from '@mui/material/styles';

export const MONO_FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

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
  '& input': { p: 0, height: '100%' },
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

// Matches the "Новый проект" button on the home page.
export const connectButtonSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  height: 30,
  pl: 1.25,
  pr: 1.5,
  borderRadius: '8px',
  backgroundColor: '#eef2ff',
  color: '#6366f1',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background-color .14s',
  '&:hover': { backgroundColor: '#e0e7ff' },
  '&:focus-visible': { boxShadow: '0 0 0 2px #a5b4fc' },
} as const;

export const headerIconButtonSx = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  color: '#6B7385',
  '&:hover': { bgcolor: '#F1F3F8', color: '#1B1F2A' },
} as const;
