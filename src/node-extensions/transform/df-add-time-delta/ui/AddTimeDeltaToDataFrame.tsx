import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Collapse, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import { type DataFrameMetadata } from '@/shared/gatewayClient';
import { Input, TimeDeltaInput } from '@/shared/ui';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

interface AddTimeDeltaValues {
  column_with_time?: string;
  new_column_with_time?: string;
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export const AddTimeDeltaToDataFrameEditor: React.FC<
  NodeModalExtensionProps<AddTimeDeltaValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [errors, setErrors] = useState<string[]>([]);

  const dataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  // --- ЛОГИКА ТРАНСФОРМАЦИИ ДАННЫХ (Bridge) ---

  // Собираем строку для TimeDeltaInput из отдельных полей
  const timeDeltaString = useMemo(() => {
    const y = localValues.years || 0;
    const m = localValues.months || 0;
    const d = localValues.days || 0;
    const h = localValues.hours || 0;
    const min = localValues.minutes || 0;
    const s = localValues.seconds || 0;

    // Простейшая проверка на знак (берем по первому ненулевому или по умолчанию +)
    const isNegative = [y, m, d, h, min, s].some(v => v < 0);
    const sign = isNegative ? '-' : '+';

    return `${sign}${Math.abs(y)}-${Math.abs(m)}-${Math.abs(d)}-${Math.abs(h)}-${Math.abs(min)}-${Math.abs(s)}`;
  }, [localValues]);

  const handleTimeDeltaChange = (newValue: string) => {
    const sign = newValue.startsWith('-') ? -1 : 1;
    const parts = newValue
      .substring(1)
      .split('-')
      .map(v => (Number(v) || 0) * sign);

    setLocalValues(prev => ({
      ...prev,
      years: parts[0],
      months: parts[1],
      days: parts[2],
      hours: parts[3],
      minutes: parts[4],
      seconds: parts[5],
    }));
  };

  // --- ВАЛИДАЦИЯ ---
  const validate = useCallback(() => {
    const newErrors: string[] = [];

    if (!localValues.column_with_time) {
      newErrors.push('Выберите исходную колонку с датой/временем.');
    }
    if (!localValues.new_column_with_time?.trim()) {
      newErrors.push('Укажите название для новой колонки.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [localValues]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  if (!dataframeMetadata) {
    return (
      <Alert severity='info' sx={{ m: 1 }}>
        Подключите входной DataFrame для настройки смещения времени.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0.5 }}>
      {/* Сообщения об ошибках */}
      {errors.length > 0 ? (
        <Collapse in>
          <Alert severity='error' sx={{ mb: 1 }}>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </Alert>
        </Collapse>
      ) : null}

      {/* Выбор колонок */}
      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, opacity: 0.58 }}
        >
          Колонки
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography
              variant='body2'
              sx={{ mb: 0.75, display: 'block', color: 'text.primary' }}
            >
              Исходная колонка (DateTime / TimeDelta)
            </Typography>
            <ColumnDropdownSelect
              value={localValues.column_with_time || ''}
              columns={columns}
              onChange={name =>
                setLocalValues(prev => ({ ...prev, column_with_time: name }))
              }
              placeholder='Выберите колонку...'
            />
          </Box>

          <Box>
            <Typography
              variant='body2'
              sx={{ mb: 0.75, display: 'block', color: 'text.primary' }}
            >
              Название новой колонки
            </Typography>
            <Input
              value={localValues.new_column_with_time || ''}
              onChange={event =>
                setLocalValues(prev => ({
                  ...prev,
                  new_column_with_time: event.target.value,
                }))
              }
              placeholder='Введите название колонки'
              inputProps={{ 'aria-label': 'Название новой колонки' }}
              sx={theme => {
                const radius = getRadius(theme, -8);

                return {
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    minHeight: 40,
                    borderRadius: radius,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: radius,
                  },
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    px: 1.25,
                    '&::placeholder': {
                      color: 'text.secondary',
                      opacity: 0.72,
                    },
                  },
                };
              }}
            />
          </Box>
        </Stack>
      </Box>

      {/* Настройка смещения времени */}
      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, opacity: 0.58 }}
        >
          Смещение (Time Delta)
        </Typography>
        <Box sx={{ mt: 1 }}>
          <TimeDeltaInput
            value={timeDeltaString}
            onChange={handleTimeDeltaChange}
          />
        </Box>
      </Box>

      <Alert
        severity='warning'
        icon={false}
        sx={theme => ({
          border: '1px solid',
          borderColor: alpha(
            theme.palette.warning.main,
            theme.palette.mode === 'light' ? 0.24 : 0.34
          ),
          borderRadius: getRadius(theme, -8),
        })}
      >
        <Typography variant='caption' sx={{ display: 'block' }}>
          Убедитесь, что исходная колонка имеет тип <b>datetime64</b> или{' '}
          <b>timedelta64</b>. Операция прибавит указанный интервал к каждой
          строке выбранной колонки.
        </Typography>
      </Alert>
    </Box>
  );
};
