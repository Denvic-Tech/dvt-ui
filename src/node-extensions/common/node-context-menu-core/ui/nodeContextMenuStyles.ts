import { Switch } from '@mui/material';
import { styled } from '@mui/material/styles';

export const MenuItemWrapper = styled('div')<{ disabled?: boolean }>(
  ({ disabled }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    opacity: disabled ? 0.5 : 1,

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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
    flexShrink: 0,

    '& .MuiSvgIcon-root': {
      fontSize: 18,
      color: colors.color,
      transition: 'color 150ms ease',
    },

    [`${MenuItemWrapper}:hover &`]: {
      backgroundColor: colors.hoverBg,

      '& .MuiSvgIcon-root': {
        color: colors.hoverColor,
      },
    },
  };
});

export const ItemToggleRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  gap: 12,
}));

// Иконка — точно такие же размеры как IconWrapper (32x32, borderRadius 10)
export const ItemIconWrapper = styled('div')<{ checked?: boolean }>(
  ({ checked }) => ({
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: checked ? '#e0e7ff' : '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
    flexShrink: 0,

    '& .MuiSvgIcon-root': {
      fontSize: 18,
      color: checked ? '#6366f1' : '#6b7280',
      transition: 'color 150ms ease',
    },
  })
);

// Контейнер для текста и switch — занимает оставшееся место
export const ItemToggleContent = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flex: 1,
  minWidth: 0,
  gap: 8,
}));

// Текст — как MenuItemLabel
export const ItemToggleText = styled('span')(() => ({}));

// Toggle switch — КОМПАКТНЫЙ размер
export const ItemToggleSwitch = styled(Switch)(() => ({
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
        backgroundColor: '#6366f1',
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
