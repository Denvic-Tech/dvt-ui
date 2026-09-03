import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';
import {
  Alert,
  AlertDescription,
  Button,
  Field,
  IconButton,
  Select,
  Tooltip,
  TooltipProvider,
} from '@/shared/ui/primitives';

type FillNAStrategy =
  | 'mean'
  | 'median'
  | 'mode'
  | 'min'
  | 'max'
  | 'ffill'
  | 'bfill';

type FillNAValues = {
  fill_values?: Record<string, FillNAStrategy>;
};

type FillNARow = {
  column: string;
  id: number;
  strategy: FillNAStrategy | '';
};

const STRATEGY_OPTIONS: Array<{
  description: string;
  label: string;
  value: FillNAStrategy;
}> = [
  {
    value: 'mean',
    label: 'Mean',
    description: 'Среднее значение колонки',
  },
  {
    value: 'median',
    label: 'Median',
    description: 'Медиана колонки',
  },
  {
    value: 'mode',
    label: 'Mode',
    description: 'Самое частое непустое значение',
  },
  {
    value: 'min',
    label: 'Min',
    description: 'Минимальное значение',
  },
  {
    value: 'max',
    label: 'Max',
    description: 'Максимальное значение',
  },
  {
    value: 'ffill',
    label: 'Forward fill',
    description: 'Предыдущее непустое значение',
  },
  {
    value: 'bfill',
    label: 'Backward fill',
    description: 'Следующее непустое значение',
  },
];

const STRATEGY_VALUES = new Set<FillNAStrategy>(
  STRATEGY_OPTIONS.map(option => option.value)
);

const STRATEGY_SELECT_OPTIONS = STRATEGY_OPTIONS.map(option => ({
  value: option.value,
  label: option.label,
}));

const createEmptyRow = (id: number): FillNARow => ({
  id,
  column: '',
  strategy: '',
});

const serializeRows = (rows: FillNARow[]): Record<string, FillNAStrategy> => {
  return rows.reduce<Record<string, FillNAStrategy>>((acc, row) => {
    const column = row.column.trim();

    if (column && row.strategy) {
      acc[column] = row.strategy;
    }

    return acc;
  }, {});
};

const getFingerprint = (value: Record<string, FillNAStrategy> = {}) =>
  JSON.stringify(
    Object.entries(value)
      .filter((entry): entry is [string, FillNAStrategy] => {
        return Boolean(entry[0]) && STRATEGY_VALUES.has(entry[1]);
      })
      .sort(([left], [right]) => left.localeCompare(right))
  );

const hasPartialRow = (row: FillNARow) => {
  return row.column.trim() !== '' || row.strategy !== '';
};

export const DataFrameFillNAEditor: React.FC<
  NodeModalExtensionProps<FillNAValues>
> = ({
  id: nodeID,
  localInputData,
  setLocalInputData,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const nextRowIdRef = useRef(1);
  const lastSerializedFingerprintRef = useRef<string | null>(null);
  const [rows, setRows] = useState<FillNARow[]>(() => [createEmptyRow(0)]);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  const dataframeMetadata = useMemo(() => {
    return getConnectedInputMetadata('df') as DataFrameMetadata | null;
  }, [getConnectedInputMetadata]);

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  const columnNames = useMemo(() => {
    return new Set(columns.map(column => column.name));
  }, [columns]);

  const selectedColumns = useMemo(() => {
    return new Set(
      rows
        .map(row => row.column.trim())
        .filter((column): column is string => column.length > 0)
    );
  }, [rows]);

  useEffect(() => {
    const fillValues = localInputData.fill_values ?? {};
    const incomingFingerprint = getFingerprint(fillValues);

    if (incomingFingerprint === lastSerializedFingerprintRef.current) {
      return;
    }

    const entries = Object.entries(fillValues).filter(
      (entry): entry is [string, FillNAStrategy] => {
        return Boolean(entry[0]) && STRATEGY_VALUES.has(entry[1]);
      }
    );

    if (entries.length === 0) {
      setRows([createEmptyRow(0)]);
      nextRowIdRef.current = 1;
      return;
    }

    setRows(
      entries.map(([column, strategy], index) => ({
        id: index,
        column,
        strategy,
      }))
    );
    nextRowIdRef.current = entries.length;
  }, [localInputData.fill_values]);

  const commitRows = useCallback(
    (nextRows: FillNARow[]) => {
      const nextFillValues = serializeRows(nextRows);
      lastSerializedFingerprintRef.current = getFingerprint(nextFillValues);
      setLocalInputData(prev => ({
        ...prev,
        fill_values: nextFillValues,
      }));
      setValidationMessages([]);
    },
    [setLocalInputData]
  );

  const updateRows = useCallback(
    (updater: (currentRows: FillNARow[]) => FillNARow[]) => {
      const nextRows = updater(rows);
      setRows(nextRows);
      commitRows(nextRows);
    },
    [commitRows, rows]
  );

  const handleAddRow = () => {
    updateRows(currentRows => [
      ...currentRows,
      createEmptyRow(nextRowIdRef.current++),
    ]);
  };

  const handleRemoveRow = (rowId: number) => {
    updateRows(currentRows => {
      const nextRows = currentRows.filter(row => row.id !== rowId);
      return nextRows.length > 0 ? nextRows : [createEmptyRow(0)];
    });
  };

  const handleColumnChange = (rowId: number, column: string) => {
    updateRows(currentRows =>
      currentRows.map(row =>
        row.id === rowId
          ? {
              ...row,
              column,
            }
          : row
      )
    );
  };

  const handleStrategyChange = (rowId: number, strategy: string) => {
    updateRows(currentRows =>
      currentRows.map(row =>
        row.id === rowId
          ? {
              ...row,
              strategy: STRATEGY_VALUES.has(strategy as FillNAStrategy)
                ? (strategy as FillNAStrategy)
                : '',
            }
          : row
      )
    );
  };

  const validate = useCallback(() => {
    const nextMessages: string[] = [];

    if (!dataframeMetadata) {
      nextMessages.push('Подключите входной DataFrame к порту df.');
    }

    const activeRows = rows.filter(hasPartialRow);

    if (activeRows.length === 0) {
      nextMessages.push('Добавьте хотя бы одну колонку для заполнения.');
    }

    const seenColumns = new Set<string>();
    const duplicateColumns = new Set<string>();
    const missingColumns = new Set<string>();

    activeRows.forEach(row => {
      const column = row.column.trim();

      if (!column) {
        nextMessages.push('В каждой строке должна быть выбрана колонка.');
      } else if (seenColumns.has(column)) {
        duplicateColumns.add(column);
      } else {
        seenColumns.add(column);
      }

      if (column && dataframeMetadata && !columnNames.has(column)) {
        missingColumns.add(column);
      }

      if (!row.strategy) {
        nextMessages.push('Для каждой выбранной колонки укажите стратегию.');
      }
    });

    if (duplicateColumns.size > 0) {
      nextMessages.push(
        `Колонки не должны повторяться: ${Array.from(duplicateColumns).join(
          ', '
        )}.`
      );
    }

    if (missingColumns.size > 0) {
      nextMessages.push(
        `Колонки не найдены во входном DataFrame: ${Array.from(
          missingColumns
        ).join(', ')}.`
      );
    }

    const uniqueMessages = Array.from(new Set(nextMessages));
    setValidationMessages(uniqueMessages);
    return uniqueMessages.length === 0;
  }, [columnNames, dataframeMetadata, rows]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  if (!dataframeMetadata) {
    return (
      <Alert variant='info'>
        <AlertDescription>
          Подключите входной DataFrame к порту df, чтобы выбрать колонки для
          заполнения пропусков.
        </AlertDescription>
      </Alert>
    );
  }

  const isAddDisabled =
    columns.length === 0 || selectedColumns.size >= columns.length;

  return (
    <TooltipProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {validationMessages.length > 0 ? (
          <Alert variant='destructive'>
            <AlertDescription>
              <Box component='ul' sx={{ m: 0, pl: 2.5 }}>
                {validationMessages.map(message => (
                  <li key={message}>{message}</li>
                ))}
              </Box>
            </AlertDescription>
          </Alert>
        ) : null}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent='space-between'
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              Fill rules
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
              Каждая строка задаёт стратегию заполнения NA/Null для одной
              колонки.
            </Typography>
          </Box>

          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isAddDisabled}
            startIcon={<Plus size={16} />}
            onClick={handleAddRow}
          >
            Добавить колонку
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 1,
            minHeight: 0,
          }}
        >
          {rows.map((row, index) => {
            const column = row.column.trim();
            const isDuplicate =
              column !== '' &&
              rows.filter(currentRow => currentRow.column.trim() === column)
                .length > 1;
            const isMissing = column !== '' && !columnNames.has(column);

            return (
              <Box
                key={row.id}
                sx={theme => ({
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'minmax(0, 1fr) minmax(180px, 220px) 36px',
                  },
                  gap: 1.25,
                  alignItems: 'start',
                  py: 1,
                  borderBottom:
                    index === rows.length - 1
                      ? 'none'
                      : `1px solid ${theme.palette.divider}`,
                })}
              >
                <Field
                  label={index === 0 ? 'Колонка' : undefined}
                  error={
                    isDuplicate
                      ? 'Колонка уже добавлена'
                      : isMissing
                        ? 'Колонка отсутствует во входных данных'
                        : undefined
                  }
                >
                  <ColumnDropdownSelect
                    value={row.column}
                    columns={columns}
                    placeholder='Выберите колонку'
                    error={isDuplicate || isMissing}
                    onChange={value => handleColumnChange(row.id, value)}
                  />
                </Field>

                <Field label={index === 0 ? 'Стратегия' : undefined}>
                  <Select
                    value={row.strategy}
                    placeholder='Выберите стратегию'
                    options={STRATEGY_SELECT_OPTIONS}
                    onChange={value => handleStrategyChange(row.id, value)}
                  />
                  {row.strategy ? (
                    <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                      {
                        STRATEGY_OPTIONS.find(
                          option => option.value === row.strategy
                        )?.description
                      }
                    </Typography>
                  ) : null}
                </Field>

                <Tooltip title='Удалить строку'>
                  <Box sx={{ pt: index === 0 ? 3.5 : 0 }}>
                    <IconButton
                      type='button'
                      aria-label='Удалить строку'
                      variant='ghost'
                      size='sm'
                      disabled={
                        rows.length === 1 &&
                        row.column === '' &&
                        row.strategy === ''
                      }
                      onClick={() => handleRemoveRow(row.id)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Box>
    </TooltipProvider>
  );
};
