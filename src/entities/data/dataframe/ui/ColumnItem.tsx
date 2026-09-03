import React, { memo } from 'react';
import {
  Box,
  ButtonBase,
  Chip,
  ChipPropsColorOverrides,
  Stack,
  Typography,
} from '@mui/material';
import { Key as KeyIcon } from '@mui/icons-material';

import { Column } from '@/shared/gatewayClient';
import { getIconForDataType } from '@/shared/icons.ts';

interface ColumnItemProps {
  column: Column;
  onClick?: ((columnName: string) => void) | null;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  // Доп. слоты (например, счетчики, меню)
  midAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  // Полиморфность корня (по умолчанию div)
  component?: React.ElementType;
  typeColor?:
    | 'primary'
    | 'default'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
}

export const ColumnItem: React.FC<ColumnItemProps> = memo(
  ({
    column,
    onClick = null,
    selected = false,
    disabled = false,
    className,
    midAdornment,
    endAdornment,
    component = 'div',
    typeColor = 'primary',
  }) => {
    const IconComponent = getIconForDataType(column.dtype);
    const isClickable = typeof onClick === 'function' && !disabled;

    const commonSx = {
      // Общие отступы и скругления
      px: 1.5,
      py: 1,
      borderRadius: 1.5,
      width: '100%',
      cursor: isClickable ? 'pointer' : 'default',
      // Цвета под тему
      bgcolor: selected ? 'action.selected' : 'transparent',
      '&:hover': isClickable ? { bgcolor: 'action.hover' } : undefined,
      // Для клавиатуры/фокуса
      outline: 0,
    } as const;

    const content = (
      <Stack
        direction='row'
        alignItems='center'
        spacing={1.25}
        sx={{ width: '100%' }}
      >
        {/* Иконка типа данных */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 32,
          }}
        >
          <IconComponent title={column.dtype} style={{ fontSize: '1.2rem' }} />
        </Box>

        {/* Название колонки */}
        <Typography
          variant='body2'
          sx={{ flex: 1, minWidth: 0 }}
          noWrap
          title={column.name}
        >
          {column.name}
        </Typography>

        {midAdornment}

        {/* Метка «Индекс» */}
        {column.index && (
          <Chip
            icon={<KeyIcon fontSize='small' />}
            label='Index'
            size='small'
            color='primary'
            variant='outlined'
            sx={{ mr: 0.5 }}
          />
        )}

        {/* Тип колонки */}
        <Chip
          label={column.dtype}
          size='small'
          variant='outlined'
          color={typeColor}
          sx={{ mr: endAdornment ? 0.5 : 0 }}
        />

        {/* Правый слот */}
        {endAdornment}
      </Stack>
    );

    if (isClickable) {
      return (
        <ButtonBase
          component={component as any}
          className={className ?? ''}
          disabled={disabled}
          onClick={() => onClick!(column.name)}
          sx={commonSx}
          focusRipple
        >
          {content}
        </ButtonBase>
      );
    }

    return (
      <Box
        component={component}
        className={className}
        sx={commonSx}
        aria-disabled={disabled || undefined}
      >
        {content}
      </Box>
    );
  }
);

ColumnItem.displayName = 'ColumnItem';
