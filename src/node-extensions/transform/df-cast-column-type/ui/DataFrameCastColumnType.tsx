import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { FaArrowRight } from 'react-icons/fa';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnItem } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';
import { Panel } from '@/shared/ui';

import { isSafeCast, normalizeType } from '@/helpers/dtypes';

interface DataFrameCastColumnTypeValues {
  dtypes?: Record<string, string> | undefined; // backend: { colName: 'int' | 'float' | 'str' | 'bool' | 'datetime' }
}

const ROW_H = 40;

// Кандидаты целевых normalized-типов, которые мы вообще показываем как вариант назначения.
const CANDIDATE_TARGETS = [
  'STRING',
  'INT',
  'FLOAT',
  'BOOLEAN',
  'DATETIME',
] as const;

// Временный флаг: выключает/включает логику "безопасных" кастов.
// Сейчас он выключен => можно кастовать любой тип в любой.
const SAFE_CAST_RESTRICTION_ENABLED = false;

// Бэкенд ожидает нижние регистры (см. docstring узла)
const NORMALIZED_TO_BACKEND: Record<string, string> = {
  STRING: 'str',
  INT: 'Int64',
  FLOAT: 'Float64',
  BOOLEAN: 'bool',
  DATETIME: 'datetime64[ns]',
};
const BACKEND_TO_NORMALIZED: Record<string, string> = {
  str: 'STRING',
  Int64: 'INT',
  Float64: 'FLOAT',
  bool: 'BOOLEAN',
  'datetime64[ns]': 'DATETIME',
  // category специально не поддерживаем как цель (нет в SAFE_CASTS)
};

// Хелпер: привести pandas/dask dtype к normalized (INT/FLOAT/STRING/BOOLEAN/DATETIME/DATE/TIME/CATEGORY)
function normalizeFromMetadata(dtype?: string | null): string | null {
  if (!dtype) return null;
  const d = String(dtype).toLowerCase();

  // быстрые эвристики по типичным pandas/dask dtypes
  if (d.includes('int')) return 'INT';
  if (d.includes('float') || d.includes('double') || d.includes('decimal'))
    return 'FLOAT';
  if (d.includes('bool')) return 'BOOLEAN';
  if (d.includes('datetime')) return 'DATETIME';
  if (d === 'date') return 'DATE';
  if (d === 'time') return 'TIME';
  if (d.includes('category')) return 'CATEGORY';
  if (d.includes('string') || d.includes('object') || d.includes('str'))
    return 'STRING';

  // Попытка через normalizeType (на случай источников из БД)
  return normalizeType(dtype);
}

// Опции назначения для конкретной строки
function allowedTargets(fromNorm: string | null): string[] {
  // Защита отключена: показываем все кандидаты, независимо от fromNorm
  if (!SAFE_CAST_RESTRICTION_ENABLED) {
    return [...CANDIDATE_TARGETS];
  }

  // Старая логика — оставлена на будущее
  if (!fromNorm) return [];
  return CANDIDATE_TARGETS.filter(to => isSafeCast(fromNorm, to));
}

export const DataFrameCastColumnTypeEditor: React.FC<
  NodeModalExtensionProps<DataFrameCastColumnTypeValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);

  const dfMeta: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(() => dfMeta?.columns ?? [], [dfMeta]);

  // Локальный state: выбранные normalized-цели по каждой колонке (или null если не выбрано)
  const [selectedTargets, setSelectedTargets] = useState<(string | null)[]>([]);

  // Инициализация из localValues.dtypes (backend-формат) при изменении метаданных/значений
  useEffect(() => {
    if (!columns.length) {
      setSelectedTargets([]);
      return;
    }
    const saved = localValues.dtypes ?? {};
    const aligned: (string | null)[] = columns.map(col => {
      const backendVal = saved[col.name];
      const norm = backendVal ? BACKEND_TO_NORMALIZED[backendVal] : null;
      return norm ?? null;
    });
    setSelectedTargets(aligned);
  }, [columns, localValues.dtypes]);

  // Пересобрать dtypes (backend-формат) из selectedTargets
  const rebuildBackendMapping = useCallback(
    (targets: (string | null)[]) => {
      const next: Record<string, string> = {};
      for (let i = 0; i < columns.length; i++) {
        const toNorm = targets[i];
        if (toNorm) {
          const backendType = NORMALIZED_TO_BACKEND[toNorm];
          if (backendType) next[columns[i].name] = backendType;
        }
      }
      setLocalValues(prev => ({
        ...prev,
        dtypes: Object.keys(next).length ? next : undefined,
      }));
    },
    [columns, setLocalValues]
  );

  // Изменение значения в select для колонки idx (значение — normalized или '')
  const setTypeDirect = (idx: number, val: string) => {
    setSelectedTargets(prev => {
      const next = prev.slice();
      next[idx] = val || null;
      rebuildBackendMapping(next);
      return next;
    });
  };

  // Валидация
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validate = useCallback(() => {
    // При выключенной защите — никаких ограничений и ошибок
    if (!SAFE_CAST_RESTRICTION_ENABLED) {
      setValidationErrors([]);
      return true;
    }

    // Старая логика проверки безопасных кастов (сохранена на будущее)
    const errs: string[] = [];
    const anySelected = selectedTargets.some(Boolean);

    if (!anySelected) {
      errs.push('Нужно задать хотя бы одно безопасное приведение типа.');
    }

    for (let i = 0; i < columns.length; i++) {
      const toNorm = selectedTargets[i];
      if (!toNorm) continue;
      const fromNorm = normalizeFromMetadata(columns[i]?.dtype);
      if (!fromNorm) {
        errs.push(
          `Тип колонки "${columns[i]?.name}" не распознан, преобразование отключено.`
        );
        continue;
      }
      if (!isSafeCast(fromNorm, toNorm)) {
        errs.push(
          `Небезопасное преобразование: ${columns[i].name} ${fromNorm} → ${toNorm}.`
        );
      }
    }

    setValidationErrors(errs);
    return errs.length === 0;
  }, [columns, selectedTargets]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  useEffect(() => {
    validate();
  }, [selectedTargets, validate]);

  if (!dfMeta) {
    return (
      <Typography>
        Нет метаданных… Подключите вход <b>df</b>.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {validationErrors.length > 0 && (
        <Alert severity='error'>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {validationErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Panel elevation={1}>
        <TableContainer component={Box}>
          <Table
            size='small'
            aria-label='cast dtype mapping table'
            sx={{
              tableLayout: 'fixed',
              '& td': { borderBottom: 'none', height: ROW_H, py: 0.5 },
            }}
          >
            <TableBody>
              {columns.map((col, idx) => {
                const fromNorm = normalizeFromMetadata(col.dtype);
                const options = allowedTargets(fromNorm);
                const value = selectedTargets[idx] ?? '';

                // Когда защита выключена — select всегда доступен
                const disabled = SAFE_CAST_RESTRICTION_ENABLED
                  ? !fromNorm || options.length === 0
                  : false;

                return (
                  <TableRow key={`row-${col.name}`} hover={false}>
                    {/* LEFT: колонка */}
                    <TableCell sx={{ width: '45%', pr: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <ColumnItem column={col} />
                      </Box>
                    </TableCell>

                    {/* ARROW */}
                    <TableCell sx={{ width: '10%', px: 0 }}>
                      <Box
                        sx={{
                          height: ROW_H,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FaArrowRight size={16} />
                      </Box>
                    </TableCell>

                    {/* RIGHT: Select с целевыми типами */}
                    <TableCell sx={{ width: '45%', pl: 1 }}>
                      <Stack
                        direction='row'
                        alignItems='center'
                        spacing={1}
                        sx={{ width: '100%' }}
                      >
                        <FormControl size='small' fullWidth disabled={disabled}>
                          <Select
                            displayEmpty
                            value={value}
                            onChange={e =>
                              setTypeDirect(
                                idx,
                                (e.target.value as string) || ''
                              )
                            }
                            renderValue={val =>
                              val ? (
                                String(val)
                              ) : (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {disabled
                                    ? 'Нет безопасных вариантов'
                                    : 'Выбери тип…'}
                                </Typography>
                              )
                            }
                          >
                            <MenuItem value=''>
                              <em>Не менять</em>
                            </MenuItem>
                            {options.map(t => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Сброс только если установлено значение */}
                        {value && (
                          <IconButton
                            size='small'
                            onClick={() => setTypeDirect(idx, '')}
                            title='Сбросить приведение'
                            aria-label='clear'
                          >
                            ✕
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Panel>
    </Box>
  );
};
