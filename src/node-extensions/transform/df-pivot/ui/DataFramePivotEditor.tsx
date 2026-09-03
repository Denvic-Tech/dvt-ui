import React, { useCallback, useEffect, useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  Grid2 as Grid,
  IconButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import type { Column, DataFrameMetadata } from '@/shared/gatewayClient';
import { Panel } from '@/shared/ui';

import { ColumnPivotTable, type PerColumnRow } from './ColumnPivotTable';
import {
  getAllowedPivotAggFuncs,
  isPivotAggFunc,
  isPivotAggFuncAllowed,
  normalizePivotAggFunc,
  PIVOT_AGG_FUNCS,
  PIVOT_DEFAULT_AGG_FUNC,
  type PivotAggFunc,
} from './pivotAggfuncs';

interface DataFramePivotValues {
  index?: string;
  column?: string;
  aggfunc?: Record<string, string> | null;
}

function normalizeAggfunc(
  raw: Record<string, string> | null | undefined,
  dtypeMap: Record<string, string>,
  fallback: PivotAggFunc
): Record<string, string> | null {
  if (!raw) return null;

  const pairs = Object.entries(raw).map(([column, func]) => [
    column,
    normalizePivotAggFunc(func, dtypeMap[column], fallback),
  ]);

  return pairs.length ? Object.fromEntries(pairs) : null;
}

function shallowEqualObj(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

const EMPTY_COLUMNS: Column[] = [];
const EMPTY_INDEX_NAMES: string[] = [];

export const DataFramePivotEditor: React.FC<
  NodeModalExtensionProps<DataFramePivotValues>
> = ({
  id: nodeID,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const inputMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );

  const defaultAgg = PIVOT_DEFAULT_AGG_FUNC;
  const dfColumns = inputMetadata?.columns ?? EMPTY_COLUMNS;
  const indexNamesRaw =
    (inputMetadata as any)?.index_names ??
    (inputMetadata as any)?.indexNames ??
    EMPTY_INDEX_NAMES;

  const columnNames = useMemo(() => dfColumns.map(c => c.name), [dfColumns]);
  const indexNames: string[] = useMemo(
    () =>
      Array.isArray(indexNamesRaw)
        ? indexNamesRaw.filter((x: any): x is string => typeof x === 'string')
        : EMPTY_INDEX_NAMES,
    [indexNamesRaw]
  );
  const indexAndColumns = useMemo(
    () => Array.from(new Set([...columnNames, ...indexNames])),
    [columnNames, indexNames]
  );
  const indexAndColumnOptions = useMemo<Column[]>(() => {
    const options = new Map<string, Column>();

    for (const column of dfColumns) {
      options.set(column.name, column);
    }

    for (const indexName of indexNames) {
      if (!options.has(indexName)) {
        options.set(indexName, {
          name: indexName,
          index: true,
        } as Column);
      }
    }

    return Array.from(options.values());
  }, [dfColumns, indexNames]);

  const dtypeMap = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        dfColumns.map(c => [c.name, String(c.dtype ?? '').toUpperCase()])
      ),
    [dfColumns]
  );

  const valuesSel = useMemo(
    () => Object.keys(localInputData?.aggfunc ?? {}),
    [localInputData?.aggfunc]
  );

  useEffect(() => {
    setLocalInputData(prev => {
      const base = (prev ?? {}) as DataFramePivotValues;
      const normAgg =
        normalizeAggfunc(base.aggfunc ?? null, dtypeMap, defaultAgg) ?? null;
      const idx = base.index ?? '';
      const col = base.column ?? '';

      const initValues = Object.keys(normAgg ?? {})
        .filter(k => columnNames.includes(k))
        .filter(k => k !== idx && k !== col);

      const prunedAgg = Object.fromEntries(
        initValues.map(column => [
          column,
          normalizePivotAggFunc(
            normAgg?.[column],
            dtypeMap[column],
            defaultAgg
          ),
        ])
      );
      const nextAgg = Object.keys(prunedAgg).length ? prunedAgg : null;

      const sameIndex = (base.index ?? '') === idx;
      const sameColumn = (base.column ?? '') === col;
      const sameAgg = shallowEqualObj(base.aggfunc ?? null, nextAgg);

      if (sameIndex && sameColumn && sameAgg) return base;
      return { index: idx, column: col, aggfunc: nextAgg };
    });
  }, [columnNames, defaultAgg, dtypeMap, setLocalInputData]);

  const handleIndexChange = useCallback(
    (value: string) =>
      setLocalInputData(p => {
        const base = (p ?? {}) as DataFramePivotValues;
        const newColumn = base.column === value ? '' : (base.column ?? '');
        const prevAgg = base.aggfunc ?? {};
        const nextAgg = Object.fromEntries(
          Object.entries(prevAgg).filter(
            ([k]) => k !== value && k !== newColumn
          )
        );
        return {
          ...base,
          index: value,
          column: newColumn,
          aggfunc: Object.keys(nextAgg).length ? nextAgg : null,
        };
      }),
    [setLocalInputData]
  );

  const handleColumnChange = useCallback(
    (value: string) =>
      setLocalInputData(p => {
        const base = (p ?? {}) as DataFramePivotValues;
        const idx = base.index ?? '';
        const prevAgg = base.aggfunc ?? {};
        const nextAgg = Object.fromEntries(
          Object.entries(prevAgg).filter(([k]) => k !== idx && k !== value)
        );
        return {
          ...base,
          column: value,
          aggfunc: Object.keys(nextAgg).length ? nextAgg : null,
        };
      }),
    [setLocalInputData]
  );

  const handleValuesSelectChange = useCallback(
    (incoming: string[]) =>
      setLocalInputData(p => {
        const base = (p ?? {}) as DataFramePivotValues;
        const idx = base.index ?? '';
        const col = base.column ?? '';

        const selected = (incoming ?? [])
          .filter(v => columnNames.includes(v))
          .filter(v => v !== idx && v !== col);

        const prevAgg = base.aggfunc ?? {};
        const nextAgg: Record<string, string> = {};
        for (const k of selected) {
          nextAgg[k] = normalizePivotAggFunc(
            prevAgg[k],
            dtypeMap[k],
            defaultAgg
          );
        }

        return {
          ...base,
          aggfunc: Object.keys(nextAgg).length ? nextAgg : null,
        };
      }),
    [setLocalInputData, columnNames, dtypeMap, defaultAgg]
  );

  const handleRemoveValue = useCallback(
    (val: string) =>
      setLocalInputData(p => {
        const base = (p ?? {}) as DataFramePivotValues;
        const prevAgg = base.aggfunc ?? {};
        const { [val]: _, ...nextAgg } = prevAgg;
        return {
          ...base,
          aggfunc: Object.keys(nextAgg).length ? nextAgg : null,
        };
      }),
    [setLocalInputData]
  );

  const perColumnRows: PerColumnRow[] = useMemo(() => {
    const aggMap = localInputData?.aggfunc ?? {};
    return Object.entries(aggMap).map(([col, func]) => ({
      column: col,
      func: normalizePivotAggFunc(func, dtypeMap[col], defaultAgg),
    }));
  }, [localInputData?.aggfunc, defaultAgg, dtypeMap]);

  const setPerColumnRows = useCallback(
    (rows: PerColumnRow[]) =>
      setLocalInputData(prev => {
        const base = (prev ?? {}) as DataFramePivotValues;
        const nextMap: Record<string, string> = {};
        for (const r of rows ?? []) {
          if (!r?.column || !valuesSel.includes(r.column)) continue;
          nextMap[r.column] = normalizePivotAggFunc(
            r.func,
            dtypeMap[r.column],
            defaultAgg
          );
        }
        return {
          ...base,
          aggfunc: Object.keys(nextMap).length ? nextMap : null,
        };
      }),
    [setLocalInputData, valuesSel, dtypeMap, defaultAgg]
  );

  const runValidation = useCallback((): boolean => {
    const errors: Record<string, string[]> = {};
    const idx = (localInputData?.index ?? '').trim();
    const col = (localInputData?.column ?? '').trim();
    const agg = localInputData?.aggfunc ?? null;

    if (!idx) errors['index'] = ['Выберите колонку индекса.'];
    if (idx && !indexAndColumns.includes(idx)) {
      errors['index'] = [
        'Выбранное имя индекса отсутствует в колонках/имёнах индекса.',
      ];
    }
    if (!col) errors['column'] = ['Выберите колонку для разворота.'];
    if (col && !indexAndColumns.includes(col)) {
      errors['column'] = [
        'Выбранное имя разворота отсутствует в колонках/имёнах индекса.',
      ];
    }
    if (idx && col && idx === col) {
      const msg = 'Индекс и колонка разворота не должны совпадать.';
      errors['index'] = [msg];
      errors['column'] = [msg];
    }

    if (!agg || Object.keys(agg).length === 0) {
      errors['aggfunc'] = [
        'Добавьте хотя бы одну колонку и функцию агрегации.',
      ];
    }

    if (agg) {
      const badNotColumns = Object.keys(agg).filter(
        k => !columnNames.includes(k)
      );
      if (badNotColumns.length) {
        errors['aggfunc'] = [
          ...(errors['aggfunc'] ?? []),
          `Некорректные колонки в aggfunc: ${badNotColumns.join(', ')}.`,
        ];
      }
      const collide = Object.keys(agg).filter(k => k === idx || k === col);
      if (collide.length) {
        errors['aggfunc'] = [
          ...(errors['aggfunc'] ?? []),
          `Колонки в aggfunc не должны совпадать с index/column: ${collide.join(', ')}.`,
        ];
      }
      const badFuncs: string[] = [];
      for (const [c, f] of Object.entries(agg)) {
        const dt = dtypeMap[c];

        if (!isPivotAggFunc(f)) {
          badFuncs.push(`${c} → ${f}`);
          continue;
        }

        if (!isPivotAggFuncAllowed(f, dt)) {
          badFuncs.push(
            `${c} (${dt || 'UNKNOWN'}) → ${f}; допустимо: ${getAllowedPivotAggFuncs(
              dt
            ).join(', ')}`
          );
        }
      }
      if (badFuncs.length) {
        errors['aggfunc'] = [
          ...(errors['aggfunc'] ?? []),
          'Некорректные агрегации:',
          ...badFuncs.map(s => `• ${s}`),
          'Проверьте соответствие функции типу данных колонки.',
        ];
      }
    }

    if (Object.keys(errors).length) {
      setValidationErrors?.(errors);
      return false;
    }
    setValidationErrors?.({});
    return true;
  }, [
    localInputData?.index,
    localInputData?.column,
    localInputData?.aggfunc,
    indexAndColumns,
    columnNames,
    dtypeMap,
    setValidationErrors,
  ]);

  useEffect(() => {
    setValidationCallback?.(() => runValidation);
  }, [runValidation, setValidationCallback]);

  const menuProps = useMemo(() => ({ disableScrollLock: true }), []);
  const indexValue = localInputData?.index ?? '';
  const columnValue = localInputData?.column ?? '';
  const indexOptions = indexAndColumnOptions;
  const columnOptions = useMemo(
    () => indexAndColumnOptions.filter(column => column.name !== indexValue),
    [indexAndColumnOptions, indexValue]
  );
  const valuesOptions = useMemo(
    () => columnNames.filter(n => n !== indexValue && n !== columnValue),
    [columnNames, indexValue, columnValue]
  );

  const renderValues = useCallback(
    (selected: string[]) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selected.map(v => (
          <Chip
            key={v}
            label={v}
            size='small'
            onMouseDown={ev => ev.stopPropagation()}
            onDelete={() => handleRemoveValue(v)}
            deleteIcon={
              <Tooltip title='Удалить'>
                <IconButton
                  size='small'
                  onMouseDown={ev => ev.stopPropagation()}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            }
          />
        ))}
      </Box>
    ),
    [handleRemoveValue]
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {dfColumns.length ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Panel>
                <Typography variant='subtitle2' gutterBottom>
                  Индекс
                </Typography>
                <ColumnDropdownSelect
                  columns={indexOptions}
                  value={indexValue}
                  onChange={handleIndexChange}
                  placeholder='Выберите колонку/имя индекса'
                  noOptionText='Нет доступных колонок или имен индекса'
                />
                <Typography variant='caption' color='text.secondary'>
                  Выберите имя из колонок или df.index.names (одна колонка).
                </Typography>
              </Panel>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Panel>
                <Typography variant='subtitle2' gutterBottom>
                  Колонка для разворота
                </Typography>
                <ColumnDropdownSelect
                  columns={columnOptions}
                  value={columnValue}
                  onChange={handleColumnChange}
                  placeholder='Выберите колонку/имя индекса'
                  noOptionText='Нет доступных колонок или имен индекса'
                />
                <Typography variant='caption' color='text.secondary'>
                  Ось разворота (желательно категориальная/строковая).
                </Typography>
              </Panel>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Panel>
                <Typography variant='subtitle2' gutterBottom>
                  Значения (колонки)
                </Typography>
                <FormControl fullWidth size='small'>
                  <Select
                    multiple
                    value={valuesSel}
                    onChange={e =>
                      handleValuesSelectChange(
                        (e.target.value as string[]) ?? []
                      )
                    }
                    renderValue={renderValues}
                    MenuProps={menuProps}
                  >
                    {valuesOptions.map(name => (
                      <MenuItem key={name} value={name}>
                        <Checkbox checked={valuesSel.includes(name)} />
                        <ListItemText primary={name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant='caption' color='text.secondary'>
                  Выбранные здесь колонки автоматически добавляются в{' '}
                  <b>aggfunc</b> c функцией <b>first</b>.
                </Typography>
              </Panel>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Panel>
                <Typography variant='subtitle1' gutterBottom>
                  Агрегации по колонкам
                </Typography>
                <ColumnPivotTable
                  rows={perColumnRows}
                  onChange={setPerColumnRows}
                  allowedFuncs={PIVOT_AGG_FUNCS as unknown as string[]}
                  defaultFunc={defaultAgg}
                  dtypeMap={dtypeMap}
                />
                <Typography variant='caption' color='text.secondary'>
                  Для числовых, boolean и timedelta колонок доступны <b>mean</b>
                  , <b>sum</b>, <b>count</b>, <b>first</b>, <b>last</b>; для
                  остальных типов доступны <b>count</b>, <b>first</b>,{' '}
                  <b>last</b>.
                </Typography>
              </Panel>
            </Grid>
          </Grid>
        ) : (
          <Paper
            sx={{
              p: 2,
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              Нет данных DataFrame для отображения. Подключите DataFrame к входу
              узла.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};
