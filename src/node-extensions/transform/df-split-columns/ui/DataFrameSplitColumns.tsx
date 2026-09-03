import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CallSplit as SplitIcon,
  InfoOutlined as InfoIcon,
  LayersClear as DropIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';
import { Panel } from '@/shared/ui';

interface SplitColumnValues {
  column?: string;
  delimiter?: string;
  max_splits?: number;
  drop_source?: boolean;
}

export const DataFrameSplitColumnEditor: React.FC<
  NodeModalExtensionProps<SplitColumnValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [errors, setErrors] = useState<string[]>([]);

  const dataframeMetadata: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  // Валидация параметров
  const validate = useCallback(() => {
    const newErrors: string[] = [];

    if (!localValues.column) {
      newErrors.push('Выберите колонку для разделения.');
    }

    if (localValues.delimiter === undefined || localValues.delimiter === '') {
      newErrors.push('Укажите разделитель (например, запятую или пробел).');
    }

    if (!localValues.max_splits || localValues.max_splits < 1) {
      newErrors.push('Количество разделений должно быть не менее 1.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [localValues]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  // Хелпер для отображения будущих колонок
  const previewColumns = useMemo(() => {
    if (!localValues.column || !localValues.max_splits) return [];
    const count = Number(localValues.max_splits) + 1;
    return Array.from(
      { length: count },
      (_, i) => `${localValues.column}_${i + 1}`
    );
  }, [localValues.column, localValues.max_splits]);

  if (!dataframeMetadata) {
    return (
      <Alert severity='info' sx={{ m: 1 }}>
        Подключите входной DataFrame для настройки.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0.5 }}>
      {/* Ошибки валидации */}
      <Collapse in={errors.length > 0}>
        <Alert severity='error' sx={{ mb: 1 }}>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Alert>
      </Collapse>

      {/* Выбор колонки */}
      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
        >
          Целевая колонка
        </Typography>
        <Panel
          sx={{
            mt: 1,
            p: 2.5,
            borderLeft: '4px solid',
            borderColor: 'primary.main',
          }}
        >
          <ColumnDropdownSelect
            value={localValues.column || ''}
            columns={columns}
            onChange={name => {
              setLocalValues(prev => ({ ...prev, column: name }));
              setErrors([]);
            }}
            placeholder='Выберите колонку для разделения...'
          />
        </Panel>
      </Box>

      {/* Параметры разделения */}
      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
        >
          Настройки Split
        </Typography>
        <Panel sx={{ mt: 1, p: 2.5 }}>
          <Stack spacing={3}>
            <Stack direction='row' spacing={2}>
              <TextField
                label='Разделитель'
                fullWidth
                size='small'
                value={localValues.delimiter || ''}
                onChange={e =>
                  setLocalValues(prev => ({
                    ...prev,
                    delimiter: e.target.value,
                  }))
                }
                placeholder='Напр: , или ;'
                helperText={
                  localValues.delimiter === ' '
                    ? 'Используется пробел'
                    : 'Символ, по которому резать строку'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SplitIcon fontSize='small' color='action' />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label='Кол-во разделений'
                type='number'
                size='small'
                sx={{ width: '220px' }}
                value={localValues.max_splits ?? 1}
                inputProps={{ min: 1 }}
                onChange={e =>
                  setLocalValues(prev => ({
                    ...prev,
                    max_splits: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </Stack>

            <Divider />

            <FormControlLabel
              control={
                <Checkbox
                  checked={!!localValues.drop_source}
                  onChange={e =>
                    setLocalValues(prev => ({
                      ...prev,
                      drop_source: e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Stack direction='row' alignItems='center' spacing={1}>
                  <Typography variant='body2'>
                    Удалить исходную колонку
                  </Typography>
                  <DropIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </Stack>
              }
            />
          </Stack>
        </Panel>
      </Box>

      {/* Предпросмотр результата */}
      {localValues.column && (
        <Box>
          <Typography
            variant='overline'
            sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
          >
            Результат (новые колонки)
          </Typography>
          <Panel
            sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderStyle: 'dashed' }}
          >
            <Stack direction='row' flexWrap='wrap' gap={1}>
              {previewColumns.map(name => (
                <Box
                  key={name}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {name}
                </Box>
              ))}
            </Stack>
            <Typography
              variant='caption'
              sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}
            >
              <InfoIcon
                sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }}
              />
              Тип новых колонок будет <strong>String (object)</strong>
            </Typography>
          </Panel>
        </Box>
      )}
    </Box>
  );
};
