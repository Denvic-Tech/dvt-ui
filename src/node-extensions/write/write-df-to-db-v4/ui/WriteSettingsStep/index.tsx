import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';

import { useNodeConnections } from '@/features/node/get-node-connections';
import {
  hydrateTableCreateSpecDraft,
  serializeTableCreateSpecDraft,
} from '@/features/node/table-create-spec-editor';

import { requireDbConnectionId } from '@/entities/data/db-connection';
import { useDbCatalogTable } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type {
  DataFrameMetadata,
  DbMetadata as DBMetadata,
  DbTable as DBTable,
  InputDefinitionModel,
  TableCreateSpec,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import { dropdownBoundaryProps } from '@/shared/ui/clean-minimal/dropdownPlacement';

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
  supportsSchemas,
  type WriteDataFrameToDBValues,
} from '../../lib/helpers';
import { MessageBox, MessageList } from '../schema-step/SchemaStep.styles';

import {
  AdvancedSettingsSection,
  SyncDescriptionsSection,
} from './sections/BatchSettingsSection';
import { StatusAlertsSection } from './sections/StatusAlertsSection';
import { ColumnsSelect } from './ColumnsSelect';
import { DdlPreviewPane } from './DdlPreviewPane';
import { SettingLine } from './SettingLine';
import {
  SettingsBox,
  SettingsForm,
  SettingsFormInner,
  SettingsGroup,
  SettingsNote,
  SettingsRoot,
} from './settings.styles';
import { TableSpecSections } from './TableSpecSections';

const NO_COLUMN_OPTIONS: readonly string[] = [];
const INLINE_ERROR_KEYS = new Set(['rows_per_batch', 'table_create_spec']);
// Пауза после последней правки параметров перед автообновлением DDL.
const DDL_AUTO_REFRESH_DELAY_MS = 600;
const ignoreChange = () => undefined;

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [specDraftErrors, setSpecDraftErrors] = useState<string[]>([]);
  const [previewSql, setPreviewSql] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const initialPreviewRequested = useRef(false);
  const lastTypedInputsFingerprintRef = useRef<string | null>(null);
  const createSqlAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => createSqlAbortControllerRef.current?.abort(), []);

  const inputConnectionMetadata = useMemo(() => {
    return getConnectedInputMetadata('connection') as DBMetadata | null;
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

  // Пустое значение — бэкенд подбирает размер пакета сам, поэтому без default.
  const rowsPerBatchBounds = useMemo(() => {
    const inputDef = getInputDefinition('rows_per_batch');
    const toNum = (value: unknown): number | undefined => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };
    return {
      min: toNum(inputDef?.min_value) ?? 1,
      max: toNum(inputDef?.max_value) ?? 1_000_000,
    };
  }, [getInputDefinition]);

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
        comment: column.comment ?? null,
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

  const handleRowsPerBatchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = toOptionalInt(event.target.value);
      const rowsPerBatch =
        parsed === null
          ? null
          : Math.min(
              Math.max(parsed, rowsPerBatchBounds.min),
              rowsPerBatchBounds.max
            );
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        rows_per_batch: rowsPerBatch,
      }));
    },
    [rowsPerBatchBounds.max, rowsPerBatchBounds.min, setLocalInputData]
  );

  useEffect(() => {
    setLocalInputData(prev => {
      if (
        prev?.rows_per_batch == null ||
        !Number.isFinite(prev.rows_per_batch)
      ) {
        return prev;
      }
      const clamped = Math.min(
        Math.max(prev.rows_per_batch, rowsPerBatchBounds.min),
        rowsPerBatchBounds.max
      );
      if (clamped === prev.rows_per_batch) return prev;
      return {
        ...(prev ?? {}),
        rows_per_batch: clamped,
      };
    });
  }, [rowsPerBatchBounds.max, rowsPerBatchBounds.min, setLocalInputData]);

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
  const canFetchTypedPreviewSql = Boolean(
    isTableNew &&
    selectedCreationMode === 'typed' &&
    literalTableName &&
    inputConnectionMetadata &&
    inputDataframeMetadata &&
    typedSpecErrors.length === 0 &&
    typedResolutionErrors.length === 0 &&
    specDraftErrors.length === 0 &&
    !sharedState?.isResolvingColumns
  );
  // Ключ DDL для текущих параметров: совпадает с lastCreateSqlKey, когда
  // показанный SQL получен именно для них.
  const typedCreateSqlKey = useMemo(
    () =>
      buildCreateSqlCacheKey({
        connectionMetadata: inputConnectionMetadata,
        dataframeMetadata: inputDataframeMetadata,
        inputValues: {
          ...(localInputData ?? {}),
          column_mapping: typedMapping,
          table_create_spec: normalizedTypedSpecForDialect,
        },
        mode: 'typed',
        commentOverrides: sharedState?.typedCommentOverrides,
        commentsSupported: sharedState?.columnCommentsSupported,
      }),
    [
      inputConnectionMetadata,
      inputDataframeMetadata,
      localInputData,
      normalizedTypedSpecForDialect,
      sharedState?.columnCommentsSupported,
      sharedState?.typedCommentOverrides,
      typedMapping,
    ]
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
      comments: sharedState?.typedCommentOverrides,
      sourceComments: inputDataframeMetadata?.columns.map(
        column => column.comment
      ),
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
    sharedState?.typedCommentOverrides,
    sharedState?.columnCommentsSupported,
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
        !isTableNew ||
        !literalTableName ||
        !inputConnectionMetadata ||
        !inputDataframeMetadata
      ) {
        return;
      }

      const requestKey =
        mode === 'typed'
          ? typedCreateSqlKey
          : buildCreateSqlCacheKey({
              connectionMetadata: inputConnectionMetadata,
              dataframeMetadata: inputDataframeMetadata,
              inputValues: {
                ...(localInputData ?? {}),
                column_mapping: null,
                table_create_spec: null,
              },
              mode,
              commentOverrides: sharedState?.typedCommentOverrides,
              commentsSupported: sharedState?.columnCommentsSupported,
            });

      if (
        !forceRefresh &&
        sharedState?.lastCreateSqlKey === requestKey &&
        typedPreviewSql.trim()
      ) {
        return;
      }

      setPreviewError(null);
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
                commentOverrides: sharedState?.typedCommentOverrides,
                commentsSupported: sharedState?.columnCommentsSupported,
              }),
              table_create_spec:
                isTableNew && mode === 'typed'
                  ? (normalizedTypedSpecForDialect as any)
                  : null,
            },
          },
          { silent: true, signal: abortController.signal }
        );

        if (createSqlAbortControllerRef.current !== abortController) {
          return;
        }

        setPreviewSql(response.data.sql);
        setPreviewError(null);
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
        setPreviewError(
          error instanceof Error ? error.message : 'Не удалось получить DDL.'
        );
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
      sharedState?.typedCommentOverrides,
      sharedState?.columnCommentsSupported,
      typedCreateSqlKey,
      typedMapping,
      typedPreviewSql,
      isTableNew,
    ]
  );
  const fetchCreateTableSqlRef = useRef(fetchCreateTableSql);
  fetchCreateTableSqlRef.current = fetchCreateTableSql;

  // Параметры изменились — DDL пересобирается сам после короткой паузы.
  // Пока запрос в работе, ждём его: если параметры поменялись за это время,
  // ключ ответа не совпадёт с текущим, и DDL запросится снова. Ошибка
  // запоминает свой ключ, поэтому повторов без новых правок нет.
  const isDdlAutoRefreshPending = Boolean(
    isOpen &&
    isTableNew &&
    selectedCreationMode === 'typed' &&
    canFetchTypedPreviewSql &&
    !sharedState?.isCreateSqlLoading &&
    sharedState?.lastCreateSqlKey !== typedCreateSqlKey
  );

  useEffect(() => {
    if (!isDdlAutoRefreshPending) return;
    const timer = window.setTimeout(() => {
      void fetchCreateTableSqlRef.current('typed');
    }, DDL_AUTO_REFRESH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isDdlAutoRefreshPending, typedCreateSqlKey]);

  const refreshPreview = useCallback(() => {
    if (!isTableNew) return;
    if (selectedCreationMode === 'raw') {
      setPreviewSql(localInputData?.create_table_sql ?? '');
      return;
    }
    void fetchCreateTableSql('typed', true);
  }, [
    fetchCreateTableSql,
    isTableNew,
    selectedCreationMode,
    localInputData?.create_table_sql,
  ]);
  const refreshPreviewRef = useRef(refreshPreview);
  refreshPreviewRef.current = refreshPreview;
  const canRefreshPreview =
    isTableNew && selectedCreationMode === 'raw'
      ? Boolean(localInputData?.create_table_sql?.trim())
      : canFetchTypedPreviewSql;

  useEffect(() => {
    if (!isOpen || !canRefreshPreview || initialPreviewRequested.current)
      return;
    // Delay until effects have settled; StrictMode cleanup cancels this timer.
    const timer = window.setTimeout(() => {
      initialPreviewRequested.current = true;
      refreshPreviewRef.current();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, canRefreshPreview]);

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

    const rowsPerBatch = localInputData?.rows_per_batch;
    if (rowsPerBatch != null) {
      if (!Number.isFinite(rowsPerBatch)) {
        errors['rows_per_batch'] = ['Размер чанка имеет неверный формат.'];
      } else if (
        rowsPerBatch < rowsPerBatchBounds.min ||
        rowsPerBatch > rowsPerBatchBounds.max
      ) {
        errors['rows_per_batch'] = [
          `Размер чанка должен быть от ${rowsPerBatchBounds.min} до ${rowsPerBatchBounds.max} строк.`,
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

    if (specDraftErrors.length > 0) {
      errors['table_create_spec'] = [
        ...(errors['table_create_spec'] ?? []),
        ...specDraftErrors,
      ];
    }
    setFieldErrors(errors);
    setValidationErrors?.({});
    return Object.keys(errors).length === 0;
  }, [
    columnDiff,
    isSchemaRequired,
    isTableNew,
    localInputData?.create_table_sql,
    localInputData?.rows_per_batch,
    localInputData?.schema_name,
    localInputData?.table_name,
    localInputData?.upsert_config?.key_column,
    localInputData?.write_mode,
    rowsPerBatchBounds.max,
    rowsPerBatchBounds.min,
    selectedCreationMode,
    selectedTargetLabel,
    setValidationErrors,
    sharedState?.isCreateTableLoading,
    sharedState?.isResolvingColumns,
    sharedState?.resolveColumnsError,
    sharedState?.resolvedDiagnostics,
    typedResolutionErrors,
    typedSpecErrors,
    specDraftErrors,
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
    if (isOpen) void runValidation();
  }, [isOpen, runValidation]);

  const handleAdvancedSpecChange = useCallback(
    (value: TableCreateSpec | null) => {
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
    },
    [setLocalInputData, setSharedState]
  );

  const existingPrimaryKey = useMemo(
    () =>
      (selectedTable?.columns ?? [])
        .filter(column => column.primary_key)
        .map(column => column.name),
    [selectedTable?.columns]
  );
  const generalErrors = Object.entries(fieldErrors).filter(
    ([key]) => !INLINE_ERROR_KEYS.has(key)
  );
  const isTypedNewTable = isTableNew && selectedCreationMode === 'typed';
  // Параметры изменились, а DDL пересобрать нельзя (например, в настройках
  // ошибка) — иначе он уже обновляется сам.
  const isDdlStale =
    isTypedNewTable &&
    Boolean(previewSql) &&
    !sharedState?.typedPreviewSql &&
    !sharedState?.isCreateSqlLoading &&
    !isDdlAutoRefreshPending;

  return (
    <SettingsRoot {...dropdownBoundaryProps}>
      <SettingsForm>
        <SettingsFormInner>
          <SettingsGroup>
            <SyncDescriptionsSection
              syncDescriptions={
                localInputData?.sync_column_descriptions ?? true
              }
              onSyncDescriptionsChange={checked =>
                setLocalInputData(prev => ({
                  ...(prev ?? {}),
                  sync_column_descriptions: checked,
                }))
              }
            />
            {sharedState?.catalogDescriptionsError ? (
              <MessageBox tone='info' role='status'>
                {sharedState.catalogDescriptionsError}
              </MessageBox>
            ) : null}
          </SettingsGroup>

          {isTypedNewTable ? (
            <TableSpecSections
              isClickHouse={isClickHouse}
              value={localInputData?.table_create_spec ?? null}
              columns={typedColumnOptions}
              typedSpecErrors={typedSpecErrors}
              onPatchCore={patchTableCreateSpec}
              onAdvancedChange={handleAdvancedSpecChange}
              onValidationChange={setSpecDraftErrors}
            />
          ) : isTableNew ? (
            <SettingsGroup>
              <SettingsBox>
                <SettingsNote>
                  Ключи и индексы заданы в SQL на шаге «Настройка схемы».
                </SettingsNote>
              </SettingsBox>
            </SettingsGroup>
          ) : (
            <SettingsGroup>
              <SettingsBox>
                <SettingLine label='Первичный ключ'>
                  <ColumnsSelect
                    ariaLabel='Первичный ключ'
                    multiple
                    disabled
                    values={existingPrimaryKey}
                    options={NO_COLUMN_OPTIONS}
                    onChange={ignoreChange}
                    placeholder='Не задан'
                  />
                </SettingLine>
              </SettingsBox>
            </SettingsGroup>
          )}

          <AdvancedSettingsSection
            rowsPerBatch={localInputData?.rows_per_batch}
            rowsPerBatchBounds={rowsPerBatchBounds}
            onRowsPerBatchChange={handleRowsPerBatchChange}
            errors={fieldErrors}
          />

          {generalErrors.length || sharedState?.createTableError ? (
            <MessageList>
              {generalErrors.map(([key, errors]) => (
                <MessageBox key={key} tone='error' role='alert'>
                  {errors.join(' ')}
                </MessageBox>
              ))}
              <StatusAlertsSection
                createTableError={sharedState?.createTableError}
                isCreateTableLoading={Boolean(
                  sharedState?.isCreateTableLoading
                )}
                isTableNew={isTableNew}
              />
            </MessageList>
          ) : null}
        </SettingsFormInner>
      </SettingsForm>
      <DdlPreviewPane
        isTableNew={isTableNew}
        sql={previewSql}
        error={isTableNew ? previewError : null}
        isLoading={
          Boolean(sharedState?.isCreateSqlLoading) || isDdlAutoRefreshPending
        }
        isStale={isDdlStale}
        canRefresh={canRefreshPreview}
        onRefresh={refreshPreview}
        copied={isSqlCopied === 'typed'}
        onCopy={() => void copySql(previewSql)}
      />
    </SettingsRoot>
  );
};
