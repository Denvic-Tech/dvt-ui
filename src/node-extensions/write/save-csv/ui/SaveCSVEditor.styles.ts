import { FormControlLabel, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';

export const EditorCard = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  paddingInline: 8,
});

export const TogglesCard = styled('div')(({ theme }) => ({
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
}));

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
