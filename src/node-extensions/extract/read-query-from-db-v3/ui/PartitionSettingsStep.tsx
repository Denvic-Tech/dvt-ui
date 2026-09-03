import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { type NodeModalStepperExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  type ColumnBaseType,
  MODE_OPTIONS,
  type PartitionGrouping,
  PartitionGroupingInput,
  validatePartitionGrouping,
} from '@/features/node/db-partitioning-grouping-input';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import type { Column } from '@/shared/gatewayClient';

import type { ExtensionState } from '../lib/types';

import type { DBQueryV3Values } from './QueryEditorStep';

type StepErrors = {
  partition_col?: string;
  partition_grouping?: string;
  npartitions?: string;
  max_rows_per_partition?: string;
};

const toOptionalInteger = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.floor(parsed);
};

const parseOptionalIntegerInput = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;

  return Math.floor(parsed);
};

const getBaseType = (dtype: string | null | undefined): ColumnBaseType => {
  if (!dtype) return 'UNKNOWN';

  const type = dtype.toUpperCase();

  if (type.includes('DATE') || type.includes('TIME')) return 'DATETIME';

  if (
    type.includes('STRING') ||
    type.includes('VARCHAR') ||
    type.includes('TEXT') ||
    type.includes('CHAR')
  ) {
    return 'STRING';
  }

  if (
    type.includes('FLOAT') ||
    type.includes('DOUBLE') ||
    type.includes('DECIMAL') ||
    type.includes('INT') ||
    type.includes('NUMERIC')
  ) {
    return 'NUMERIC';
  }

  if (type.includes('BOOL')) return 'BOOL';

  return 'UNKNOWN';
};

export const PartitionSettingsStep: React.FC<
  NodeModalStepperExtensionProps<DBQueryV3Values, ExtensionState>
> = ({
  localInputData,
  setLocalInputData,
  setValidationCallback,
  sharedState,
}) => {
  const [errors, setErrors] = useState<StepErrors>({});
  const [partitionGroupingErrors, setPartitionGroupingErrors] = useState<
    Record<string, string> | undefined
  >(undefined);

  const metadata = sharedState?.metadata ?? null;
  const metadataError = sharedState?.error ?? '';

  const columns = useMemo<Column[]>(() => metadata?.columns ?? [], [metadata]);

  const partitionCol = localInputData?.partition_col ?? '';

  const partitionColumnType = useMemo<ColumnBaseType>(() => {
    if (!partitionCol || columns.length === 0) return 'UNKNOWN';

    const partitionColumn = columns.find(
      column => column.name === partitionCol
    );
    return getBaseType(
      partitionColumn?.dtype ? String(partitionColumn.dtype) : null
    );
  }, [partitionCol, columns]);

  useEffect(() => {
    setLocalInputData(prev => {
      const base = (prev ?? {}) as DBQueryV3Values;

      if (!base.partition_grouping || partitionColumnType === 'UNKNOWN') {
        return prev;
      }

      const modeInfo = MODE_OPTIONS.find(
        option => option.value === base.partition_grouping?.mode
      );

      if (modeInfo && !modeInfo.compatibleTypes.includes(partitionColumnType)) {
        return { ...base, partition_grouping: undefined };
      }

      return prev;
    });
  }, [partitionColumnType, setLocalInputData]);

  const handlePartitionColumnChange = useCallback(
    (value: string) => {
      if (value === partitionCol) return;

      setLocalInputData(prev => {
        const base = (prev ?? {}) as DBQueryV3Values;

        if (value === '') {
          return {
            ...base,
            partition_col: undefined,
            partition_grouping: undefined,
            npartitions: undefined,
            max_rows_per_partition: undefined,
          };
        }

        return {
          ...base,
          partition_col: value,
        };
      });

      setErrors(prev => ({
        ...prev,
        partition_col: '',
        partition_grouping: '',
        npartitions: '',
        max_rows_per_partition: '',
      }));

      if (value === '') {
        setPartitionGroupingErrors(undefined);
      }
    },
    [partitionCol, setLocalInputData]
  );

  const handlePartitionGroupingChange = useCallback(
    (grouping: PartitionGrouping | null) => {
      const currentGrouping = localInputData?.partition_grouping ?? null;

      setErrors(prev => ({ ...prev, partition_grouping: '' }));
      setPartitionGroupingErrors(prevErrors => {
        if (!prevErrors) return prevErrors;
        if (!grouping || !currentGrouping) return undefined;
        if (currentGrouping.mode !== grouping.mode) return undefined;

        const nextErrors = { ...prevErrors };
        const keys = new Set([
          ...Object.keys(currentGrouping),
          ...Object.keys(grouping),
        ]);

        keys.forEach(key => {
          if (currentGrouping[key] !== grouping[key]) {
            delete nextErrors[key];
          }
        });

        return Object.keys(nextErrors).length > 0 ? nextErrors : undefined;
      });

      setLocalInputData(prev => {
        const base = (prev ?? {}) as DBQueryV3Values;

        if (grouping === null) {
          return { ...base, partition_grouping: undefined };
        }

        return { ...base, partition_grouping: grouping };
      });
    },
    [localInputData?.partition_grouping, setLocalInputData]
  );

  useEffect(() => {
    if (localInputData?.partition_grouping) return;

    setPartitionGroupingErrors(undefined);
    setErrors(prev =>
      prev.partition_grouping ? { ...prev, partition_grouping: '' } : prev
    );
  }, [localInputData?.partition_grouping]);

  const handleNPartitionsChange = useCallback(
    (value: string) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        npartitions: parseOptionalIntegerInput(value),
      }));

      setErrors(prev => ({ ...prev, npartitions: '' }));
    },
    [setLocalInputData]
  );

  const handleMaxRowsPerPartitionChange = useCallback(
    (value: string) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        max_rows_per_partition: parseOptionalIntegerInput(value),
      }));

      setErrors(prev => ({ ...prev, max_rows_per_partition: '' }));
    },
    [setLocalInputData]
  );

  useEffect(() => {
    setValidationCallback?.(() => {
      return () => {
        const nextErrors: StepErrors = {};

        if (!localInputData?.partition_col?.trim()) {
          nextErrors.partition_col =
            'partition_col обязателен для ReadQueryFromDBV3';
        }

        const npartitions = toOptionalInteger(localInputData?.npartitions);
        if (
          localInputData?.npartitions !== undefined &&
          localInputData?.npartitions !== null &&
          (!Number.isInteger(npartitions) || (npartitions ?? 0) < 1)
        ) {
          nextErrors.npartitions = 'npartitions должен быть целым числом >= 1';
        }

        const maxRowsPerPartition = toOptionalInteger(
          localInputData?.max_rows_per_partition
        );
        if (
          localInputData?.max_rows_per_partition !== undefined &&
          localInputData?.max_rows_per_partition !== null &&
          (!Number.isInteger(maxRowsPerPartition) ||
            (maxRowsPerPartition ?? 0) < 1)
        ) {
          nextErrors.max_rows_per_partition =
            'max_rows_per_partition должен быть целым числом >= 1';
        }

        const groupingValidation = validatePartitionGrouping(
          localInputData?.partition_grouping,
          partitionColumnType
        );

        if (!groupingValidation.isValid) {
          nextErrors.partition_grouping =
            groupingValidation.error ||
            'Invalid partition grouping configuration.';
          setPartitionGroupingErrors(groupingValidation.fieldErrors);
        } else {
          setPartitionGroupingErrors(undefined);
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
      };
    });
  }, [
    localInputData?.partition_col,
    localInputData?.partition_grouping,
    localInputData?.npartitions,
    localInputData?.max_rows_per_partition,
    partitionColumnType,
    setValidationCallback,
  ]);

  const hasColumns = columns.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack gap={2}>
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          flexWrap='wrap'
          gap={1}
        >
          <Stack direction='row' alignItems='center' gap={1}>
            <TuneIcon color='primary' fontSize='small' />
            <Typography variant='subtitle2' fontWeight={600}>
              Параметры сегментации
            </Typography>
          </Stack>
          {metadata && !metadataError && (
            <Chip
              size='small'
              icon={<CheckCircleIcon />}
              label='Метаданные получены'
              color='success'
              variant='outlined'
            />
          )}
        </Stack>

        <Typography variant='body2' color='text.secondary'>
          Для ReadQueryFromDBV3 поле partition_col обязательно. Поле
          partition_grouping опционально: если его не задать, стратегия будет
          выбрана автоматически.
        </Typography>

        <Divider />

        {metadataError && (
          <Alert severity='warning'>
            Метаданные не удалось получить: {metadataError}. При необходимости
            укажите partition_col вручную.
          </Alert>
        )}

        {!hasColumns && !metadataError && (
          <Alert severity='info'>
            Метаданные не содержат колонок. Укажите partition_col вручную.
          </Alert>
        )}

        <Stack gap={1.5}>
          <Typography variant='caption' fontWeight={500} color='text.secondary'>
            Partition column *
          </Typography>

          {hasColumns ? (
            <ColumnDropdownSelect
              value={partitionCol}
              onChange={handlePartitionColumnChange}
              columns={columns}
              placeholder='Выберите колонку...'
              testIds={{
                root: 'node-extensions/extract/read-query-from-db-v3/segmentation-column-root',
                trigger:
                  'node-extensions/extract/read-query-from-db-v3/segmentation-column-input',
                searchInput:
                  'node-extensions/extract/read-query-from-db-v3/segmentation-column-search-input',
                option: 'entities/data/dataframe/segmentation-column-option',
              }}
              error={!!errors.partition_col}
            />
          ) : (
            <TextField
              size='small'
              fullWidth
              value={partitionCol}
              onChange={event =>
                handlePartitionColumnChange(event.target.value)
              }
              placeholder='Введите имя колонки'
              slotProps={{
                htmlInput: {
                  'data-testid':
                    'node-extensions/extract/read-query-from-db-v3/segmentation-column-input',
                },
              }}
              error={!!errors.partition_col}
            />
          )}

          {errors.partition_col && (
            <Alert severity='error' sx={{ py: 0.5 }}>
              {errors.partition_col}
            </Alert>
          )}

          <Typography variant='caption' fontWeight={500} color='text.secondary'>
            Partition grouping (optional)
          </Typography>

          <PartitionGroupingInput
            value={localInputData?.partition_grouping}
            onChange={handlePartitionGroupingChange}
            columnType={partitionColumnType}
            disabled={!partitionCol}
            error={!!errors.partition_grouping}
            fieldErrors={partitionGroupingErrors}
          />

          {errors.partition_grouping && (
            <Alert severity='error' sx={{ py: 0.5 }}>
              {errors.partition_grouping}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
            <TextField
              size='small'
              type='number'
              fullWidth
              label='npartitions'
              value={localInputData?.npartitions ?? ''}
              onChange={event => handleNPartitionsChange(event.target.value)}
              disabled={!partitionCol}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={!!errors.npartitions}
              helperText={errors.npartitions}
            />

            <TextField
              size='small'
              type='number'
              fullWidth
              label='max_rows_per_partition'
              value={localInputData?.max_rows_per_partition ?? ''}
              onChange={event =>
                handleMaxRowsPerPartitionChange(event.target.value)
              }
              disabled={!partitionCol}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={!!errors.max_rows_per_partition}
              helperText={errors.max_rows_per_partition}
            />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};
