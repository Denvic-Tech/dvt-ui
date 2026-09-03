import { Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const MenuContainer = styled('div')(() => ({
  minWidth: 200,
  maxWidth: 280,
  maxHeight: '80vh',
  overflowY: 'auto',
  borderRadius: 14,
  backgroundColor: '#ffffff',
  boxShadow:
    '0 2px 8px rgba(15, 23, 42, 0.08)',
  padding: 5,
}));

export const MenuItemWrapper = styled('div')<{ disabled?: boolean }>(
  ({ disabled }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 120ms ease',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',

    '&:hover': {
      backgroundColor: disabled ? 'transparent' : '#f5f5f5',
    },

    '&:active': {
      backgroundColor: disabled ? 'transparent' : '#eeeeee',
      transform: disabled ? 'none' : 'scale(0.98)',
    },
  })
);

export const IconWrapper = styled('div')<{
  variant?: 'default' | 'primary' | 'error';
}>(({ variant = 'default' }) => {
  const colorMap = {
    default: {
      bg: '#f3f4f6',
      hoverBg: '#dcfce7',
      color: '#6b7280',
      hoverColor: '#22c55e',
    },
    primary: {
      bg: '#dcfce7',
      hoverBg: '#bbf7d0',
      color: '#22c55e',
      hoverColor: '#16a34a',
    },
    error: {
      bg: '#fee2e2',
      hoverBg: '#fecaca',
      color: '#ef4444',
      hoverColor: '#dc2626',
    },
  };

  const colors = colorMap[variant];

  return {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 120ms ease',
    flexShrink: 0,

    '& .MuiSvgIcon-root': {
      fontSize: 15,
      color: colors.color,
      transition: 'color 120ms ease',
    },

    [`${MenuItemWrapper}:hover &`]: {
      backgroundColor: colors.hoverBg,

      '& .MuiSvgIcon-root': {
        color: colors.hoverColor,
      },
    },
  };
});

export const MenuItemLabel = styled('span')(() => ({
  flex: 1,
  fontSize: 13,
  fontWeight: 500,
  color: '#4b5563',
  transition: 'color 120ms ease',

  [`${MenuItemWrapper}:hover &`]: {
    color: '#111827',
  },
}));

export const ToggleItemContent = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
}));

export const ToggleItemText = styled('span')(() => ({
  minWidth: 0,
  fontSize: 13,
  fontWeight: 500,
  color: '#4b5563',
  transition: 'color 120ms ease',

  [`${MenuItemWrapper}:hover &`]: {
    color: '#111827',
  },
}));

export const ToggleItemSwitch = styled(Switch)(() => ({
  width: 32,
  height: 18,
  padding: 0,
  flexShrink: 0,

  '& .MuiSwitch-switchBase': {
    padding: 2,
    transitionDuration: '200ms',

    '&.Mui-checked': {
      transform: 'translateX(14px)',
      color: '#ffffff',

      '& + .MuiSwitch-track': {
        backgroundColor: '#22c55e',
        opacity: 1,
        border: 0,
      },
    },
  },

  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 14,
    height: 14,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },

  '& .MuiSwitch-track': {
    borderRadius: 9,
    backgroundColor: '#d1d5db',
    opacity: 1,
    transition: 'background-color 200ms ease',
  },
}));

export const MenuDivider = styled('div')(() => ({
  height: 1,
  backgroundColor: '#e5e7eb',
  margin: '5px 10px',
}));

export const SubmenuArrow = styled(ChevronRightIcon)(() => ({
  fontSize: 16,
  color: '#d1d5db',
  transition: 'color 120ms ease',

  [`${MenuItemWrapper}:hover &`]: {
    color: '#9ca3af',
  },
}));
