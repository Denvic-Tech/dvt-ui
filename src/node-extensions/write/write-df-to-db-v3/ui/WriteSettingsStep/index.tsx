import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import { Box } from '@mui/material';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';

import { useNodeConnections } from '@/features/node/get-node-connections';

import type {
  Column,
  DbMetadata as DBMetadata,
  DbTable as DBTable,
  InputDefinitionModel,
} from '@/shared/gatewayClient';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { isSafeCast, normalizeType } from '@/helpers/dtypes';

import {
  buildSelectedWriteTargetLabel,
  type ExtensionState,
  findWriteTargetTable,
  getLiteralStringValue,
  hasConfiguredSelectorValue,
  normalizeName,
  supportsSchemas,
  type WriteDataFrameToDBValues,
} from '../../lib/helpers';

import { BatchSettingsSection } from './sections/BatchSettingsSection';
import { MappingValidationSection } from './sections/MappingValidationSection';
import { StatusAlertsSection } from './sections/StatusAlertsSection';
import {
  HeaderBadge,
  HeaderBadges,
  HeaderIcon,
  HeaderLeft,
  HeaderTitle,
  SettingsContent,
  SettingsHeader,
  StepCard,
} from './index.styles';

type ColumnDiffRow = {
  dfName: string | null;
  dfType: string | null;
  dbName: string | null;
  dbType: string | null;
  status:
    | 'match'
    | 'soft_cast'
    | 'missing_in_db'
    | 'missing_in_df'
    | 'type_mismatch';
};

const toOptionalInt = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
};

export const WriteSettingsStep: React.FC<
  NodeModalStepperExtensionProps<WriteDataFrameToDBValues, ExtensionState>
> = ({
  isOpen,
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
  sharedState,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { confirm } = useConfirmDialog();

  const [useMappingValidation, setUseMappingValidation] = useState(false);

  const inputConnectionMetadata = useMemo(() => {
    return getConnectedInputMetadata('connection') as DBMetadata | null;
  }, [getConnectedInputMetadata]);

  const dataframeColumns = useMemo(() => {
    const metadata = getConnectedInputMetadata('df') as {
      columns?: Column[];
    } | null;
    return metadata?.columns ?? [];
  }, [getConnectedInputMetadata]);

  const isClickHouse =
    inputConnectionMetadata?.dialect?.toLowerCase() === 'clickhouse';
  const isSchemaRequired = supportsSchemas(inputConnectionMetadata);

  const getInputDefinition = useCallback(
    (attrName: string): InputDefinitionModel | undefined => {
      const inputDefinitions = nodeDefinition.input_definitions ?? {};
      return (
        inputDefinitions[attrName] ??
        Object.values(inputDefinitions).find(
          inputDefinition => inputDefinition.attr_name === attrName
        )
      );
    },
    [nodeDefinition.input_definitions]
  );

  const chunkSizeInputDef = useMemo(() => {
    return getInputDefinition('chunksize');
  }, [getInputDefinition]);

  const minBatchRowsInputDef = useMemo(() => {
    return getInputDefinition('min_batch_rows');
  }, [getInputDefinition]);

  const parseBounds = useCallback(
    (
      inputDef:
        | Pick<InputDefinitionModel, 'min_value' | 'max_value' | 'default'>
        | undefined,
      defaults: { min: number; max: number; def: number }
    ) => {
      const toNum = (value: unknown): number | undefined => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = Number.parseInt(value, 10);
          return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
      };

      const min = toNum(inputDef?.min_value) ?? defaults.min;
      const max = toNum(inputDef?.max_value) ?? defaults.max;
      let def = toNum(inputDef?.default) ?? defaults.def;
      if (def < min) def = min;
      if (def > max) def = max;
      return { min, max, def };
    },
    []
  );

  const chunkSizeBounds = useMemo(() => {
    return parseBounds(chunkSizeInputDef, {
      min: 1,
      max: 1_000_000,
      def: 1000,
    });
  }, [chunkSizeInputDef, parseBounds]);

  const minBatchRowsBounds = useMemo(() => {
    return parseBounds(minBatchRowsInputDef, {
      min: 1,
      max: 100_000,
      def: 5000,
    });
  }, [minBatchRowsInputDef, parseBounds]);

  useEffect(() => {
    if (!isOpen) return;

    setLocalInputData(prev => {
      if (prev?.chunksize !== undefined) {
        return prev;
      }
      return {
        ...(prev ?? {}),
        chunksize: chunkSizeBounds.def,
      };
    });
  }, [chunkSizeBounds.def, isOpen, setLocalInputData]);

  useEffect(() => {
    if (!isOpen) return;

    setLocalInputData(prev => {
      if (prev?.min_batch_rows !== undefined) {
        return prev;
      }
      return {
        ...(prev ?? {}),
        min_batch_rows: minBatchRowsBounds.def,
      };
    });
  }, [isOpen, minBatchRowsBounds.def, setLocalInputData]);

  useEffect(() => {
    if (!isOpen || !isClickHouse) return;
    setLocalInputData(prev => {
      if (
        prev?.use_clickhouse_connect_driver === undefined ||
        prev?.use_clickhouse_connect_driver === null
      ) {
        return {
          ...(prev ?? {}),
          use_clickhouse_connect_driver: true,
        };
      }
      return prev;
    });
  }, [isClickHouse, isOpen, setLocalInputData]);

  const selectedTable: DBTable | null = useMemo(() => {
    return findWriteTargetTable(inputConnectionMetadata, localInputData);
  }, [inputConnectionMetadata, localInputData]);

  const inferredIsTableNew = Boolean(
    getLiteralStringValue(localInputData?.table_name) && !selectedTable
  );
  const isTableNew = sharedState?.isTableNew ?? inferredIsTableNew;

  const selectedTargetLabel = useMemo(() => {
    return buildSelectedWriteTargetLabel(localInputData);
  }, [localInputData]);

  const handleChunkSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = toOptionalInt(event.target.value);
      if (parsed === null) {
        setLocalInputData(prev => ({
          ...(prev ?? {}),
          chunksize: null,
        }));
        return;
      }

      const clamped = Math.min(
        Math.max(parsed, chunkSizeBounds.min),
        chunkSizeBounds.max
      );
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        chunksize: clamped,
      }));
    },
    [chunkSizeBounds.max, chunkSizeBounds.min, setLocalInputData]
  );

  const handleMinBatchRowsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = toOptionalInt(event.target.value);
      if (parsed === null) {
        setLocalInputData(prev => ({
          ...(prev ?? {}),
          min_batch_rows: null,
        }));
        return;
      }

      const clamped = Math.min(
        Math.max(parsed, minBatchRowsBounds.min),
        minBatchRowsBounds.max
      );
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        min_batch_rows: clamped,
      }));
    },
    [minBatchRowsBounds.max, minBatchRowsBounds.min, setLocalInputData]
  );

  useEffect(() => {
    setLocalInputData(prev => {
      if (prev?.chunksize == null || !Number.isFinite(prev.chunksize)) {
        return prev;
      }
      const clamped = Math.min(
        Math.max(prev.chunksize, chunkSizeBounds.min),
        chunkSizeBounds.max
      );
      if (clamped === prev.chunksize) return prev;
      return {
        ...(prev ?? {}),
        chunksize: clamped,
      };
    });
  }, [chunkSizeBounds.max, chunkSizeBounds.min, setLocalInputData]);

  useEffect(() => {
    setLocalInputData(prev => {
      if (
        prev?.min_batch_rows == null ||
        !Number.isFinite(prev.min_batch_rows)
      ) {
        return prev;
      }
      const clamped = Math.min(
        Math.max(prev.min_batch_rows, minBatchRowsBounds.min),
        minBatchRowsBounds.max
      );
      if (clamped === prev.min_batch_rows) return prev;
      return {
        ...(prev ?? {}),
        min_batch_rows: clamped,
      };
    });
  }, [minBatchRowsBounds.max, minBatchRowsBounds.min, setLocalInputData]);

  const selectedTableColumns = selectedTable?.columns ?? [];

  const columnDiff = useMemo<ColumnDiffRow[]>(() => {
    const dbByName = new Map<string, { name: string; dtype: string | null }>();

    for (const column of selectedTableColumns) {
      dbByName.set(normalizeName(column.name), {
        name: column.name,
        dtype: column.dtype ?? null,
      });
    }

    const usedDbNames = new Set<string>();
    const rows: ColumnDiffRow[] = [];

    for (const dataframeColumn of dataframeColumns) {
      const normalizedName = normalizeName(dataframeColumn.name);
      const dbColumn = dbByName.get(normalizedName);

      if (!dbColumn) {
        rows.push({
          dfName: dataframeColumn.name,
          dfType: dataframeColumn.dtype ?? null,
          dbName: null,
          dbType: null,
          status: 'missing_in_db',
        });
        continue;
      }

      usedDbNames.add(normalizedName);

      const dfType = normalizeType(dataframeColumn.dtype ?? null);
      const dbType = normalizeType(dbColumn.dtype ?? null);

      const status: ColumnDiffRow['status'] =
        dfType === dbType
          ? 'match'
          : isSafeCast(dfType, dbType)
            ? 'soft_cast'
            : 'type_mismatch';

      rows.push({
        dfName: dataframeColumn.name,
        dfType: dataframeColumn.dtype ?? null,
        dbName: dbColumn.name,
        dbType: dbColumn.dtype ?? null,
        status,
      });
    }

    for (const [name, dbColumn] of dbByName.entries()) {
      if (usedDbNames.has(name)) continue;

      rows.push({
        dfName: null,
        dfType: null,
        dbName: dbColumn.name,
        dbType: dbColumn.dtype ?? null,
        status: 'missing_in_df',
      });
    }

    const order: Record<ColumnDiffRow['status'], number> = {
      missing_in_db: 0,
      missing_in_df: 1,
      type_mismatch: 2,
      soft_cast: 3,
      match: 4,
    };

    return rows.sort((left, right) => {
      if (order[left.status] !== order[right.status]) {
        return order[left.status] - order[right.status];
      }

      const leftName = normalizeName(left.dfName ?? left.dbName ?? '');
      const rightName = normalizeName(right.dfName ?? right.dbName ?? '');
      return leftName.localeCompare(rightName);
    });
  }, [dataframeColumns, selectedTableColumns]);

  const diffSummary = useMemo(() => {
    let missingInDb = 0;
    let missingInDf = 0;
    let typeMismatch = 0;
    let softCast = 0;
    let matches = 0;

    for (const row of columnDiff) {
      if (row.status === 'missing_in_db') missingInDb++;
      else if (row.status === 'missing_in_df') missingInDf++;
      else if (row.status === 'type_mismatch') typeMismatch++;
      else if (row.status === 'soft_cast') softCast++;
      else matches++;
    }

    const dfCount = dataframeColumns.length;
    const dbCount = selectedTableColumns.length;

    return {
      dfCount,
      dbCount,
      missingInDb,
      missingInDf,
      typeMismatch,
      softCast,
      matches,
      countDelta: dfCount - dbCount,
    };
  }, [columnDiff, dataframeColumns.length, selectedTableColumns.length]);

  const showDiffTable = !!selectedTable && !isTableNew;

  const onlySoftAndMatch =
    diffSummary.missingInDb === 0 &&
    diffSummary.missingInDf === 0 &&
    diffSummary.typeMismatch === 0;

  const runValidation = useCallback(async (): Promise<boolean> => {
    const errors: Record<string, string[]> = {};

    if (!hasConfiguredSelectorValue(localInputData?.table_name)) {
      errors['table'] = ['Не выбрана таблица для записи.'];
    }

    if (
      isSchemaRequired &&
      !hasConfiguredSelectorValue(localInputData?.schema_name)
    ) {
      errors['schema_name'] = ['Не выбрана или не создана схема.'];
    }

    const chunkSize = localInputData?.chunksize;
    if (chunkSize == null) {
      errors['chunksize'] = ['Chunk size не задан.'];
    } else if (!Number.isFinite(chunkSize)) {
      errors['chunksize'] = ['Chunk size имеет неверный формат.'];
    } else if (
      chunkSize < chunkSizeBounds.min ||
      chunkSize > chunkSizeBounds.max
    ) {
      errors['chunksize'] = [
        `Chunk size должен быть в диапазоне [${chunkSizeBounds.min}..${chunkSizeBounds.max}], текущее: ${chunkSize}.`,
      ];
    }

    const minBatchRows = localInputData?.min_batch_rows;
    if (minBatchRows != null) {
      if (!Number.isFinite(minBatchRows)) {
        errors['min_batch_rows'] = ['min_batch_rows имеет неверный формат.'];
      } else if (
        minBatchRows < minBatchRowsBounds.min ||
        minBatchRows > minBatchRowsBounds.max
      ) {
        errors['min_batch_rows'] = [
          `min_batch_rows должен быть в диапазоне [${minBatchRowsBounds.min}..${minBatchRowsBounds.max}], текущее: ${minBatchRows}.`,
        ];
      }
    }

    if (isTableNew) {
      if (sharedState?.isCreateTableLoading) {
        errors['create_table'] = ['Создание таблицы еще выполняется.'];
      } else if (sharedState?.createTableError) {
        errors['create_table'] = [
          'Не удалось создать таблицу. Вернитесь на предыдущий шаг, исправьте SQL и попробуйте снова.',
        ];
      } else if (!sharedState?.createTableSuccess) {
        errors['create_table'] = [
          'Таблица еще не создана. Вернитесь на предыдущий шаг и повторите переход.',
        ];
      }
    }

    if (!isTableNew && !localInputData?.write_mode) {
      errors['write_mode'] = ['Выберите режим записи.'];
    }

    if (!isTableNew && useMappingValidation) {
      const missingInDb = columnDiff.filter(
        row => row.status === 'missing_in_db'
      );
      const missingInDf = columnDiff.filter(
        row => row.status === 'missing_in_df'
      );
      const typeMismatch = columnDiff.filter(
        row => row.status === 'type_mismatch'
      );

      if (missingInDb.length > 0) {
        errors['missing_in_db'] = missingInDb.map(row => {
          return `В DF есть колонка "${row.dfName}" (${row.dfType ?? '—'}), которой нет в БД`;
        });
      }
      if (missingInDf.length > 0) {
        errors['missing_in_df'] = missingInDf.map(row => {
          return `В БД есть колонка "${row.dbName}" (${row.dbType ?? '—'}), которой нет в DF`;
        });
      }
      if (typeMismatch.length > 0) {
        errors['type_mismatch'] = typeMismatch.map(row => {
          return `Несовпадающий тип у "${row.dfName ?? row.dbName}": DF=${row.dfType ?? '—'} vs DB=${row.dbType ?? '—'}`;
        });
      }
    }

    const mode = (localInputData?.write_mode ?? '').toLowerCase();
    const needsConfirmation = !isTableNew && mode === 'truncate';
    if (needsConfirmation) {
      const tableName = selectedTargetLabel || 'выбранной таблицы';
      const confirmed = await confirm({
        title: 'Подтвердить TRUNCATE?',
        message: `Режим TRUNCATE выполнит TRUNCATE таблицы "${tableName}" и перезапишет данные.\nПродолжить?`,
        confirmLabel: 'Продолжить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
      });
      if (!confirmed) {
        return false;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors?.(errors);
      return false;
    }

    setValidationErrors?.({});
    return true;
  }, [
    chunkSizeBounds.max,
    chunkSizeBounds.min,
    columnDiff,
    confirm,
    dataframeColumns,
    isClickHouse,
    isSchemaRequired,
    isTableNew,
    localInputData?.chunksize,
    localInputData?.min_batch_rows,
    localInputData?.schema_name,
    localInputData?.table_name,
    localInputData?.write_mode,
    minBatchRowsBounds.max,
    minBatchRowsBounds.min,
    selectedTargetLabel,
    sharedState?.createTableError,
    sharedState?.createTableSuccess,
    sharedState?.isCreateTableLoading,
    setValidationErrors,
    useMappingValidation,
  ]);

  const validationCallbackRef = useRef(runValidation);

  useEffect(() => {
    validationCallbackRef.current = runValidation;
  }, [runValidation]);

  useEffect(() => {
    if (!setValidationCallback || !isOpen) return;
    setValidationCallback(() => {
      return () => validationCallbackRef.current();
    });
    setValidationErrors?.({});
  }, [isOpen, setValidationCallback, setValidationErrors]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        height: '100%',
        minHeight: 0,
      }}
    >
      <StepCard>
        <SettingsHeader>
          <HeaderLeft>
            <HeaderIcon>
              <TuneIcon />
            </HeaderIcon>
            <HeaderTitle>Настройки записи</HeaderTitle>
          </HeaderLeft>
          <HeaderBadges>
            {selectedTargetLabel ? (
              <HeaderBadge>Таблица: {selectedTargetLabel}</HeaderBadge>
            ) : null}
          </HeaderBadges>
        </SettingsHeader>

        <SettingsContent>
          <StatusAlertsSection
            createTableError={sharedState?.createTableError}
            isCreateTableLoading={Boolean(sharedState?.isCreateTableLoading)}
            isTableNew={isTableNew}
          />

          <BatchSettingsSection
            chunkSize={localInputData?.chunksize}
            chunkSizeBounds={chunkSizeBounds}
            minBatchRows={localInputData?.min_batch_rows}
            minBatchRowsBounds={minBatchRowsBounds}
            onChunkSizeChange={handleChunkSizeChange}
            onMinBatchRowsChange={handleMinBatchRowsChange}
          />

          {showDiffTable && (
            <MappingValidationSection
              columnDiff={columnDiff}
              diffSummary={diffSummary}
              onlySoftAndMatch={onlySoftAndMatch}
              useMappingValidation={useMappingValidation}
              onToggleUseMappingValidation={setUseMappingValidation}
            />
          )}
        </SettingsContent>
      </StepCard>
    </Box>
  );
};
