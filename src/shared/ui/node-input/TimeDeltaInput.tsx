import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

interface TimeDeltaInputProps {
  value: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

const FIELD_LABELS = ['Годы', 'Месяцы', 'Дни', 'Часы', 'Минуты', 'Секунды'];

export const TimeDeltaInput: React.FC<TimeDeltaInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const fieldInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const currentSign = value.startsWith('-') ? '-' : '+';
  const numericPart =
    value.startsWith('+') || value.startsWith('-') ? value.substring(1) : value;

  const initialValues = numericPart
    ? numericPart.split('-').map(part => part || '0')
    : ['0', '0', '0', '0', '0', '0'];

  const [sign, setSign] = useState<'+' | '-'>(currentSign as '+' | '-');
  const [values, setValues] = useState<string[]>(initialValues);

  useEffect(() => {
    const newSign = value.startsWith('-') ? '-' : '+';
    const newNumericPart =
      value.startsWith('+') || value.startsWith('-')
        ? value.substring(1)
        : value;

    const parts = newNumericPart.split('-');
    while (parts.length < 6) {
      parts.push('0');
    }

    setSign(newSign as '+' | '-');
    setValues(parts.slice(0, 6).map(part => part || '0'));
  }, [value]);

  const updateDuration = (nextSign: '+' | '-', nextValues: string[]) => {
    onChange(`${nextSign}${nextValues.join('-')}`);
  };

  const handleSignChange = (nextSign: '+' | '-') => {
    setSign(nextSign);
    updateDuration(nextSign, values);
  };

  const handleFieldChange = (index: number, nextValue: string) => {
    let numericValue = nextValue.replace(/[^0-9]/g, '');

    if (numericValue.length > 1 && numericValue.startsWith('0')) {
      numericValue = numericValue.replace(/^0+/, '');
    }
    if (numericValue === '') {
      numericValue = '0';
    }

    const nextValues = [...values];
    nextValues[index] = numericValue;

    setValues(nextValues);
    updateDuration(sign, nextValues);
  };

  const handleFieldKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key !== 'Enter' || index >= FIELD_LABELS.length - 1) {
      return;
    }

    event.preventDefault();
    const nextInput = fieldInputRefs.current[index + 1];
    nextInput?.focus();
    nextInput?.select();
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', pb: 0.25 }}>
      <Box sx={{ width: '100%', minWidth: 540 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1,
            mb: 1.25,
          }}
        >
          {(['+', '-'] as const).map(option => {
            const selected = sign === option;
            const label = option === '+' ? 'Прибавить' : 'Вычесть';
            const isSubtract = option === '-';

            return (
              <Button
                key={option}
                type='button'
                variant='outlined'
                disabled={disabled}
                disableRipple
                aria-pressed={selected}
                onClick={() => handleSignChange(option)}
                sx={theme => {
                  const accentColor = isSubtract
                    ? theme.palette.error.main
                    : theme.palette.primary.main;
                  const idleBackground = alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'light' ? 0.94 : 0.72
                  );

                  return {
                    height: 42,
                    borderRadius: getRadius(theme, -8),
                    borderColor: selected ? accentColor : theme.palette.divider,
                    bgcolor: selected
                      ? alpha(accentColor, 0.07)
                      : idleBackground,
                    color: selected
                      ? accentColor
                      : theme.palette.text.secondary,
                    boxShadow: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: selected
                        ? accentColor
                        : alpha(theme.palette.text.secondary, 0.34),
                      bgcolor: selected
                        ? alpha(accentColor, 0.09)
                        : idleBackground,
                      boxShadow: 'none',
                    },
                  };
                }}
              >
                {option}&nbsp;&nbsp;{label}
              </Button>
            );
          })}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 1.25,
          }}
        >
          {FIELD_LABELS.map((label, index) => (
            <Box key={label} sx={{ minWidth: 0 }}>
              <Typography
                variant='caption'
                sx={{
                  display: 'block',
                  mb: 0.75,
                  color: 'text.secondary',
                  opacity: 0.72,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Typography>
              <TextField
                fullWidth
                size='small'
                value={values[index]}
                onChange={event => handleFieldChange(index, event.target.value)}
                disabled={disabled}
                type='text'
                onFocus={event => event.target.select()}
                onKeyDown={event => handleFieldKeyDown(index, event)}
                inputRef={input => {
                  fieldInputRefs.current[index] = input;
                }}
                inputProps={{
                  'aria-label': label,
                  inputMode: 'numeric',
                  min: 0,
                }}
                sx={theme => {
                  const radius = getRadius(theme, -8);

                  return {
                    '& .MuiOutlinedInput-root': {
                      height: 42,
                      borderRadius: radius,
                      bgcolor: alpha(
                        theme.palette.background.paper,
                        theme.palette.mode === 'light' ? 0.94 : 0.72
                      ),
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                      borderRadius: radius,
                    },
                    '& .MuiInputBase-input': {
                      height: '100%',
                      boxSizing: 'border-box',
                      p: 0,
                      color: theme.palette.text.secondary,
                      fontSize: 14,
                      textAlign: 'center',
                    },
                  };
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
