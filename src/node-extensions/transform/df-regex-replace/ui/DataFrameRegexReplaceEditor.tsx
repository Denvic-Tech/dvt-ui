import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircleOutline as SuccessIcon,
  FindReplace as ReplaceIcon,
  InfoOutlined as InfoIcon,
  Pattern as PatternIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  InputAdornment,
  Paper,
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

interface DataFrameRegexReplaceValues {
  column_to_replace?: string;
  pattern?: string;
  replacement?: string;
}

export const DataFrameRegexReplaceEditor: React.FC<
  NodeModalExtensionProps<DataFrameRegexReplaceValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);

  const dataframeMetadata: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  // Стейт для песочницы
  const [testString, setTestString] = useState('Пример строки 123');
  const [patternError, setPatternError] = useState<string | null>(null);

  const validatePattern = useCallback((pattern: string): string | null => {
    if (!pattern) return 'Шаблон не может быть пустым';
    try {
      new RegExp(pattern, 'u');
      return null;
    } catch (e: any) {
      return 'Некорректный синтаксис выражения';
    }
  }, []);

  const previewResult = useMemo(() => {
    if (!localValues.pattern || patternError) return testString;
    try {
      // Используем флаг 'g' для глобальной замены, как в re.sub
      const regex = new RegExp(localValues.pattern, 'gu');
      return testString.replace(regex, localValues.replacement || '');
    } catch {
      return testString;
    }
  }, [testString, localValues.pattern, localValues.replacement, patternError]);

  const validate = useCallback(() => {
    if (!localValues.column_to_replace) return false;
    return validatePattern(localValues.pattern || '') === null;
  }, [localValues, validatePattern]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValues(p => ({ ...p, pattern: val }));
    setPatternError(validatePattern(val));
  };

  if (!dataframeMetadata) {
    return (
      <Alert severity='info'>Подключите входной DataFrame для настройки</Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0.5 }}>
      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
        >
          Выбор колонки
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
            value={localValues.column_to_replace || ''}
            columns={columns}
            onChange={name =>
              setLocalValues(p => ({ ...p, column_to_replace: name }))
            }
            placeholder='Выберите колонку для обработки...'
          />
        </Panel>
      </Box>

      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
        >
          Конфигурация поиска и замены
        </Typography>
        <Panel sx={{ mt: 1, p: 2.5 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label='Шаблон (что ищем)'
              size='small'
              value={localValues.pattern || ''}
              onChange={handlePatternChange}
              error={!!patternError}
              helperText={
                patternError || 'Используется стандарт Python re.sub()'
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <PatternIcon
                      fontSize='small'
                      color={patternError ? 'error' : 'action'}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label='Замена (на что меняем)'
              size='small'
              value={localValues.replacement || ''}
              onChange={e =>
                setLocalValues(p => ({ ...p, replacement: e.target.value }))
              }
              placeholder='Оставьте пустым для удаления совпадений'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <ReplaceIcon fontSize='small' color='action' />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {localValues.pattern && !patternError && (
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              sx={{ mt: 2, color: 'success.main' }}
            >
              <SuccessIcon fontSize='small' />
              <Typography variant='caption' sx={{ fontWeight: 500 }}>
                Выражение корректно
              </Typography>
            </Stack>
          )}
        </Panel>
      </Box>

      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
        >
          Интерактивная проверка
        </Typography>
        <Paper
          variant='outlined'
          sx={{
            mt: 1,
            p: 2.5,
            bgcolor: 'grey.50',
            borderStyle: 'dashed',
            borderRadius: 2,
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              variant='standard'
              label='Тестовая строка'
              value={testString}
              onChange={e => setTestString(e.target.value)}
              InputProps={{
                endAdornment: (
                  <Tooltip title='Введите текст, чтобы проверить работу регулярного выражения в реальном времени'>
                    <InfoIcon
                      sx={{ color: 'text.disabled', cursor: 'help' }}
                      fontSize='small'
                    />
                  </Tooltip>
                ),
              }}
            />
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                minHeight: '40px',
              }}
            >
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mb: 0.5 }}
              >
                Результат замены:
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  fontWeight: 500,
                }}
              >
                {previewResult}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ px: 1 }}>
        <Typography
          variant='caption'
          display='block'
          sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 500 }}
        >
          Популярные шаблоны:
        </Typography>
        <Stack direction='row' flexWrap='wrap' gap={1}>
          {[
            { label: 'Цифры', p: '\\d+', r: '', desc: 'Удалить все цифры' },
            {
              label: 'Пробелы',
              p: '\\s+',
              r: '_',
              desc: 'Заменить на подчеркивание',
            },
            {
              label: 'Спецсимволы',
              p: '[^\\w\\s]',
              r: '',
              desc: 'Очистить от знаков',
            },
          ].map(ex => (
            <Box
              key={ex.label}
              onClick={() => {
                setLocalValues(prev => ({
                  ...prev,
                  pattern: ex.p,
                  replacement: ex.r,
                }));
                setPatternError(null);
              }}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.2s',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'primary.50',
                  borderColor: 'primary.light',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <strong>{ex.label}</strong>: {ex.p}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
