import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  InfoOutlined as InfoIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Checkbox,
  Collapse,
  FormControlLabel,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';
import { Panel } from '@/shared/ui';

interface NumericNormalizerValues {
  columns_to_normalize?: string[];
  lower_border?: number;
  upper_border?: number;
  replace_empty_values?: boolean;
}

export const DataFrameNumericNormalizerEditor: React.FC<
  NodeModalExtensionProps<NumericNormalizerValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [errors, setErrors] = useState<string[]>([]);

  // Получаем метаданные датафрейма
  const dataframeMetadata: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  // Валидация границ (Min <= Max)
  const validate = useCallback(() => {
    const newErrors: string[] = [];
    const low = localValues.lower_border ?? 0;
    const high = localValues.upper_border ?? 0;

    if (low > high) {
      newErrors.push('Нижняя граница не может быть больше верхней.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [localValues]);

  useEffect(() => {
    if (setValidationCallback) {
      setValidationCallback(() => validate);
    }
  }, [setValidationCallback, validate]);

  const handleBorderChange = (
    field: keyof NumericNormalizerValues,
    val: string
  ) => {
    const numVal = val === '' || val === '-' ? 0 : parseFloat(val);
    setLocalValues(prev => ({ ...prev, [field]: numVal }));
  };

  const handleColumnsChange = (newCols: string[]) => {
    setLocalValues(prev => ({ ...prev, columns_to_normalize: newCols }));
  };

  if (!dataframeMetadata) {
    return (
      <Alert severity='info' sx={{ m: 1 }}>
        Подключите узел с DataFrame к входу &#34;df&#34;, чтобы выбрать колонки.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0.5 }}>
      <Collapse in={errors.length > 0}>
        <Alert severity='error' sx={{ mb: 1 }}>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Alert>
      </Collapse>

      {/* Выбор колонок через кастомный MultiSelect */}
      <Box>
        <Stack
          direction='row'
          alignItems='center'
          spacing={1}
          sx={{ mb: 1, ml: 1 }}
        >
          <Typography
            variant='overline'
            sx={{ color: 'text.secondary', fontWeight: 700 }}
          >
            Целевые колонки
          </Typography>
          <Tooltip title='Выберите колонки. Если оставить поле пустым, будут обработаны все числовые колонки.'>
            <InfoIcon
              sx={{ color: 'text.disabled', fontSize: 18, cursor: 'help' }}
            />
          </Tooltip>
        </Stack>

        <Panel sx={{ p: 2 }}>
          <ColumnDropdownSelect
            multiple
            value={localValues.columns_to_normalize || []}
            onChange={handleColumnsChange}
            columns={columns}
            placeholder='Все числовые колонки (по умолчанию)'
            error={errors.length > 0}
          />
        </Panel>
      </Box>

      {/* Настройка границ */}
      <Box>
        <Stack
          direction='row'
          alignItems='center'
          spacing={1}
          sx={{ mb: 1, ml: 1 }}
        >
          <Typography
            variant='overline'
            sx={{ color: 'text.secondary', fontWeight: 700 }}
          >
            Диапазон нормализации (Clip)
          </Typography>
          <TuneIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
        </Stack>

        <Panel sx={{ p: 2.5 }}>
          <Stack spacing={3}>
            <Stack direction='row' spacing={2}>
              <TextField
                label='Lower border (Min)'
                type='number'
                size='small'
                fullWidth
                value={localValues.lower_border ?? 0}
                onChange={e =>
                  handleBorderChange('lower_border', e.target.value)
                }
                error={errors.length > 0}
              />
              <TextField
                label='Upper border (Max)'
                type='number'
                size='small'
                fullWidth
                value={localValues.upper_border ?? 0}
                onChange={e =>
                  handleBorderChange('upper_border', e.target.value)
                }
                error={errors.length > 0}
              />
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={localValues.replace_empty_values ?? true}
                  onChange={e =>
                    setLocalValues(prev => ({
                      ...prev,
                      replace_empty_values: e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>
                    Заполнять пустые значения (NaN)
                  </Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Нулевые значения будут заменены на:{' '}
                    <b>{localValues.lower_border ?? 0}</b>
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </Panel>
      </Box>
    </Box>
  );
};
