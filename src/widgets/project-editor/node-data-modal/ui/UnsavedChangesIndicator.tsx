import { styled } from '@mui/material/styles';

const IndicatorRoot = styled('span')({
  minWidth: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12.5,
  lineHeight: 1.4,
  color: '#6B7385',
  whiteSpace: 'nowrap',
});

const IndicatorDot = styled('span')({
  width: 6,
  height: 6,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: '#F5A524',
});

export const UnsavedChangesIndicator = () => (
  <IndicatorRoot role='status'>
    <IndicatorDot aria-hidden='true' />
    Есть несохранённые изменения
  </IndicatorRoot>
);
