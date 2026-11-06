import { ButtonBase, styled } from '@mui/material';

import { SETTINGS_ACCENT } from '../settings-form/styles';

export const RuntimeSectionTitle = styled('div')({
  fontSize: 13.5,
  lineHeight: '18px',
  fontWeight: 500,
});

export const RuntimeSectionDescription = styled('div')({
  marginTop: 2,
  fontSize: 12.5,
  lineHeight: '18px',
  color: '#9AA0AD',
});

export const RuntimeSectionControl = styled('div')({
  marginTop: 12,
});

// One line between the sections; the form gap is on both sides of it.
export const RuntimeSectionDivider = styled('div')({
  height: 1,
  margin: '-4px 0',
  backgroundColor: '#EEF0F4',
});

export const RuntimeRadioList = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

// Marks the radio circle, so the option can restyle it on hover and focus.
export const RUNTIME_RADIO_MARK_CLASS = 'runtime-radio-mark';

export const RuntimeRadioMark = styled('span', {
  shouldForwardProp: prop => prop !== 'checked',
})<{ checked: boolean }>(({ checked }) => ({
  width: 16,
  height: 16,
  flex: '0 0 16px',
  boxSizing: 'border-box',
  marginTop: 1,
  borderRadius: '50%',
  border: checked ? `5px solid ${SETTINGS_ACCENT}` : '1.5px solid #C3C9D4',
  backgroundColor: '#fff',
  transition: 'border 120ms ease',
}));

export const RuntimeRadioOption = styled(ButtonBase)({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  gap: 12,
  padding: '8px 0',
  borderRadius: 6,
  fontFamily: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  [`&:hover .${RUNTIME_RADIO_MARK_CLASS}[data-checked="false"]`]: {
    borderColor: '#8C93A3',
  },
  [`&.Mui-focusVisible .${RUNTIME_RADIO_MARK_CLASS}`]: {
    boxShadow: '0 0 0 3px #EEF0FF',
  },
  '&.Mui-disabled': { opacity: 0.6 },
});

export const RuntimeRadioText = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
});

export const RuntimeRadioName = styled('span')({
  fontSize: 13.5,
  lineHeight: '18px',
  fontWeight: 500,
});

export const RuntimeRadioDescription = styled('span')({
  fontSize: 12.5,
  lineHeight: '18px',
  color: '#6B7385',
});

// Threshold fields of the selected mode, aligned with the option's text.
export const RuntimeThreshold = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  margin: '10px 0 4px 28px',
});

export const RuntimeThresholdRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const RuntimeThresholdInputBoxSx = {
  width: 140,
  paddingRight: '12px',
} as const;

export const RuntimeThresholdUnit = styled('span')({
  flexShrink: 0,
  fontSize: 13,
  color: '#9AA0AD',
});

export const RuntimeThresholdHint = styled('div', {
  shouldForwardProp: prop => prop !== 'error',
})<{ error: boolean }>(({ error }) => ({
  fontSize: 12.5,
  lineHeight: '18px',
  color: error ? '#B42318' : '#9AA0AD',
}));

export const RuntimeUnitSegments = styled('div')({
  display: 'inline-grid',
  gridTemplateColumns: 'repeat(2, 44px)',
  height: 36,
  boxSizing: 'border-box',
  padding: 3,
  borderRadius: 9,
  backgroundColor: '#F5F6FA',
});

export const RuntimeUnitSegment = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected: boolean }>(({ selected }) => ({
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: selected ? 600 : 500,
  color: selected ? '#1B1F2A' : '#6B7385',
  backgroundColor: selected ? '#fff' : 'transparent',
  boxShadow: selected
    ? '0 1px 2px rgba(20, 24, 40, 0.06), inset 0 0 0 1px rgba(20, 24, 40, 0.06)'
    : 'none',
  transition: 'color 120ms ease',
  '&:hover': { color: '#1B1F2A' },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 2px #A5B4FC' },
}));
