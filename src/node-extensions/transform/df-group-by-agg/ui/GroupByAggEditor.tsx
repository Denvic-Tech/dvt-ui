import React, { useCallback, useEffect, useMemo } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';
import { Panel } from '@/shared/ui';

const BACKEND_FUNCS = [
  'sum',
  'mean',
  'min',
  'max',
  'count',
  'first',
  'last',
  'nunique',
  'std',
  'var',
] as const;

type BackendFunc = (typeof BACKEND_FUNCS)[number];

// Группировка разрешенных функций на основе типов (только из списка бэкенда)
const AGG_GROUPS = {
  NUMERIC: ['sum', 'mean', 'std', 'var'] as BackendFunc[],
  COMMON: ['count', 'nunique', 'first', 'last'] as BackendFunc[],
  ORDERED: ['min', 'max'] as BackendFunc[],
};

interface GroupByNodeValues {
  group_by_columns?: string[];
  new_cols?: string[];
  source_cols?: string[];
  agg_funcs?: string[];
  dropna?: boolean;
}

interface AggItem {
  newCol: string;
  sourceCol: string;
  aggFunc: string;
}

export const GroupByAggregationEditor: React.FC<
  NodeModalExtensionProps<GroupByNodeValues>
> = ({
  id: nodeID,
  isOpen,
  nodeDefinition,
  localInputData,
  setLocalInputData,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);

  useEffect(() => {
    if (isOpen && typeof localInputData.group_by_columns === 'undefined') {
      setLocalInputData({
        ...localInputData,
        group_by_columns: [],
      });
    }
  }, [isOpen, localInputData.group_by_columns, setLocalInputData]);

  const inputMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const isNumericColumn = useCallback(
    (columnName: string) => {
      const col = inputMetadata?.columns.find(c => c.name === columnName);
      if (!col?.dtype) return false;
      const type = String(col.dtype).toUpperCase();
      return (
        type.includes('INT') ||
        type.includes('FLOAT') ||
        type.includes('DOUBLE') ||
        type.includes('DECIMAL')
      );
    },
    [inputMetadata]
  );

  const getAvailableFuncs = useCallback(
    (columnName: string): BackendFunc[] => {
      if (!columnName) return [...AGG_GROUPS.COMMON];

      const isNumeric = isNumericColumn(columnName);
      // Для чисел: все функции. Для остальных: COMMON + ORDERED (min/max)
      const options = [...AGG_GROUPS.COMMON, ...AGG_GROUPS.ORDERED];

      if (isNumeric) {
        options.push(...AGG_GROUPS.NUMERIC);
      }

      // Возвращаем уникальные значения, пересеченные с разрешенным списком бэкенда
      return Array.from(new Set(options)).filter(f =>
        BACKEND_FUNCS.includes(f)
      );
    },
    [isNumericColumn]
  );

  const selectedAggItems: AggItem[] = useMemo(() => {
    return (
      localInputData.new_cols?.map((newCol, idx) => ({
        newCol: newCol,
        sourceCol: localInputData.source_cols?.[idx] || '',
        aggFunc: localInputData.agg_funcs?.[idx] || '',
      })) || []
    );
  }, [localInputData]);

  useEffect(() => {
    if (localInputData.dropna !== undefined && localInputData.dropna !== null) {
      return;
    }

    setLocalInputData(prev => {
      if (prev.dropna !== undefined && prev.dropna !== null) {
        return prev;
      }

      return { ...prev, dropna: false };
    });
  }, [localInputData.dropna, setLocalInputData]);

  const handleAggItemsChange = useCallback(
    (
      property: keyof Omit<GroupByNodeValues, 'group_by_columns'>,
      index: number,
      value: string
    ) => {
      setLocalInputData(prev => {
        const next = { ...prev };
        const newCols = [...(prev.new_cols ?? [])];
        const sourceCols = [...(prev.source_cols ?? [])];
        const aggFuncs = [...(prev.agg_funcs ?? [])];

        if (property === 'new_cols') newCols[index] = value;
        if (property === 'source_cols') sourceCols[index] = value;
        if (property === 'agg_funcs') aggFuncs[index] = value;

        // Если сменили колонку — проверяем, доступна ли еще старая функция
        if (property === 'source_cols') {
          const available = getAvailableFuncs(value);
          if (!available.includes(aggFuncs[index] as BackendFunc)) {
            aggFuncs[index] = 'count';
          }
        }

        // Автогенерация названия колонки (только если она пустая)
        if (
          (property === 'source_cols' || property === 'agg_funcs') &&
          !newCols[index]
        ) {
          const sCol = sourceCols[index];
          const aFunc = aggFuncs[index];
          if (sCol && aFunc) newCols[index] = `${sCol}_${aFunc}`;
        }

        return {
          ...next,
          new_cols: newCols,
          source_cols: sourceCols,
          agg_funcs: aggFuncs,
        };
      });
    },
    [setLocalInputData, getAvailableFuncs]
  );

  const handleAddAggItem = useCallback(() => {
    setLocalInputData(prev => ({
      ...prev,
      new_cols: [...(prev.new_cols ?? []), ''],
      source_cols: [...(prev.source_cols ?? []), ''],
      agg_funcs: [...(prev.agg_funcs ?? []), ''],
    }));
  }, [setLocalInputData]);

  const handleRemoveAggItem = useCallback(
    (idx: number) => {
      setLocalInputData(prev => ({
        ...prev,
        new_cols: (prev.new_cols ?? []).filter((_, i) => i !== idx),
        source_cols: (prev.source_cols ?? []).filter((_, i) => i !== idx),
        agg_funcs: (prev.agg_funcs ?? []).filter((_, i) => i !== idx),
      }));
    },
    [setLocalInputData]
  );

  const handleClearAllAggItems = useCallback(() => {
    setLocalInputData(prev => ({
      ...prev,
      new_cols: [],
      source_cols: [],
      agg_funcs: [],
    }));
  }, [setLocalInputData]);

  const columnsForAgg = useMemo(
    () =>
      inputMetadata?.columns.filter(
        col => !localInputData.group_by_columns?.includes(col.name)
      ) || [],
    [inputMetadata?.columns, localInputData.group_by_columns]
  );

  return (
    <Box>
      <Panel elevation={1} sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={3}>
            <Typography variant='body2' fontWeight={600} color='text.secondary'>
              Группировать по
            </Typography>
          </Grid>
          <Grid size={9}>
            <ColumnDropdownSelect
              multiple
              columns={inputMetadata?.columns || []}
              value={localInputData.group_by_columns || []}
              onChange={val =>
                setLocalInputData(v => ({ ...v, group_by_columns: val }))
              }
              placeholder='Выберите колонки...'
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} alignItems='center' sx={{ mt: 1 }}>
          <Grid size={3}>
            <Typography variant='body2' fontWeight={600} color='text.secondary'>
              Обработка NULL
            </Typography>
          </Grid>
          <Grid size={9}>
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  size='small'
                  checked={localInputData.dropna !== true}
                  onChange={(_event, checked) =>
                    setLocalInputData(v => ({ ...v, dropna: !checked }))
                  }
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant='body2'>
                    Сохранять группы с NULL в ключах
                  </Typography>
                  <Tooltip
                    title='При выключении (dropna=True) строки с NULL в любых group_by_columns будут исключены из результата.'
                    arrow
                  >
                    <InfoOutlinedIcon
                      sx={{
                        fontSize: 18,
                        color: 'text.disabled',
                        cursor: 'help',
                      }}
                    />
                  </Tooltip>
                </Box>
              }
            />
          </Grid>
        </Grid>
      </Panel>

      <Panel elevation={1} sx={{ p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='body2' fontWeight={600} color='text.secondary'>
            Агрегации
          </Typography>
          {selectedAggItems.length > 0 && (
            <Button size='small' color='error' onClick={handleClearAllAggItems}>
              Очистить
            </Button>
          )}
        </Box>

        {selectedAggItems.map((row, idx) => {
          const availableFuncs = getAvailableFuncs(row.sourceCol);
          return (
            <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ flex: 4 }}>
                <ColumnDropdownSelect
                  columns={columnsForAgg}
                  value={row.sourceCol}
                  onChange={val =>
                    handleAggItemsChange('source_cols', idx, val)
                  }
                  placeholder='Колонка'
                />
              </Box>
              <Box sx={{ flex: 2.5 }}>
                <FormControl fullWidth size='small' disabled={!row.sourceCol}>
                  <InputLabel>Функция</InputLabel>
                  <Select
                    value={row.aggFunc}
                    label='Функция'
                    onChange={e =>
                      handleAggItemsChange('agg_funcs', idx, e.target.value)
                    }
                  >
                    {availableFuncs.map(f => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 3.5 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Имя'
                  value={row.newCol}
                  onChange={e =>
                    handleAggItemsChange('new_cols', idx, e.target.value)
                  }
                />
              </Box>
              <IconButton
                onClick={() => handleRemoveAggItem(idx)}
                size='small'
                color='inherit'
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Box>
          );
        })}

        <Button
          fullWidth
          variant='outlined'
          startIcon={<AddIcon />}
          onClick={handleAddAggItem}
          sx={{ borderStyle: 'dashed' }}
        >
          Добавить агрегацию
        </Button>
      </Panel>
    </Box>
  );
};
