import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import { Alert, Box, Stack, Typography } from '@mui/material';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';

import { useNodeConnections } from '@/features/node/get-node-connections';
import {
  CLICKHOUSE_ENGINE_OPTIONS,
  hydrateTableCreateSpecDraft,
  serializeTableCreateSpecDraft,
  TableCreateSpecEditor,
} from '@/features/node/table-create-spec-editor';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';
import { requireDbConnectionId } from '@/entities/data/db-connection';
import { useDbCatalogTable } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type {
  Column,
  DataFrameMetadata,
  DbMetadata as DBMetadata,
  DbTable as DBTable,
  InputDefinitionModel,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import { SingleOptionDropdownSelect } from '@/shared/ui';

import {
  buildColumnMappingNameKey,
  buildColumnSelectorOptionsFromMapping,
  buildCreateSqlCacheKey,
  buildDbColumnsFromColumnMapping,
  buildExistingTableColumnDiff,
  buildRequestedColumnMappingDraft,
  buildResolveWriteColumnsRequest,
  buildResolveWriteColumnsTriggerKey,
  buildSelectedWriteTargetLabel,
  type CreationMode,
  type ExistingTableColumnDiffRow,
  type ExtensionState,
  findWriteTargetTable,
  getColumnResolutionValidationErrors,
  getDefaultSelectedColumnActions,
  getExistingTableResolutionValidationErrors,
  getLiteralStringValue,
  getSyncingColumnCount,
  getTypedSpecValidationErrors,
  hasConfiguredSelectorValue,
  normalizeTableCreateSpecForDialect,
  resolveCreationMode,
  serializeColumnMapping,
  summarizeExistingTableColumnDiff,
  supportsSchemas,
  type WriteDataFrameToDBValues,
} from '../../lib/helpers';
import {
  AdvancedPanel,
  AdvancedToggle,
  DDLPreviewBox,
  FieldBlock,
  FieldLabel,
  PreviewCode,
  PreviewHeader,
  PreviewTitle,
  TextActionButton,
  TextActionRow,
} from '../SchemaStrategyStep.styles';

import { BatchSettingsSection } from './sections/BatchSettingsSection';
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

const SCHEMA_STRATEGY_FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const ChevronIcon = ({ size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M4 6l4 4 4-4'
      stroke={color}
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const InfoIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <circle cx='8' cy='8' r='6' stroke={color} strokeWidth='1.2' />
    <path
      d='M8 7v3.2M8 5.2h.01'
      stroke={color}
      strokeWidth='1.4'
      strokeLinecap='round'
    />
  </svg>
);

const RefreshIconSvg = ({
  spinning,
  size = 12,
  color = 'currentColor',
}: {
  spinning?: boolean;
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 16 16'
    fill='none'
    style={{
      display: 'block',
      flexShrink: 0,
      color,
      animation: spinning
        ? 'writeSettingsRefreshSpin 0.9s linear infinite'
        : 'none',
    }}
  >
    <path
      d='M13 7.5A5 5 0 103.8 10M3 12v-2.5h2.5'
      stroke={color}
      strokeWidth='1.4'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <style>
      {
        '@keyframes writeSettingsRefreshSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'
      }
    </style>
  </svg>
);

const CopyIconSvg = ({ size = 12, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 16 16'
    fill='none'
    style={{ display: 'block', flexShrink: 0 }}
  >
    <rect
      x='5'
      y='3.5'
      width='7.5'
      height='9'
      rx='1.5'
      stroke={color}
      strokeWidth='1.2'
    />
    <path
      d='M3.5 10.5V5A1.5 1.5 0 015 3.5h4'
      stroke={color}
      strokeWidth='1.2'
      strokeLinecap='round'
    />
  </svg>
);

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
  setSharedState,
  setValidationCallback,
  setValidationErrors,
  sharedState,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [isSqlCopied, setIsSqlCopied] = useState<'typed' | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const lastTypedInputsFingerprintRef = useRef<string | null>(null);
  const createSqlAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => createSqlAbortControllerRef.current?.abort(), []);

  const inputConnectionMetadata = useMemo(() => {
    return getConnectedInputMetadata('connection') as DBMetadata | null;
  }, [getConnectedInputMetadata]);

  const dataframeColumns = useMemo(() => {
    const metadata = getConnectedInputMetadata('df') as {
      columns?: Column[];
    } | null;
    return metadata?.columns ?? [];
  }, [getConnectedInputMetadata]);
  const inputDataframeMetadata = useMemo(() => {
    const metadata = getConnectedInputMetadata(
      'df'
    ) as DataFrameMetadata | null;
    return metadata;
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

  const selectedTargetLabel = useMemo(() => {
    return buildSelectedWriteTargetLabel(localInputData);
  }, [localInputData]);
  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);
  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);
  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);
  const lazySelectedTable = useDbCatalogTable(
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    { enabled: sharedState?.isTableNew !== true }
  );
  const selectedTable: DBTable | null = useMemo(() => {
    const embedded = findWriteTargetTable(
      inputConnectionMetadata,
      localInputData
    );
    if (embedded || !lazySelectedTable.item) {
      return embedded;
    }
    return {
      name: lazySelectedTable.item.name,
      type: lazySelectedTable.item.kind === 'view' ? 'VIEW' : 'BASE_TABLE',
      database_name: lazySelectedTable.item.databaseName,
      schema_name: lazySelectedTable.item.schemaName,
      columns: lazySelectedTable.item.columns.map(column => ({
        name: column.name,
        dtype: column.dtype as any,
        nullable: column.nullable,
        index: column.indexed,
        primary_key: column.primaryKey,
        indexes: column.indexes,
      })),
    };
  }, [inputConnectionMetadata, lazySelectedTable.item, localInputData]);
  const inferredIsTableNew = Boolean(literalTableName && !selectedTable);
  const isTableNew = sharedState?.isTableNew ?? inferredIsTableNew;
  const selectedCreationMode = useMemo(() => {
    return resolveCreationMode(sharedState, localInputData);
  }, [localInputData, sharedState]);

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

  const selectedTableColumns = useMemo(() => {
    return selectedTable?.columns ?? [];
  }, [selectedTable]);

  const requestedMapping = useMemo(() => {
    return buildRequestedColumnMappingDraft({
      dataframeMetadata: inputDataframeMetadata,
      existingMapping: localInputData?.column_mapping,
      existingDraft: sharedState?.requestedColumnMappingDraft,
    });
  }, [
    inputDataframeMetadata,
    localInputData?.column_mapping,
    sharedState?.requestedColumnMappingDraft,
  ]);
  const hasEmptyTargetName = requestedMapping.some(
    item => !item.target_name.trim()
  );
  const hasSyncingColumns =
    getSyncingColumnCount(sharedState?.columnResolveStates) > 0;
  const resolveWriteColumnsRequest = useMemo(() => {
    if (hasEmptyTargetName || hasSyncingColumns) {
      return null;
    }

    return buildResolveWriteColumnsRequest({
      connectionMetadata: inputConnectionMetadata,
      dataframeMetadata: inputDataframeMetadata,
      inputValues: localInputData,
      isTableNew,
      creationMode: 'raw',
      requestedMapping,
    });
  }, [
    hasEmptyTargetName,
    hasSyncingColumns,
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    localInputData,
    requestedMapping,
  ]);
  const resolveWriteColumnsKey = useMemo(() => {
    return buildResolveWriteColumnsTriggerKey(resolveWriteColumnsRequest);
  }, [resolveWriteColumnsRequest]);

  useEffect(() => {
    if (!isOpen || isTableNew) {
      return;
    }

    const currentFingerprint = buildColumnMappingNameKey(
      sharedState?.requestedColumnMappingDraft ?? null
    );
    const nextFingerprint = buildColumnMappingNameKey(requestedMapping);

    if (currentFingerprint === nextFingerprint) {
      return;
    }

    setSharedState(prev => ({
      ...(prev ?? {}),
      requestedColumnMappingDraft: serializeColumnMapping(requestedMapping),
    }));
  }, [
    isOpen,
    isTableNew,
    requestedMapping,
    setSharedState,
    sharedState?.requestedColumnMappingDraft,
  ]);

  useEffect(() => {
    if (
      !isOpen ||
      isTableNew ||
      !selectedTable ||
      !resolveWriteColumnsRequest ||
      !resolveWriteColumnsKey
    ) {
      return;
    }

    if (
      sharedState?.lastResolveColumnsKey === resolveWriteColumnsKey &&
      sharedState?.resolvedColumnRows
    ) {
      return;
    }

    let cancelled = false;
    let abortController: AbortController | null = null;
    const timeout = window.setTimeout(() => {
      abortController = new AbortController();
      setSharedState(prev => ({
        ...(prev ?? {}),
        isResolvingColumns: true,
        resolveColumnsError: null,
      }));

      void client.utils.ddl.resolveWriteColumns
        .post(
          {
            body: resolveWriteColumnsRequest,
          },
          { silent: true, signal: abortController.signal }
        )
        .then(response => {
          if (cancelled) {
            return;
          }

          const effectiveMapping = serializeColumnMapping(
            (response.data.effective_column_mapping ?? []).map(item => ({
              source_name: item.source_name,
              target_name: item.target_name,
              dtype: item.dtype ?? 'UNKNOWN',
              nullable: item.nullable ?? null,
            }))
          );

          setSharedState(prev => ({
            ...(prev ?? {}),
            isResolvingColumns: false,
            resolveColumnsError: null,
            lastResolveColumnsKey: resolveWriteColumnsKey,
            resolvedColumnRows: response.data.columns ?? [],
            resolvedDiagnostics: response.data.diagnostics ?? [],
            selectedColumnActions: getDefaultSelectedColumnActions(
              response.data.columns
            ),
          }));

          setLocalInputData(prev => ({
            ...(prev ?? {}),
            column_mapping: effectiveMapping,
          }));
        })
        .catch(error => {
          if (cancelled) {
            return;
          }

          setSharedState(prev => ({
            ...(prev ?? {}),
            isResolvingColumns: false,
            resolveColumnsError:
              error instanceof Error && error.message.trim()
                ? error.message
                : 'Не удалось разрешить имена колонок через backend.',
            lastResolveColumnsKey: resolveWriteColumnsKey,
          }));
        });
    }, 250);

    return () => {
      cancelled = true;
      abortController?.abort();
      window.clearTimeout(timeout);
    };
  }, [
    isOpen,
    isTableNew,
    resolveWriteColumnsKey,
    resolveWriteColumnsRequest,
    selectedTable,
    setLocalInputData,
    setSharedState,
    sharedState?.lastResolveColumnsKey,
    sharedState?.resolvedColumnRows,
  ]);

  const columnDiff = useMemo<ExistingTableColumnDiffRow[]>(() => {
    return buildExistingTableColumnDiff({
      dataframeMetadata: inputDataframeMetadata,
      requestedMapping,
      resolvedColumnRows: sharedState?.resolvedColumnRows,
      resolvedDiagnostics: sharedState?.resolvedDiagnostics,
    });
  }, [
    inputDataframeMetadata,
    requestedMapping,
    sharedState?.resolvedColumnRows,
    sharedState?.resolvedDiagnostics,
  ]);

  const diffSummary = useMemo(() => {
    return summarizeExistingTableColumnDiff({
      columnDiff,
      dataframeColumnCount: dataframeColumns.length,
      dbColumnCount: selectedTableColumns.length,
    });
  }, [columnDiff, dataframeColumns.length, selectedTableColumns.length]);

  const typedMapping = useMemo(() => {
    return (
      serializeColumnMapping(localInputData?.column_mapping) ?? requestedMapping
    );
  }, [localInputData?.column_mapping, requestedMapping]);
  const typedColumnOptions = useMemo(() => {
    return buildColumnSelectorOptionsFromMapping(typedMapping);
  }, [typedMapping]);
  const normalizedTypedSpecForDialect = useMemo(() => {
    return normalizeTableCreateSpecForDialect({
      connectionMetadata: inputConnectionMetadata,
      value: localInputData?.table_create_spec ?? null,
      allowedColumnNames: typedMapping.map(item => item.target_name),
    });
  }, [
    inputConnectionMetadata,
    localInputData?.table_create_spec,
    typedMapping,
  ]);
  const tableCreateSpecDraft = useMemo(() => {
    return hydrateTableCreateSpecDraft(
      localInputData?.table_create_spec ?? null
    );
  }, [localInputData?.table_create_spec]);
  const clickhouseEngineOptions = useMemo(() => {
    return CLICKHOUSE_ENGINE_OPTIONS.map(option => ({
      value: option,
      label: option,
    }));
  }, []);
  const typedSpecErrors = useMemo(() => {
    if (!isTableNew || selectedCreationMode !== 'typed') {
      return [] as string[];
    }

    return getTypedSpecValidationErrors({
      connectionMetadata: inputConnectionMetadata,
      mapping: typedMapping,
      tableCreateSpec: localInputData?.table_create_spec ?? null,
      upsertKeyColumn: localInputData?.upsert_config?.key_column ?? null,
      requireUpsertKey:
        (localInputData?.write_mode ?? '').toLowerCase() === 'upsert',
    });
  }, [
    inputConnectionMetadata,
    isTableNew,
    localInputData?.table_create_spec,
    localInputData?.upsert_config?.key_column,
    localInputData?.write_mode,
    selectedCreationMode,
    typedMapping,
  ]);
  const typedResolutionErrors = useMemo(() => {
    if (!isTableNew || selectedCreationMode !== 'typed') {
      return [] as string[];
    }

    return getColumnResolutionValidationErrors({
      rows: sharedState?.resolvedColumnRows,
      diagnostics: sharedState?.resolvedDiagnostics,
    });
  }, [
    isTableNew,
    selectedCreationMode,
    sharedState?.resolvedColumnRows,
    sharedState?.resolvedDiagnostics,
  ]);
  const typedPreviewSql = sharedState?.typedPreviewSql ?? '';
  const sqlErrorMessage = (sharedState?.createSqlError ?? '').trim();
  const canFetchTypedPreviewSql = Boolean(
    selectedCreationMode === 'typed' &&
    isTableNew &&
    literalTableName &&
    inputConnectionMetadata &&
    inputDataframeMetadata &&
    typedSpecErrors.length === 0 &&
    typedResolutionErrors.length === 0 &&
    !sharedState?.isResolvingColumns
  );

  useEffect(() => {
    if (!isOpen || !isTableNew || selectedCreationMode !== 'typed') {
      lastTypedInputsFingerprintRef.current = null;
      return;
    }

    const nextFingerprint = JSON.stringify({
      table: literalTableName,
      database: literalDatabaseName,
      schema: literalSchemaName,
      mapping: typedMapping,
      spec: normalizedTypedSpecForDialect,
    });

    if (lastTypedInputsFingerprintRef.current === nextFingerprint) {
      return;
    }

    lastTypedInputsFingerprintRef.current = nextFingerprint;
    setSharedState(prev => ({
      ...(prev ?? {}),
      typedPreviewSql: null,
      lastCreateSqlKey: null,
      createSqlError: null,
      createTableError: null,
      createTableSuccess: null,
      createTableSuccessAt: null,
      lastCreateTableKey: null,
    }));
  }, [
    inputConnectionMetadata,
    inputDataframeMetadata,
    isOpen,
    isTableNew,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    normalizedTypedSpecForDialect,
    selectedCreationMode,
    setSharedState,
    typedMapping,
  ]);

  const patchTableCreateSpec = useCallback(
    (
      updater: (
        draft: ReturnType<typeof hydrateTableCreateSpecDraft>
      ) => ReturnType<typeof hydrateTableCreateSpecDraft>
    ) => {
      setLocalInputData(prev => {
        const currentDraft = hydrateTableCreateSpecDraft(
          prev?.table_create_spec ?? null
        );
        const nextDraft = updater(currentDraft);
        return {
          ...(prev ?? {}),
          table_create_spec: serializeTableCreateSpecDraft(nextDraft),
        };
      });
      setSharedState(prev => ({
        ...(prev ?? {}),
        createTableError: null,
        createTableSuccess: null,
        createTableSuccessAt: null,
        isCreateTableLoading: false,
        lastCreateTableKey: null,
      }));
    },
    [setLocalInputData, setSharedState]
  );

  const copySql = useCallback(async (sql: string) => {
    if (!sql.trim()) {
      return;
    }

    await navigator.clipboard.writeText(sql);
    setIsSqlCopied('typed');
    window.setTimeout(() => {
      setIsSqlCopied(current => (current === 'typed' ? null : current));
    }, 1400);
  }, []);

  const fetchCreateTableSql = useCallback(
    async (mode: CreationMode, forceRefresh = false) => {
      if (
        !literalTableName ||
        !inputConnectionMetadata ||
        !inputDataframeMetadata
      ) {
        return;
      }

      const requestKey = buildCreateSqlCacheKey({
        connectionMetadata: inputConnectionMetadata,
        dataframeMetadata: inputDataframeMetadata,
        inputValues: {
          ...(localInputData ?? {}),
          column_mapping: mode === 'typed' ? typedMapping : null,
          table_create_spec:
            mode === 'typed' ? normalizedTypedSpecForDialect : null,
        },
        mode,
      });

      if (
        !forceRefresh &&
        sharedState?.lastCreateSqlKey === requestKey &&
        typedPreviewSql.trim()
      ) {
        return;
      }

      setSharedState(prev => ({
        ...(prev ?? {}),
        isCreateSqlLoading: true,
        createSqlError: null,
        createTableError: null,
        createTableSuccess: null,
      }));

      createSqlAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      createSqlAbortControllerRef.current = abortController;

      try {
        const response = await client.utils.ddl.generateTableDdl.post(
          {
            body: {
              connection_id: requireDbConnectionId(inputConnectionMetadata),
              table_name: literalTableName,
              database_name: literalDatabaseName,
              schema_name: literalSchemaName,
              columns: buildDbColumnsFromColumnMapping({
                dataframeMetadata: inputDataframeMetadata,
                mapping: typedMapping,
              }),
              table_create_spec:
                mode === 'typed'
                  ? (normalizedTypedSpecForDialect as any)
                  : null,
            },
          },
          { silent: true, signal: abortController.signal }
        );

        if (createSqlAbortControllerRef.current !== abortController) {
          return;
        }

        setSharedState(prev => ({
          ...(prev ?? {}),
          typedPreviewSql: response.data.sql,
          isCreateSqlLoading: false,
          createSqlError: null,
          lastCreateSqlKey: requestKey,
        }));
      } catch (error: unknown) {
        if (abortController.signal.aborted) {
          return;
        }
        setSharedState(prev => ({
          ...(prev ?? {}),
          isCreateSqlLoading: false,
          createSqlError:
            error instanceof Error && error.message.trim()
              ? error.message
              : 'Не удалось получить SQL для создания таблицы.',
          lastCreateSqlKey: requestKey,
        }));
      } finally {
        if (createSqlAbortControllerRef.current === abortController) {
          createSqlAbortControllerRef.current = null;
        }
      }
    },
    [
      inputConnectionMetadata,
      inputDataframeMetadata,
      literalDatabaseName,
      literalSchemaName,
      literalTableName,
      localInputData,
      normalizedTypedSpecForDialect,
      setSharedState,
      sharedState?.lastCreateSqlKey,
      typedMapping,
      typedPreviewSql,
    ]
  );

  const runValidation = useCallback(async (): Promise<boolean> => {
    const errors: Record<string, string[]> = {};
    const writeMode = (localInputData?.write_mode ?? '').toLowerCase();

    if (!hasConfiguredSelectorValue(localInputData?.table_name)) {
      errors['table'] = ['Не выбрана таблица для записи.'];
    }

    if (
      isSchemaRequired &&
      !hasConfiguredSelectorValue(localInputData?.schema_name)
    ) {
      errors['schema_name'] = ['Не выбрана или не создана схема.'];
    }

    if (!writeMode) {
      errors['write_mode'] = ['Выберите режим записи.'];
    }

    if (
      writeMode === 'upsert' &&
      !localInputData?.upsert_config?.key_column?.trim()
    ) {
      errors['upsert_config'] = ['Укажите key column для upsert.'];
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

    if (isTableNew && selectedCreationMode === 'raw') {
      if (!(localInputData?.create_table_sql ?? '').trim()) {
        errors['create_table_sql'] = [
          'Укажите CREATE TABLE SQL на шаге «Настройка схемы».',
        ];
      }
    }

    if (isTableNew && selectedCreationMode === 'typed') {
      if (sharedState?.isResolvingColumns) {
        errors['column_resolution'] = [
          'Backend еще проверяет соответствие колонок. Дождитесь завершения.',
        ];
      }

      if (sharedState?.resolveColumnsError) {
        errors['column_resolution'] = [sharedState.resolveColumnsError];
      }

      if (typedSpecErrors.length > 0) {
        errors['table_create_spec'] = typedSpecErrors;
      }

      if (typedResolutionErrors.length > 0) {
        errors['column_resolution'] = typedResolutionErrors;
      }
    }

    if (!isTableNew) {
      if (sharedState?.isResolvingColumns) {
        errors['column_resolution'] = [
          'Backend еще проверяет соответствие колонок. Дождитесь завершения.',
        ];
      }

      if (sharedState?.resolveColumnsError) {
        errors['column_resolution'] = [sharedState.resolveColumnsError];
      }

      const resolutionErrors = getExistingTableResolutionValidationErrors({
        columnDiff,
        diagnostics: sharedState?.resolvedDiagnostics,
      });

      if (resolutionErrors.length > 0) {
        errors['column_resolution'] = resolutionErrors;
      }
    }

    if (sharedState?.isCreateTableLoading) {
      errors['create_table'] = ['Создание таблицы еще выполняется.'];
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
    isSchemaRequired,
    isTableNew,
    localInputData?.chunksize,
    localInputData?.create_table_sql,
    localInputData?.min_batch_rows,
    localInputData?.schema_name,
    localInputData?.table_name,
    localInputData?.upsert_config?.key_column,
    localInputData?.write_mode,
    minBatchRowsBounds.max,
    minBatchRowsBounds.min,
    selectedCreationMode,
    selectedTargetLabel,
    setValidationErrors,
    sharedState?.isCreateTableLoading,
    sharedState?.isResolvingColumns,
    sharedState?.resolveColumnsError,
    sharedState?.resolvedDiagnostics,
    typedResolutionErrors,
    typedSpecErrors,
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

  useEffect(() => {
    if (!setValidationErrors) return;

    const nextTypedSpecErrors = isOpen ? typedSpecErrors : [];
    setValidationErrors(previousErrors => {
      const currentTypedSpecErrors = previousErrors['table_create_spec'] ?? [];
      const errorsAreEqual =
        currentTypedSpecErrors.length === nextTypedSpecErrors.length &&
        currentTypedSpecErrors.every(
          (error, index) => error === nextTypedSpecErrors[index]
        );

      if (errorsAreEqual) {
        return previousErrors;
      }

      if (nextTypedSpecErrors.length > 0) {
        return {
          ...previousErrors,
          table_create_spec: nextTypedSpecErrors,
        };
      }

      const { table_create_spec: _typedSpecErrors, ...remainingErrors } =
        previousErrors;
      return remainingErrors;
    });
  }, [isOpen, setValidationErrors, typedSpecErrors]);

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

          {isTableNew && selectedCreationMode === 'raw' ? (
            <Alert severity='info' variant='outlined'>
              CREATE TABLE SQL задается на шаге «Настройка схемы». Здесь можно
              проверить batch-параметры и сохранить ноду.
            </Alert>
          ) : null}

          {isTableNew && selectedCreationMode === 'typed' ? (
            <Stack spacing={2.25}>
              {typedResolutionErrors.length > 0 ? (
                <Alert severity='error' variant='outlined'>
                  <Stack spacing={0.25}>
                    {typedResolutionErrors.map(error => (
                      <Typography key={error} variant='body2'>
                        {error}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
              ) : null}

              {sqlErrorMessage ? (
                <Alert severity='error' variant='outlined'>
                  {sqlErrorMessage}
                </Alert>
              ) : null}

              {isClickHouse ? (
                <FieldBlock>
                  <FieldLabel>Engine</FieldLabel>
                  <SingleOptionDropdownSelect
                    value={tableCreateSpecDraft.clickhouse.engineName}
                    onChange={(value: string) =>
                      patchTableCreateSpec(current => ({
                        ...current,
                        clickhouse: {
                          ...current.clickhouse,
                          engineName:
                            value as (typeof CLICKHOUSE_ENGINE_OPTIONS)[number],
                        },
                      }))
                    }
                    options={clickhouseEngineOptions}
                    searchable
                    textFieldSx={{
                      fontFamily: SCHEMA_STRATEGY_FONT_FAMILY,
                      '& .MuiTypography-root': {
                        fontFamily: SCHEMA_STRATEGY_FONT_FAMILY,
                      },
                    }}
                    optionTextSx={{
                      fontFamily: SCHEMA_STRATEGY_FONT_FAMILY,
                    }}
                  />
                </FieldBlock>
              ) : null}

              {isClickHouse ? (
                <>
                  <Box>
                    <FieldLabel>Order by</FieldLabel>
                    <ColumnDropdownSelect
                      multiple
                      allowNew
                      columns={typedColumnOptions}
                      value={tableCreateSpecDraft.clickhouse.orderBy}
                      onChange={(value: string[]) =>
                        patchTableCreateSpec(current => ({
                          ...current,
                          clickhouse: {
                            ...current.clickhouse,
                            orderBy: value,
                          },
                        }))
                      }
                      placeholder='Добавьте колонку в order_by...'
                    />
                  </Box>

                  <Box>
                    <FieldLabel>Partition by</FieldLabel>
                    <ColumnDropdownSelect
                      multiple
                      allowNew
                      columns={typedColumnOptions}
                      value={tableCreateSpecDraft.clickhouse.partitionBy}
                      onChange={(value: string[]) =>
                        patchTableCreateSpec(current => ({
                          ...current,
                          clickhouse: {
                            ...current.clickhouse,
                            partitionBy: value,
                          },
                        }))
                      }
                      placeholder='Добавьте колонку в partition_by...'
                    />
                  </Box>

                  <Box>
                    <FieldLabel>Primary key</FieldLabel>
                    <ColumnDropdownSelect
                      multiple
                      allowNew
                      columns={typedColumnOptions}
                      value={tableCreateSpecDraft.clickhouse.primaryKey}
                      onChange={(value: string[]) =>
                        patchTableCreateSpec(current => ({
                          ...current,
                          clickhouse: {
                            ...current.clickhouse,
                            primaryKey: value,
                          },
                        }))
                      }
                      placeholder='Добавьте колонку в primary_key...'
                    />
                  </Box>
                </>
              ) : (
                <Box>
                  <FieldLabel>Primary key</FieldLabel>
                  <ColumnDropdownSelect
                    multiple
                    allowNew
                    columns={typedColumnOptions}
                    value={tableCreateSpecDraft.primaryKeyColumns}
                    onChange={(value: string[]) =>
                      patchTableCreateSpec(current => ({
                        ...current,
                        primaryKeyColumns: value,
                      }))
                    }
                    placeholder='Добавьте колонку в primary_key...'
                  />
                </Box>
              )}

              <PreviewHeader>
                <PreviewTitle>DDL preview</PreviewTitle>
                <TextActionRow>
                  <TextActionButton
                    type='button'
                    tone='primary'
                    onClick={() => void fetchCreateTableSql('typed', true)}
                    disabled={
                      !canFetchTypedPreviewSql ||
                      Boolean(sharedState?.isCreateSqlLoading)
                    }
                  >
                    <RefreshIconSvg
                      spinning={Boolean(sharedState?.isCreateSqlLoading)}
                    />
                    Сгенерировать
                  </TextActionButton>
                  <TextActionButton
                    type='button'
                    onClick={() => void copySql(typedPreviewSql)}
                    disabled={!typedPreviewSql.trim()}
                  >
                    <CopyIconSvg />
                    {isSqlCopied === 'typed' ? 'Скопировано' : 'Копировать'}
                  </TextActionButton>
                </TextActionRow>
              </PreviewHeader>

              <DDLPreviewBox>
                <InfoIcon color='#4f46e5' />
                {typedPreviewSql.trim() ? (
                  <PreviewCode>{typedPreviewSql}</PreviewCode>
                ) : (
                  <span>
                    Нажмите «Сгенерировать», чтобы получить preview DDL.
                  </span>
                )}
              </DDLPreviewBox>

              <AdvancedPanel>
                <AdvancedToggle
                  type='button'
                  onClick={() => setShowAdvancedOptions(current => !current)}
                  sx={{
                    color: showAdvancedOptions
                      ? 'primary.main'
                      : 'text.secondary',
                  }}
                >
                  Дополнительные параметры
                  <Box
                    component='span'
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'inherit',
                      transform: showAdvancedOptions
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                      transition: 'transform 150ms ease',
                    }}
                  >
                    <ChevronIcon />
                  </Box>
                </AdvancedToggle>

                {showAdvancedOptions ? (
                  <Box sx={{ mt: 1.5 }}>
                    <TableCreateSpecEditor
                      columns={typedColumnOptions}
                      isClickHouse={isClickHouse}
                      showPrimaryKeySection={false}
                      showClickHouseCoreSection={false}
                      value={localInputData?.table_create_spec ?? null}
                      onChange={value => {
                        setLocalInputData(prev => ({
                          ...(prev ?? {}),
                          table_create_spec: value,
                        }));
                        setSharedState(prev => ({
                          ...(prev ?? {}),
                          createTableError: null,
                          createTableSuccess: null,
                          createTableSuccessAt: null,
                          isCreateTableLoading: false,
                          lastCreateTableKey: null,
                        }));
                      }}
                    />
                  </Box>
                ) : null}
              </AdvancedPanel>
            </Stack>
          ) : null}
        </SettingsContent>
      </StepCard>
    </Box>
  );
};
