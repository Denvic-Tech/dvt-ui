import type {
  StepLoadingConditionContext,
  StepOnContinueContext,
} from '@/app/providers/node-extensions';

import { requireDbConnectionId } from '@/entities/data/db-connection/model/catalogNormalizers';

import {
  client,
  type DataFrameMetadata,
  type DbColumn,
  type DbMetadata as DBMetadata,
  type DbTable,
  type NodeInputExpressionValue,
  type TableCreateSpec as GatewayTableCreateSpec,
} from '@/shared/gatewayClient';
import {
  buildDbMetadataTableLabel,
  findDbMetadataTable,
  isDialectSupportsDatabases,
  isDialectSupportsSchemas,
} from '@/shared/lib/db-metadata';
import { ApiError } from '@/shared/lib/errors';
import { isExpressionValue } from '@/shared/lib/node-input-values';

export type CreationMode = 'typed' | 'raw';

export type UpsertConfig = {
  key_column: string;
};

export type DraftId = string;

export type DraftIndexSpec = {
  id: DraftId;
  name: string;
  columns: string[];
  unique: boolean;
};

export type DraftForeignKeySpec = {
  id: DraftId;
  name: string;
  columns: string[];
  ref_table: string;
  ref_schema: string;
  ref_columns: string[];
};

type DraftClickHouseSetting = {
  id: DraftId;
  key: string;
  value: string;
};

export type TypedSpecDraft = {
  primaryKeyColumns: string[];
  indexes: DraftIndexSpec[];
  foreignKeys: DraftForeignKeySpec[];
  clickhouse: {
    engineName: string;
    orderBy: string[];
    partitionBy: string[];
    primaryKey: string[];
    settings: DraftClickHouseSetting[];
  };
};

export type WriteDataFrameToDBSelectorValue =
  | string
  | NodeInputExpressionValue
  | null
  | undefined;

export type WriteDataFrameToDBValues = {
  table_name?: WriteDataFrameToDBSelectorValue;
  database_name?: WriteDataFrameToDBSelectorValue;
  schema_name?: WriteDataFrameToDBSelectorValue;
  chunksize?: number | null;
  min_batch_rows?: number | null;
  write_mode?: string | null;
  upsert_config?: UpsertConfig | null;
  use_clickhouse_connect_driver?: boolean | null;
  create_table_sql?: string | null;
  table_create_spec?: GatewayTableCreateSpec | null;
};

export interface ExtensionState {
  inputConnectionMetadata?: DBMetadata | null;
  inputDataframeMetadata?: DataFrameMetadata | null;
  isTableNew?: boolean;
  isCreateSqlLoading?: boolean;
  isCreateTableLoading?: boolean;
  createSqlError?: string | null;
  createTableError?: string | null;
  createTableSuccess?: string | null;
  createTableSuccessAt?: number | null;
  lastCreateSqlKey?: string | null;
  typedPreviewSql?: string | null;
  lastCreateTableKey?: string | null;
  invalidateCatalog?: () => void;
  selectedCreationMode?: CreationMode;
  typedSpecDraft?: TypedSpecDraft;
  createdDatabases?: string[];
  createdSchemas?: Array<{
    databaseName: string | null;
    schemaName: string;
  }>;
}

const CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS = 2000;
const DEFAULT_CREATION_MODE: CreationMode = 'raw';

export const createDefaultTypedSpecDraft = (): TypedSpecDraft => ({
  primaryKeyColumns: [],
  indexes: [],
  foreignKeys: [],
  clickhouse: {
    engineName: 'MergeTree',
    orderBy: [],
    partitionBy: [],
    primaryKey: [],
    settings: [],
  },
});

export const makeDraftId = (prefix: string): DraftId => {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
};

export const normalizeName = (name: string | null | undefined): string => {
  return (name ?? '').trim().toLowerCase();
};

export const getLiteralStringValue = (
  value: WriteDataFrameToDBSelectorValue
): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const hasConfiguredSelectorValue = (
  value: WriteDataFrameToDBSelectorValue
): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return isExpressionValue(value);
};

export const getSelectorCollapsedValue = (
  value: WriteDataFrameToDBSelectorValue,
  fallback: string
): string => {
  const literalValue = getLiteralStringValue(value);

  if (literalValue) {
    return literalValue;
  }

  return isExpressionValue(value) ? 'Expression' : fallback;
};

export const supportsSchemas = (inputMetadata: DBMetadata | null) =>
  Boolean(inputMetadata && isDialectSupportsSchemas(inputMetadata.dialect));

export const supportsDatabaseSelection = (inputMetadata: DBMetadata | null) =>
  Boolean(inputMetadata && isDialectSupportsDatabases(inputMetadata.dialect));

const hasSelectedTypedColumns = (values?: string[] | null): boolean => {
  return (values ?? []).some(value => normalizeText(value).length > 0);
};

export const getTypedSpecValidationError = (args: {
  connectionMetadata?: DBMetadata | null | undefined;
  draft?: TypedSpecDraft | null | undefined;
}): string | null => {
  const dialect = args.connectionMetadata?.dialect?.toLowerCase() ?? '';

  if (!dialect.includes('clickhouse')) {
    return null;
  }

  const draft = args.draft ?? createDefaultTypedSpecDraft();
  const hasOrderBy = hasSelectedTypedColumns(draft.clickhouse.orderBy);
  const hasPrimaryKey = hasSelectedTypedColumns(draft.clickhouse.primaryKey);

  if (!hasOrderBy && !hasPrimaryKey) {
    return 'Для ClickHouse в Typed Table spec нужно заполнить Order by или Primary key.';
  }

  return null;
};

export const buildSelectedWriteTargetLabel = (
  inputData?: WriteDataFrameToDBValues | null
): string => {
  const tableName = getLiteralStringValue(inputData?.table_name);
  const databaseName = getLiteralStringValue(inputData?.database_name);
  const schemaName = getLiteralStringValue(inputData?.schema_name);

  if (!tableName) {
    return '';
  }

  return buildDbMetadataTableLabel({
    name: tableName,
    database_name: databaseName,
    schema_name: schemaName,
  });
};

export const buildWriteTargetAfterDatabaseChange = (
  current: WriteDataFrameToDBValues,
  nextDatabaseName: WriteDataFrameToDBValues['database_name'],
  preserveTableName: boolean
): WriteDataFrameToDBValues => {
  return {
    ...current,
    database_name: nextDatabaseName,
    schema_name: null,
    table_name: preserveTableName ? current.table_name : null,
  };
};

export const buildWriteTargetAfterTableModeChange = (
  current: WriteDataFrameToDBValues
): WriteDataFrameToDBValues => {
  return {
    ...current,
    table_name: null,
  };
};

export const getSelectorFingerprintValue = (
  value: WriteDataFrameToDBSelectorValue
): string => {
  if (typeof value === 'string') {
    return normalizeName(value);
  }

  if (isExpressionValue(value)) {
    return `expr:${value.expression_kind}:${value.value}`;
  }

  return '';
};

export const findWriteTargetTable = (
  inputMetadata: DBMetadata | null,
  inputData?: WriteDataFrameToDBValues | null
): DbTable | null => {
  const tableName = getLiteralStringValue(inputData?.table_name);
  const databaseName = normalizeName(
    getLiteralStringValue(inputData?.database_name)
  );
  const schemaName = normalizeName(
    getLiteralStringValue(inputData?.schema_name)
  );

  if (!inputMetadata || !tableName) {
    return null;
  }

  return findDbMetadataTable(inputMetadata, {
    databaseName,
    schemaName,
    tableName,
  });
};

const normalizeText = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeNullableText = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(item => normalizeText(item))
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index);
  }

  return [];
};

const parseLooseScalar = (value: string): unknown => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed === 'null') {
    return null;
  }
  if (!Number.isNaN(Number(trimmed))) {
    return Number(trimmed);
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const isNonEmpty = (value: string | null | undefined): boolean => {
  return Boolean(value && value.trim().length > 0);
};

export const serializeTypedSpecDraft = (
  draft?: TypedSpecDraft | null
): GatewayTableCreateSpec | null => {
  if (!draft) {
    return null;
  }

  const primaryKeyColumns = draft.primaryKeyColumns.filter(Boolean);
  const indexes = draft.indexes
    .map(index => ({
      name: normalizeNullableText(index.name),
      columns: index.columns.filter(Boolean),
      unique: Boolean(index.unique),
    }))
    .filter(index => index.columns.length > 0);

  const foreignKeys = draft.foreignKeys
    .map(foreignKey => ({
      name: normalizeNullableText(foreignKey.name),
      columns: foreignKey.columns.filter(Boolean),
      ref_table: normalizeText(foreignKey.ref_table),
      ref_schema: normalizeNullableText(foreignKey.ref_schema),
      ref_columns: foreignKey.ref_columns.filter(Boolean),
    }))
    .filter(foreignKey => {
      return (
        foreignKey.columns.length > 0 &&
        foreignKey.ref_columns.length > 0 &&
        foreignKey.ref_table.length > 0
      );
    });

  const clickhouseSettings = draft.clickhouse.settings
    .map(setting => ({
      key: normalizeText(setting.key),
      value: normalizeText(setting.value),
    }))
    .filter(setting => setting.key.length > 0)
    .reduce<Record<string, unknown>>((accumulator, setting) => {
      accumulator[setting.key] = parseLooseScalar(setting.value);
      return accumulator;
    }, {});

  const clickhouse =
    normalizeText(draft.clickhouse.engineName) ||
    draft.clickhouse.orderBy.length > 0 ||
    draft.clickhouse.partitionBy.length > 0 ||
    draft.clickhouse.primaryKey.length > 0 ||
    Object.keys(clickhouseSettings).length > 0
      ? {
          engine_name: (normalizeText(draft.clickhouse.engineName) ||
            'MergeTree') as any,
          order_by:
            draft.clickhouse.orderBy.length > 0
              ? draft.clickhouse.orderBy.filter(Boolean)
              : null,
          partition_by:
            draft.clickhouse.partitionBy.length > 0
              ? draft.clickhouse.partitionBy.filter(Boolean)
              : null,
          primary_key:
            draft.clickhouse.primaryKey.length > 0
              ? draft.clickhouse.primaryKey.filter(Boolean)
              : null,
          settings: (Object.keys(clickhouseSettings).length > 0
            ? clickhouseSettings
            : null) as any,
        }
      : null;

  const hasContent =
    primaryKeyColumns.length > 0 ||
    indexes.length > 0 ||
    foreignKeys.length > 0 ||
    Boolean(clickhouse);

  if (!hasContent) {
    return null;
  }

  return {
    primary_key_cols:
      primaryKeyColumns.length === 0
        ? null
        : primaryKeyColumns.length === 1
          ? primaryKeyColumns[0]
          : primaryKeyColumns,
    indexes: indexes.length > 0 ? indexes : null,
    foreign_keys: foreignKeys.length > 0 ? foreignKeys : null,
    clickhouse,
  };
};

export const buildDbColumnsFromDataFrame = (
  metadata?: DataFrameMetadata | null
): DbColumn[] => {
  return (metadata?.columns ?? []).map(column => ({
    name: column.name,
    dtype: column.dtype,
    dtype_metadata: column.dtype_metadata ?? null,
    nullable: column.nullable ?? null,
    index: null,
    indexes: null,
    primary_key: null,
  }));
};

export const resolveCreationMode = (state?: ExtensionState): CreationMode => {
  return state?.selectedCreationMode ?? DEFAULT_CREATION_MODE;
};

export const shouldShowCreateTableSql = (
  _inputValues: WriteDataFrameToDBValues,
  isTableNew: boolean,
  creationMode: CreationMode = DEFAULT_CREATION_MODE
): boolean => {
  return isTableNew && creationMode === 'raw';
};

export const buildCreateSqlCacheKey = (
  inputValues: WriteDataFrameToDBValues,
  dataframeMetadata?: DataFrameMetadata | null,
  connectionMetadata?: DBMetadata | null
): string => {
  const columnsFingerprint = (dataframeMetadata?.columns ?? [])
    .map(column => `${column.name}:${String(column.dtype ?? '')}`)
    .join('|');

  return [
    getSelectorFingerprintValue(inputValues.table_name),
    getSelectorFingerprintValue(inputValues.database_name),
    getSelectorFingerprintValue(inputValues.schema_name),
    connectionMetadata?.connection_id ?? '',
    connectionMetadata?.connection_revision ?? '',
    columnsFingerprint,
  ].join('::');
};

export const isPrepareStepValid = (
  inputValues: WriteDataFrameToDBValues,
  sharedState?: ExtensionState
): boolean => {
  const isDatabaseSelectionRequired = supportsDatabaseSelection(
    sharedState?.inputConnectionMetadata ?? null
  );

  if (
    isDatabaseSelectionRequired &&
    !hasConfiguredSelectorValue(inputValues?.database_name)
  ) {
    return false;
  }

  if (!hasConfiguredSelectorValue(inputValues?.table_name)) {
    return false;
  }

  const isSchemaRequired = supportsSchemas(
    sharedState?.inputConnectionMetadata ?? null
  );

  if (
    isSchemaRequired &&
    !hasConfiguredSelectorValue(inputValues?.schema_name)
  ) {
    return false;
  }

  if (!isNonEmpty(inputValues?.write_mode)) {
    return false;
  }

  if (
    normalizeText(inputValues?.write_mode).toLowerCase() === 'upsert' &&
    !isNonEmpty(inputValues?.upsert_config?.key_column)
  ) {
    return false;
  }

  const isTableNew = sharedState?.isTableNew ?? false;
  if (!isTableNew) {
    return true;
  }

  if (sharedState?.isCreateSqlLoading || sharedState?.isCreateTableLoading) {
    return false;
  }

  if (
    !sharedState?.inputConnectionMetadata ||
    !sharedState?.inputDataframeMetadata
  ) {
    return false;
  }

  const creationMode = resolveCreationMode(sharedState);
  if (creationMode === 'typed') {
    return !getTypedSpecValidationError({
      connectionMetadata: sharedState?.inputConnectionMetadata,
      draft: sharedState?.typedSpecDraft,
    });
  }

  return isNonEmpty(inputValues?.create_table_sql);
};

export const extractApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof ApiError) {
    const detail = (error.payload.meta as any)?.exc_data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (
      typeof error.payload.detail === 'string' &&
      error.payload.detail.trim()
    ) {
      return error.payload.detail;
    }

    if (
      typeof error.payload.message === 'string' &&
      error.payload.message.trim()
    ) {
      return error.payload.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const pushUniqueString = (
  values: string[] | undefined,
  nextValue: string | null | undefined
): string[] => {
  const normalized = normalizeText(nextValue);
  if (!normalized) {
    return values ?? [];
  }

  const nextValues = values ?? [];
  return nextValues.includes(normalized)
    ? nextValues
    : [...nextValues, normalized];
};

export const registerCreatedDatabase = (
  previousState: ExtensionState | undefined,
  databaseName: string
): ExtensionState => {
  return {
    ...(previousState ?? {}),
    createdDatabases: pushUniqueString(
      previousState?.createdDatabases,
      databaseName
    ),
  };
};

export const registerCreatedSchema = (
  previousState: ExtensionState | undefined,
  databaseName: string | null | undefined,
  schemaName: string
): ExtensionState => {
  const normalizedSchemaName = normalizeText(schemaName);
  if (!normalizedSchemaName) {
    return previousState ?? {};
  }

  const normalizedDatabaseName = normalizeNullableText(databaseName);
  const createdSchemas = previousState?.createdSchemas ?? [];
  const exists = createdSchemas.some(schema => {
    return (
      normalizeName(schema.databaseName) ===
        normalizeName(normalizedDatabaseName) &&
      normalizeName(schema.schemaName) === normalizeName(normalizedSchemaName)
    );
  });

  return {
    ...(previousState ?? {}),
    createdDatabases: pushUniqueString(
      previousState?.createdDatabases,
      normalizedDatabaseName
    ),
    createdSchemas: exists
      ? createdSchemas
      : [
          ...createdSchemas,
          {
            databaseName: normalizedDatabaseName,
            schemaName: normalizedSchemaName,
          },
        ],
  };
};

const buildCreateTableKey = (
  inputValues: WriteDataFrameToDBValues,
  sharedState?: ExtensionState
): string => {
  const connectionMetadata = sharedState?.inputConnectionMetadata;
  const creationMode = resolveCreationMode(sharedState);
  const typedSpec = serializeTypedSpecDraft(
    sharedState?.typedSpecDraft ?? createDefaultTypedSpecDraft()
  );

  return [
    inputValues.table_name ?? '',
    inputValues.database_name ?? '',
    inputValues.schema_name ?? '',
    inputValues.create_table_sql ?? '',
    connectionMetadata?.connection_id ?? '',
    connectionMetadata?.connection_revision ?? '',
    creationMode,
    JSON.stringify(typedSpec ?? null),
  ].join('::');
};

export const prepareWriteStepOnContinue = async (
  context: StepOnContinueContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<void> => {
  const { setSharedState } = context;

  setSharedState(prev => ({
    ...(prev ?? {}),
    createTableError: null,
    createTableSuccess: null,
    createTableSuccessAt: null,
    isCreateTableLoading: false,
    lastCreateTableKey: null,
  }));
};

export const isWriteStepReady = async (
  context: StepLoadingConditionContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<boolean> => {
  const isTableNew = context.sharedState?.isTableNew ?? false;
  if (!isTableNew) {
    return true;
  }

  if (context.sharedState?.isCreateTableLoading) {
    return false;
  }

  if (context.sharedState?.createTableSuccess) {
    const successTimestamp = context.sharedState?.createTableSuccessAt ?? null;
    if (successTimestamp == null) {
      return false;
    }

    const elapsed = Date.now() - successTimestamp;
    return elapsed >= CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS;
  }

  if (context.sharedState?.createTableError) {
    return false;
  }

  return false;
};

const createTableFromRawSql = async (args: {
  context: StepLoadingConditionContext<
    WriteDataFrameToDBValues,
    ExtensionState
  >;
  connectionMetadata: DBMetadata;
}): Promise<string> => {
  const { context, connectionMetadata } = args;
  const createTableSql = (context.inputValues.create_table_sql ?? '').trim();

  if (!createTableSql) {
    throw new Error(
      'SQL для создания таблицы пуст. Вернитесь на предыдущий шаг и заполните Raw DDL SQL.'
    );
  }

  const response = await client.utils.ddl.createTable.post(
    {
      body: {
        mode: 'from_sql',
        connection_id: requireDbConnectionId(connectionMetadata),
        table_ddl: createTableSql,
        database_name: getLiteralStringValue(context.inputValues.database_name),
        schema_name: getLiteralStringValue(context.inputValues.schema_name),
        on_exists: 'error',
      },
    },
    { silent: true }
  );

  context.sharedState?.invalidateCatalog?.();

  return response.data.message || 'Таблица успешно создана из Raw DDL SQL.';
};

const createTableFromTypedSpec = async (args: {
  context: StepLoadingConditionContext<
    WriteDataFrameToDBValues,
    ExtensionState
  >;
  connectionMetadata: DBMetadata;
  sharedState: ExtensionState;
}): Promise<string> => {
  const { context, connectionMetadata, sharedState } = args;
  const tableName = normalizeText(context.inputValues.table_name);

  const connectionId = requireDbConnectionId(connectionMetadata);
  if (!tableName) {
    throw new Error('Не задано имя target table.');
  }

  const dataframeMetadata = sharedState.inputDataframeMetadata;
  if (!dataframeMetadata || (dataframeMetadata.columns ?? []).length === 0) {
    throw new Error(
      'Для typed-режима нужны metadata входного DataFrame с колонками.'
    );
  }

  const serializedTypedSpec = serializeTypedSpecDraft(
    sharedState.typedSpecDraft ?? createDefaultTypedSpecDraft()
  );
  const normalizedTypedSpec = connectionMetadata.dialect
    .toLowerCase()
    .includes('clickhouse')
    ? serializedTypedSpec
    : serializedTypedSpec
      ? {
          ...serializedTypedSpec,
          clickhouse: null,
        }
      : null;

  await client.utils.ddl.createTable.post(
    {
      body: {
        mode: 'from_schema',
        table_name: tableName,
        connection_id: connectionId,
        database_name: getLiteralStringValue(context.inputValues.database_name),
        schema_name: getLiteralStringValue(context.inputValues.schema_name),
        columns: buildDbColumnsFromDataFrame(dataframeMetadata),
        table_create_spec: normalizedTypedSpec as any,
        on_exists: 'error',
      },
    },
    { silent: true }
  );

  context.sharedState?.invalidateCatalog?.();

  return 'Таблица успешно создана из Typed table spec.';
};

export const createTableOnWriteStepEnter = async (
  context: StepLoadingConditionContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<void> => {
  const { sharedState, setSharedState } = context;
  const isTableNew = sharedState?.isTableNew ?? false;

  if (!isTableNew) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      isCreateTableLoading: false,
      createTableSuccessAt: null,
    }));
    return;
  }

  const connectionMetadata = sharedState?.inputConnectionMetadata;
  if (!connectionMetadata) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError:
        'Нет метаданных подключения. Вернитесь на предыдущий шаг и обновите вход connection.',
      createTableSuccess: null,
      createTableSuccessAt: null,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
    }));
    return;
  }

  const creationMode = resolveCreationMode(sharedState);
  const createTableKey = buildCreateTableKey(context.inputValues, sharedState);
  if (
    sharedState?.lastCreateTableKey === createTableKey &&
    !sharedState?.createTableError &&
    !!sharedState?.createTableSuccess
  ) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      isCreateTableLoading: false,
      createTableSuccessAt: prev?.createTableSuccessAt ?? null,
    }));
    return;
  }

  setSharedState(prev => ({
    ...(prev ?? {}),
    createTableError: null,
    createTableSuccess: null,
    createTableSuccessAt: null,
    isCreateTableLoading: true,
  }));

  try {
    const message =
      creationMode === 'typed'
        ? await createTableFromTypedSpec({
            context,
            connectionMetadata,
            sharedState: sharedState ?? {},
          })
        : await createTableFromRawSql({
            context,
            connectionMetadata,
          });

    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError: null,
      createTableSuccess: message,
      createTableSuccessAt: Date.now(),
      isCreateTableLoading: false,
      lastCreateTableKey: createTableKey,
    }));
  } catch (error: unknown) {
    const errorMessage = extractApiErrorMessage(
      error,
      'Не удалось создать таблицу.'
    );

    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError: errorMessage,
      createTableSuccess: null,
      createTableSuccessAt: null,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
    }));
  }
};
