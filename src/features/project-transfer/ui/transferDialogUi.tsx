import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getTransferTokens, INTER_FONT } from './transferDialogStyles';

/** Белый спиннер 13px для основной кнопки. */
export const ButtonSpinner: React.FC = () => (
  <Box
    component='span'
    sx={{
      width: 13,
      height: 13,
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,.4)',
      borderTopColor: '#fff',
      animation: 'transferSpin .7s linear infinite',
      '@keyframes transferSpin': { to: { transform: 'rotate(360deg)' } },
    }}
  />
);

interface ToggleProps {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Переключатель 34×20 из макета. */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  label,
  disabled = false,
  onCheckedChange,
}) => (
  <Box
    component='button'
    type='button'
    role='switch'
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    sx={theme => {
      const t = getTransferTokens(theme);
      return {
        display: 'block',
        flexShrink: 0,
        width: 34,
        height: 20,
        mt: '2px',
        p: '2px',
        border: 0,
        borderRadius: '20px',
        background: checked ? t.accent : t.borderStrong,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .15s',
        '&:focus-visible': {
          outline: `2px solid ${alpha(t.accent, 0.4)}`,
          outlineOffset: 2,
        },
      };
    }}
  >
    <Box
      component='span'
      sx={{
        display: 'block',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,.18)',
        transform: checked ? 'translateX(14px)' : 'none',
        transition: 'transform .15s',
      }}
    />
  </Box>
);

export const OptionRow: React.FC<{
  title: string;
  description: React.ReactNode;
  toggle: React.ReactNode;
  dimmed?: boolean;
}> = ({ title, description, toggle, dimmed = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
    <Box sx={{ flex: 1, minWidth: 0, opacity: dimmed ? 0.55 : 1 }}>
      <Box
        sx={theme => ({
          fontFamily: INTER_FONT,
          fontSize: 13.5,
          fontWeight: 500,
          lineHeight: 1.4,
          color: getTransferTokens(theme).text,
        })}
      >
        {title}
      </Box>
      <Box
        sx={theme => ({
          mt: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: INTER_FONT,
          fontSize: 12,
          lineHeight: 1.4,
          color: getTransferTokens(theme).text3,
        })}
      >
        {description}
      </Box>
    </Box>
    {toggle}
  </Box>
);

interface OptionItemProps {
  title: string;
  description: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
  /** Приглушить текст (опция недоступна пользователю) */
  dimmed?: boolean;
  /** Вложенный блок без отступа и вертикальной линии слева */
  flat?: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: React.ReactNode;
}

export const OptionItem: React.FC<OptionItemProps> = ({
  title,
  description,
  checked,
  disabled = false,
  dimmed = false,
  flat = false,
  onCheckedChange,
  children,
}) => (
  <Box sx={{ p: '10px 12px' }}>
    <OptionRow
      title={title}
      description={description}
      dimmed={dimmed}
      toggle={
        <Toggle
          checked={checked}
          label={title}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
        />
      }
    />
    {checked && children ? (
      <Box
        sx={
          flat
            ? {}
            : theme => ({
                mt: '10px',
                ml: '2px',
                pl: '14px',
                borderLeft: `2px solid ${getTransferTokens(theme).border}`,
              })
        }
      >
        {children}
      </Box>
    ) : null}
  </Box>
);
