import { ButtonBase, styled } from '@mui/material';

// Shared look of the settings tabs (DCC, Runtime): the form sits right on the
// panel, without a box around it.

export const SETTINGS_FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const SETTINGS_ACCENT = '#5B5BEF';

export const SettingsForm = styled('div', {
  shouldForwardProp: prop => prop !== 'spacing',
})<{ spacing: number }>(({ spacing }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing,
  maxWidth: 560,
  padding: '6px 8px 8px',
  fontFamily: SETTINGS_FONT_FAMILY,
  color: '#1B1F2A',
}));

export const SettingsFieldLabel = styled('label')({
  display: 'block',
  marginBottom: 6,
  fontSize: 12.5,
  lineHeight: '16px',
  fontWeight: 500,
  color: '#4A5161',
});

export const SettingsInputBox = styled('div', {
  shouldForwardProp: prop => prop !== 'error' && prop !== 'disabled',
})<{ error: boolean; disabled?: boolean }>(({ error, disabled = false }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 36,
  boxSizing: 'border-box',
  padding: '0 4px 0 12px',
  border: `1px solid ${error ? '#F0B4B0' : '#DDE2EA'}`,
  borderRadius: 9,
  backgroundColor: disabled ? '#FAFBFC' : '#fff',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  '&:hover': { borderColor: error ? '#F0B4B0' : '#CDD3DE' },
  '&:focus-within': {
    borderColor: error ? '#E5484D' : SETTINGS_ACCENT,
    boxShadow: `0 0 0 3px ${error ? '#FDECEC' : '#EEF0FF'}`,
  },
}));

export const SettingsInput = styled('input')({
  flex: 1,
  minWidth: 0,
  height: '100%',
  padding: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: SETTINGS_FONT_FAMILY,
  fontSize: 13.5,
  color: '#1B1F2A',
  '&::placeholder': { color: '#A3A9B6', opacity: 1 },
  '&:disabled': { color: '#9AA0AD' },
  // Number fields without the browser's spin buttons.
  '&[type=number]': { MozAppearance: 'textfield' },
  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
});

export const SettingsInputButton = styled(ButtonBase)({
  width: 28,
  height: 28,
  flex: '0 0 28px',
  borderRadius: 7,
  color: '#8C93A3',
  transition: 'background-color 150ms ease, color 150ms ease',
  '&:hover': { backgroundColor: '#F1F3F8', color: '#1B1F2A' },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 2px #A5B4FC' },
});

export const SettingsFieldError = styled('div')({
  marginTop: 6,
  fontSize: 12,
  lineHeight: '16px',
  color: '#B42318',
});

export const SettingsActions = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
});

export const SettingsSaveButton = styled(ButtonBase)({
  height: 34,
  padding: '0 16px',
  borderRadius: 9,
  backgroundColor: SETTINGS_ACCENT,
  color: '#fff',
  fontFamily: SETTINGS_FONT_FAMILY,
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'background-color 150ms ease, opacity 150ms ease',
  '&:hover': { backgroundColor: '#4343D6' },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 3px #EEF0FF' },
  // Nothing to save: a muted indigo, not grey.
  '&.Mui-disabled': {
    backgroundColor: SETTINGS_ACCENT,
    color: '#fff',
    opacity: 0.4,
  },
});

export const SettingsSavedNote = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12.5,
  color: '#6B7385',
});
