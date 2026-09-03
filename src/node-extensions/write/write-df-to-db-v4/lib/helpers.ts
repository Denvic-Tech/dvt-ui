import type {
  StepBeforeFinishContext,
  StepLoadingConditionContext,
  StepOnContinueContext,
} from '@/app/providers/node-extensions';

import {
  getDbCatalogConnectionId,
  requireDbConnectionId,
} from '@/entities/data/db-connection/model/catalogNormalizers';

import {
  client,
  type Column,
  type DataFrameMetadata,
  type DataFrameMetadataInput,
  type DataType,
  type DbColumn,
  type DbMetadata as DBMetadata,
  type DbTable,
  type ExtraColumnsMode,
  type MissingColumnsMode,
  type NodeInputExpressionValue,
  type ResolveWriteColumnsRequest,
  type ResolveWriteColumnsResponse,
  type TableColumnActionInput,
  type TableColumnActionOutput,
  type TableCreateSpec as GatewayTableCreateSpec,
  type WriteColumnResolutionRow,
  type WriteDiagnostic,
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

export type ColumnMappingItem = {
  source_name: string;
  target_name: string;
  dtype: DataType | string;
  nullable: boolean | null;
};

export type ResolvedColumnMappingRow = {
  source_name: string | null;
  requested_target_name: string | null;
  effective_target_name: string | null;
  db_name: string | null;
  dtype: DataType | string | null;
  nullable: boolean | null;
  status: WriteColumnResolutionRow['status'];
  reason: string | null;
};

export type ExistingTableColumnDiffRow = {
  dfName: string | null;
  dfType: string | null;
  requestedTargetName: string | null;
  dbName: string | null;
  dbType: string | null;
  dbNullable: boolean | null;
  status: WriteColumnResolutionRow['status'];
  reason: string | null;
  suggestedAction: TableColumnActionOutput | null;
};

export type ExistingTableColumnDiffSummary = {
  countDelta: number;
  dbCount: number;
  dfCount: number;
  missingInDb: number;
  missingInDf: number;
  softCast: number;
  typeMismatch: number;
  matches: number;
};

export type ColumnResolveState = 'idle' | 'dirty' | 'loading' | 'flash';

export const getSyncingColumnCount = (
  states?: Record<string, ColumnResolveState> | null
): number => {
  return Object.values(states ?? {}).filter(
    state => state === 'dirty' || state === 'loading'
  ).length;
};

export const getDefaultSelectedColumnActions = (
  rows:
    | Array<Pick<WriteColumnResolutionRow, 'suggested_action'>>
    | null
    | undefined
): TableColumnActionInput[] => {
  return (rows ?? []).flatMap(row => {
    const action = row.suggested_action;
    if (action?.type !== 'add_column') {
      return [];
    }

    return [
      {
        type: action.type,
        column_name: action.column_name,
        column: action.column ?? null,
      },
    ];
  });
};

export type ColumnMappingChangeState = {
  dtypeChanged: boolean;
  nullableChanged: boolean;
  targetNameChanged: boolean;
};

export type ChangedColumnMappingPreviewItem = {
  item: ColumnMappingItem;
  state: ColumnMappingChangeState | undefined;
  tokens: string[];
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
  column_mapping?: ColumnMappingItem[] | null;
  on_extra_df_columns?: ExtraColumnsMode | null;
  on_missing_df_columns?: MissingColumnsMode | null;
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
  selectedCreationMode?: CreationMode;
  requestedColumnMappingDraft?: ColumnMappingItem[] | null;
  resolvedColumnRows?: WriteColumnResolutionRow[] | null;
  resolvedDiagnostics?: WriteDiagnostic[] | null;
  isResolvingColumns?: boolean;
  resolveColumnsError?: string | null;
  lastResolveColumnsKey?: string | null;
  createdDatabases?: string[];
  createdSchemas?: Array<{
    databaseName: string | null;
    schemaName: string;
  }>;
  isRecreatingTable?: boolean;
  recreateTableError?: string | null;
  selectedColumnActions?: TableColumnActionInput[];
  columnResolveStates?: Record<string, ColumnResolveState>;
  requestColumnActionsConfirm?: (
    actions: TableColumnActionInput[]
  ) => Promise<boolean>;
  requestTruncateConfirm?: (tableLabel: string) => Promise<boolean>;
  applyTableMetadataUpdate?: (tableMetadata: DbTable) => void;
  isApplyingColumnActions?: boolean;
  applyColumnActionsError?: string | null;
  applyColumnActionsSuccess?: string | null;
  applyColumnActionsSuccessAt?: number | null;
  invalidateCatalog?: () => void;
}

const CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS = 2000;

export const waitForCreateTableSuccessTransition = async (
  successAt: number
): Promise<void> => {
  const remainingDelay = Math.max(
    0,
    CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS - (Date.now() - successAt)
  );

  if (remainingDelay === 0) {
    return;
  }

  await new Promise<void>(resolve => {
    setTimeout(resolve, remainingDelay);
  });
};

const DEFAULT_CREATION_MODE: CreationMode = 'raw';
export const DEFAULT_ON_EXTRA_DF_COLUMNS: ExtraColumnsMode = 'ignore';
export const DEFAULT_ON_MISSING_DF_COLUMNS: MissingColumnsMode =
  'ignore_if_default';
export const BLOCKING_RESOLUTION_STATUSES = new Set<
  WriteColumnResolutionRow['status']
>(['duplicate_effective_target', 'invalid']);
export const VALID_RESOLUTION_STATUSES = new Set<
  WriteColumnResolutionRow['status']
>([
  'match',
  'explicit_mapping',
  'auto_transliterated',
  'normalized_target',
  'case_resolved',
]);

const MAPPED_EXISTING_TABLE_STATUSES = new Set<
  WriteColumnResolutionRow['status']
>([
  'match',
  'explicit_mapping',
  'auto_transliterated',
  'normalized_target',
  'case_resolved',
  'internal_column_ignored',
]);

const normalizeText = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeNullableText = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
};

const isNonEmpty = (value: string | null | undefined): boolean => {
  return Boolean(value && value.trim().length > 0);
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(item => normalizeText(item))
      .filter(Boolean)
      .filter(
        (item, index, values) =>
          values.findIndex(
            candidate => normalizeName(candidate) === normalizeName(item)
          ) === index
      );
  }

  if (typeof value === 'string') {
    const normalized = normalizeText(value);
    return normalized ? [normalized] : [];
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

const hasClickHouseConfig = (
  clickhouse: GatewayTableCreateSpec['clickhouse']
): boolean => {
  if (!clickhouse) {
    return false;
  }

  return Boolean(
    (clickhouse.order_by ?? []).length > 0 ||
    (clickhouse.partition_by ?? []).length > 0 ||
    (clickhouse.primary_key ?? []).length > 0 ||
    (clickhouse.sample_by ?? []).length > 0 ||
    (clickhouse.summing_columns ?? []).length > 0 ||
    normalizeText(clickhouse.ttl_expression) ||
    normalizeText(clickhouse.version_column) ||
    normalizeText(clickhouse.sign_column) ||
    normalizeText(clickhouse.table_path) ||
    normalizeText(clickhouse.replica_name) ||
    Object.keys(clickhouse.settings ?? {}).length > 0 ||
    normalizeText(clickhouse.engine_name) !== 'MergeTree'
  );
};

const filterAllowedColumns = (
  value: string | string[] | null | undefined,
  allowedColumns: Set<string>
): string[] => {
  return toStringArray(value).filter(columnName => {
    return allowedColumns.has(normalizeName(columnName));
  });
};

const filterAllowedScalarColumn = (
  value: string | null | undefined,
  allowedColumns: Set<string>
): string | null => {
  const normalized = normalizeNullableText(value);
  if (!normalized) {
    return null;
  }

  return allowedColumns.has(normalizeName(normalized)) ? normalized : null;
};

const serializePrimaryKeyCols = (
  columns: string[]
): string | string[] | null => {
  if (columns.length === 0) {
    return null;
  }

  return columns.length === 1 ? columns[0] : columns;
};

export const normalizeName = (name: string | null | undefined): string => {
  return (name ?? '').trim().toLowerCase();
};

export const applyUpsertKeyToTypedTableConfig = ({
  values,
  keyColumn,
  connectionMetadata,
}: {
  values: WriteDataFrameToDBValues;
  keyColumn: string;
  connectionMetadata: DBMetadata | null | undefined;
}): WriteDataFrameToDBValues => {
  const normalizedKeyColumn = keyColumn.trim();
  if (!normalizedKeyColumn) {
    return {
      ...values,
      upsert_config: null,
    };
  }

  const previousKeyColumn = values.upsert_config?.key_column?.trim() ?? '';
  const connectionKind = connectionMetadata?.dialect?.toLowerCase() ?? '';
  const isClickHouse = connectionKind.includes('clickhouse');
  const isPostgres =
    connectionKind.includes('postgresql') ||
    connectionKind.includes('postgres');

  const columnMapping = (values.column_mapping ?? []).map(item =>
    normalizeName(item.target_name) === normalizeName(normalizedKeyColumn)
      ? { ...item, nullable: false }
      : item
  );

  let tableCreateSpec = values.table_create_spec ?? null;

  if (isClickHouse) {
    tableCreateSpec = {
      ...(tableCreateSpec ?? {}),
      clickhouse: {
        ...(tableCreateSpec?.clickhouse ?? {}),
        engine_name: tableCreateSpec?.clickhouse?.engine_name ?? 'MergeTree',
        order_by: [normalizedKeyColumn],
      },
    };
  } else if (isPostgres) {
    const indexes = [...(tableCreateSpec?.indexes ?? [])].filter(index => {
      const isPreviousAutomaticIndex =
        previousKeyColumn.length > 0 &&
        !index.name?.trim() &&
        !index.unique &&
        index.columns.length === 1 &&
        normalizeName(index.columns[0]) === normalizeName(previousKeyColumn);

      return !isPreviousAutomaticIndex;
    });
    const hasKeyIndex = indexes.some(
      index =>
        index.columns.length === 1 &&
        normalizeName(index.columns[0]) === normalizeName(normalizedKeyColumn)
    );

    if (!hasKeyIndex) {
      indexes.push({
        name: null,
        columns: [normalizedKeyColumn],
        unique: false,
      });
    }

    tableCreateSpec = {
      ...(tableCreateSpec ?? {}),
      indexes,
    };
  }

  return {
    ...values,
    upsert_config: { key_column: normalizedKeyColumn },
    column_mapping: columnMapping,
    table_create_spec: tableCreateSpec,
  };
};

export const getColumnActionLabel = (
  type: TableColumnActionOutput['type']
): string => {
  switch (type) {
    case 'add_column':
      return 'Создать колонку';
    case 'drop_column':
      return 'Удалить колонку';
    case 'recreate_column':
      return 'Пересоздать колонку';
  }
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

export const inferCreationModeFromInput = (
  inputValues?: WriteDataFrameToDBValues | null
): CreationMode => {
  if (inputValues?.column_mapping?.length || inputValues?.table_create_spec) {
    return 'typed';
  }

  if (isNonEmpty(inputValues?.create_table_sql)) {
    return 'raw';
  }

  return DEFAULT_CREATION_MODE;
};

export const resolveCreationMode = (
  state?: ExtensionState,
  inputValues?: WriteDataFrameToDBValues | null
): CreationMode => {
  return state?.selectedCreationMode ?? inferCreationModeFromInput(inputValues);
};

export const buildColumnMapping = (args: {
  dataframeMetadata?: DataFrameMetadata | null;
  existingMapping?: ColumnMappingItem[] | null | undefined;
}): ColumnMappingItem[] => {
  const existingBySource = new Map<string, ColumnMappingItem>();

  for (const item of args.existingMapping ?? []) {
    const normalizedSource = normalizeName(item.source_name);
    if (!normalizedSource || existingBySource.has(normalizedSource)) {
      continue;
    }
    existingBySource.set(normalizedSource, item);
  }

  return (args.dataframeMetadata?.columns ?? []).map(column => {
    const existing = existingBySource.get(normalizeName(column.name));

    return {
      source_name: column.name,
      target_name: normalizeText(existing?.target_name) || column.name,
      dtype: (normalizeText(existing?.dtype) ||
        normalizeText(column.dtype) ||
        'UNKNOWN') as DataType | string,
      nullable:
        typeof existing?.nullable === 'boolean'
          ? existing.nullable
          : (column.nullable ?? true),
    };
  });
};

export const serializeColumnMapping = (
  mapping?: ColumnMappingItem[] | null
): ColumnMappingItem[] | null => {
  const normalized = (mapping ?? [])
    .map(item => ({
      source_name: normalizeText(item.source_name),
      target_name: normalizeText(item.target_name),
      dtype: (normalizeText(item.dtype) || 'UNKNOWN') as DataType | string,
      nullable: typeof item.nullable === 'boolean' ? item.nullable : null,
    }))
    .filter(item => item.source_name.length > 0);

  return normalized.length > 0 ? normalized : null;
};

export const buildColumnMappingNameKey = (
  mapping?: Array<Pick<ColumnMappingItem, 'source_name' | 'target_name'>> | null
): string => {
  return JSON.stringify(
    (mapping ?? [])
      .map(item => ({
        source_name: normalizeText(item.source_name),
        target_name: normalizeText(item.target_name),
      }))
      .filter(item => item.source_name.length > 0)
  );
};

export const getChangedTargetNameSourceNames = (
  previous?: ColumnMappingItem[] | null,
  next?: ColumnMappingItem[] | null
): string[] => {
  const previousBySource = new Map(
    (previous ?? []).map(
      item => [normalizeName(item.source_name), item] as const
    )
  );

  return (next ?? [])
    .filter(item => {
      const sourceKey = normalizeName(item.source_name);
      if (!sourceKey) {
        return false;
      }

      return (
        normalizeText(previousBySource.get(sourceKey)?.target_name) !==
        normalizeText(item.target_name)
      );
    })
    .map(item => item.source_name);
};

export const buildRequestedColumnMappingDraft = (args: {
  dataframeMetadata?: DataFrameMetadata | null | undefined;
  existingMapping?: ColumnMappingItem[] | null | undefined;
  existingDraft?: ColumnMappingItem[] | null | undefined;
}): ColumnMappingItem[] => {
  const existingMappingBySource = new Map<string, ColumnMappingItem>();
  const existingDraftBySource = new Map<string, ColumnMappingItem>();

  for (const item of args.existingMapping ?? []) {
    const sourceKey = normalizeName(item.source_name);
    if (sourceKey) {
      existingMappingBySource.set(sourceKey, item);
    }
  }

  for (const item of args.existingDraft ?? []) {
    const sourceKey = normalizeName(item.source_name);
    if (sourceKey) {
      existingDraftBySource.set(sourceKey, item);
    }
  }

  return (args.dataframeMetadata?.columns ?? []).map(column => {
    const sourceKey = normalizeName(column.name);
    const draft = existingDraftBySource.get(sourceKey);
    const effective = existingMappingBySource.get(sourceKey);
    const hasDraftTargetName = typeof draft?.target_name === 'string';

    return {
      source_name: column.name,
      target_name: hasDraftTargetName
        ? draft.target_name
        : normalizeText(effective?.target_name) || column.name,
      dtype: (normalizeText(draft?.dtype) ||
        normalizeText(effective?.dtype) ||
        normalizeText(column.dtype) ||
        'UNKNOWN') as DataType | string,
      nullable:
        typeof draft?.nullable === 'boolean'
          ? draft.nullable
          : typeof effective?.nullable === 'boolean'
            ? effective.nullable
            : (column.nullable ?? true),
    };
  });
};

export const normalizeResolvedColumnRows = (args: {
  dataframeMetadata?: DataFrameMetadata | null | undefined;
  requestedMapping?: ColumnMappingItem[] | null | undefined;
  response?:
    | {
        columns?: WriteColumnResolutionRow[] | undefined;
        diagnostics?: WriteDiagnostic[] | undefined;
      }
    | ResolveWriteColumnsResponse
    | null
    | undefined;
}): ResolvedColumnMappingRow[] => {
  const requestedMapping = buildRequestedColumnMappingDraft({
    dataframeMetadata: args.dataframeMetadata,
    existingDraft: args.requestedMapping,
  });
  const requestedBySource = new Map(
    requestedMapping.map(item => [normalizeName(item.source_name), item])
  );
  const rows = args.response?.columns ?? [];

  if (rows.length === 0) {
    return requestedMapping.map(item => ({
      source_name: item.source_name,
      requested_target_name: item.target_name,
      effective_target_name: item.target_name,
      db_name: item.target_name,
      dtype: item.dtype,
      nullable: item.nullable,
      status: 'match',
      reason: null,
    }));
  }

  return rows.map(row => {
    const requested = row.source_name
      ? requestedBySource.get(normalizeName(row.source_name))
      : undefined;

    return {
      source_name: row.source_name ?? null,
      requested_target_name:
        requested?.target_name ?? row.requested_target_name ?? null,
      effective_target_name: row.effective_target_name ?? null,
      db_name: row.db_name ?? null,
      dtype: (requested?.dtype ?? row.dtype ?? null) as
        | DataType
        | string
        | null,
      nullable:
        typeof requested?.nullable === 'boolean'
          ? requested.nullable
          : typeof row.nullable === 'boolean'
            ? row.nullable
            : null,
      status: row.status,
      reason: row.reason ?? null,
    };
  });
};

export const buildExistingTableColumnDiff = (args: {
  dataframeMetadata?: DataFrameMetadata | null | undefined;
  requestedMapping?: ColumnMappingItem[] | null | undefined;
  resolvedColumnRows?: WriteColumnResolutionRow[] | null | undefined;
  resolvedDiagnostics?: WriteDiagnostic[] | null | undefined;
}): ExistingTableColumnDiffRow[] => {
  const sourceByName = new Map(
    (args.dataframeMetadata?.columns ?? []).map(column => [
      normalizeName(column.name),
      column,
    ])
  );
  const rawRows = args.resolvedColumnRows ?? [];

  const rows = normalizeResolvedColumnRows({
    dataframeMetadata: args.dataframeMetadata,
    requestedMapping: args.requestedMapping,
    response: {
      columns: rawRows.length > 0 ? rawRows : undefined,
      diagnostics: args.resolvedDiagnostics ?? undefined,
    },
  }).map((row, index) => {
    const rawRow = rawRows[index];
    const sourceColumn = row.source_name
      ? sourceByName.get(normalizeName(row.source_name))
      : undefined;
    const dbName = getResolvedTargetName(row) ?? row.db_name;
    const suggestedAction = rawRow?.suggested_action ?? null;

    return {
      dfName: row.source_name,
      dfType: sourceColumn?.dtype ?? null,
      requestedTargetName: row.requested_target_name,
      dbName,
      dbType: row.dtype ? String(row.dtype) : null,
      dbNullable:
        typeof rawRow?.db_nullable === 'boolean'
          ? rawRow.db_nullable
          : typeof suggestedAction?.column?.nullable === 'boolean'
            ? suggestedAction.column.nullable
            : typeof row.nullable === 'boolean'
              ? row.nullable
              : null,
      status: row.status,
      reason: row.reason,
      suggestedAction,
    };
  });

  return orderExistingTableRowsPositionally(rows);
};

export const orderExistingTableRowsPositionally = (
  rows: ExistingTableColumnDiffRow[]
): ExistingTableColumnDiffRow[] => {
  const dbOnlyRowsByName = new Map<string, ExistingTableColumnDiffRow>();

  for (const row of rows) {
    if (row.status !== 'missing_in_dataframe') {
      continue;
    }

    const dbName = normalizeName(row.dbName);
    if (dbName && !dbOnlyRowsByName.has(dbName)) {
      dbOnlyRowsByName.set(dbName, row);
    }
  }

  const pairByRenamedRow = new Map<
    ExistingTableColumnDiffRow,
    ExistingTableColumnDiffRow
  >();
  const pairedDbOnlyRows = new Set<ExistingTableColumnDiffRow>();

  for (const row of rows) {
    if (row.status !== 'missing_in_db') {
      continue;
    }

    const sourceName = normalizeName(row.dfName);
    const dbOnlyPair = sourceName ? dbOnlyRowsByName.get(sourceName) : null;
    if (!dbOnlyPair || pairedDbOnlyRows.has(dbOnlyPair)) {
      continue;
    }

    pairByRenamedRow.set(row, dbOnlyPair);
    pairedDbOnlyRows.add(dbOnlyPair);
  }

  const result: ExistingTableColumnDiffRow[] = [];

  for (const row of rows) {
    if (pairedDbOnlyRows.has(row)) {
      continue;
    }

    result.push(row);

    const dbOnlyPair = pairByRenamedRow.get(row);
    if (dbOnlyPair) {
      result.push(dbOnlyPair);
    }
  }

  return result;
};

export const prioritizeUnmappedExistingTableRows = (
  rows: ExistingTableColumnDiffRow[]
): ExistingTableColumnDiffRow[] => {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftIsMapped = MAPPED_EXISTING_TABLE_STATUSES.has(left.row.status);
      const rightIsMapped = MAPPED_EXISTING_TABLE_STATUSES.has(
        right.row.status
      );

      if (leftIsMapped !== rightIsMapped) {
        return leftIsMapped ? 1 : -1;
      }

      return left.index - right.index;
    })
    .map(({ row }) => row);
};

export const summarizeExistingTableColumnDiff = (args: {
  columnDiff: ExistingTableColumnDiffRow[];
  dataframeColumnCount: number;
  dbColumnCount: number;
}): ExistingTableColumnDiffSummary => {
  let missingInDb = 0;
  let missingInDf = 0;
  let blocking = 0;
  let changed = 0;
  let matches = 0;

  for (const row of args.columnDiff) {
    if (row.status === 'missing_in_db') missingInDb++;
    else if (row.status === 'missing_in_dataframe') missingInDf++;
    else if (
      row.status === 'duplicate_effective_target' ||
      row.status === 'invalid'
    )
      blocking++;
    else if (row.status === 'match') matches++;
    else changed++;
  }

  return {
    dfCount: args.dataframeColumnCount,
    dbCount: args.dbColumnCount,
    missingInDb,
    missingInDf,
    typeMismatch: blocking,
    softCast: changed,
    matches,
    countDelta: args.dataframeColumnCount - args.dbColumnCount,
  };
};

export const getExistingTableResolutionValidationErrors = (args: {
  columnDiff: ExistingTableColumnDiffRow[];
  diagnostics?: WriteDiagnostic[] | null | undefined;
}): string[] => {
  return getColumnResolutionValidationErrors({
    rows: args.columnDiff.map(row => ({
      source_name: row.dfName,
      requested_target_name: row.requestedTargetName,
      effective_target_name: row.dbName,
      db_name: row.dbName,
      dtype: row.dbType,
      nullable: null,
      status: row.status,
      reason: row.reason,
    })),
    diagnostics: args.diagnostics,
  });
};

export const getResolvedTargetName = (
  row: Pick<ResolvedColumnMappingRow, 'effective_target_name' | 'db_name'>
): string | null => {
  return normalizeNullableText(row.effective_target_name ?? row.db_name);
};

export const getResolvedTargetColumnNames = (
  rows?: Array<
    Pick<ResolvedColumnMappingRow, 'effective_target_name' | 'db_name'>
  > | null
): string[] => {
  return (rows ?? [])
    .map(row => getResolvedTargetName(row))
    .filter((value): value is string => Boolean(value));
};

export const hasBlockingDiagnostics = (
  diagnostics?: WriteDiagnostic[] | null | undefined
): boolean => {
  return (diagnostics ?? []).some(diagnostic =>
    normalizeText(diagnostic.code).endsWith('_error')
  );
};

export const getColumnResolutionValidationErrors = (args: {
  rows?:
    | ResolvedColumnMappingRow[]
    | WriteColumnResolutionRow[]
    | null
    | undefined;
  diagnostics?: WriteDiagnostic[] | null | undefined;
  blockMissingInDb?: boolean | undefined;
}): string[] => {
  const errors: string[] = [];

  for (const diagnostic of args.diagnostics ?? []) {
    if (normalizeText(diagnostic.code).endsWith('_error')) {
      errors.push(diagnostic.message);
    }
  }

  for (const [index, row] of (args.rows ?? []).entries()) {
    const sourceName = normalizeText(row.source_name) || `#${index + 1}`;
    if (BLOCKING_RESOLUTION_STATUSES.has(row.status)) {
      errors.push(row.reason || `${sourceName}: ${row.status}`);
    }
    if (args.blockMissingInDb && row.status === 'missing_in_db') {
      errors.push(row.reason || `${sourceName}: column is missing in DB.`);
    }
  }

  return errors;
};

export const buildResolveWriteColumnsRequest = (args: {
  connectionMetadata?: DBMetadata | null;
  dataframeMetadata?: DataFrameMetadata | null;
  inputValues?: WriteDataFrameToDBValues | null;
  isTableNew: boolean;
  creationMode: CreationMode;
  requestedMapping?: ColumnMappingItem[] | null | undefined;
}): ResolveWriteColumnsRequest | null => {
  const connectionMetadata = args.connectionMetadata ?? null;
  const dataframeMetadata = args.dataframeMetadata ?? null;
  const inputValues = args.inputValues ?? {};
  const tableName = getLiteralStringValue(inputValues.table_name);
  const connectionId = getDbCatalogConnectionId(connectionMetadata);

  if (!connectionId || !dataframeMetadata || !tableName) {
    return null;
  }

  if (args.isTableNew && args.creationMode !== 'typed') {
    return null;
  }

  const basePayload = {
    connection_id: connectionId,
    database_name: getLiteralStringValue(inputValues.database_name),
    schema_name: getLiteralStringValue(inputValues.schema_name),
    table_name: tableName,
    dataframe_metadata: dataframeMetadata as DataFrameMetadataInput,
    column_mapping: serializeColumnMapping(
      args.requestedMapping ?? inputValues.column_mapping
    ),
  };

  if (args.isTableNew) {
    return {
      mode: 'typed_create',
      ...basePayload,
      table_create_spec: inputValues.table_create_spec ?? null,
    };
  }

  return {
    mode: 'existing_table',
    ...basePayload,
    on_extra_df_columns:
      inputValues.on_extra_df_columns ?? DEFAULT_ON_EXTRA_DF_COLUMNS,
    on_missing_df_columns:
      inputValues.on_missing_df_columns ?? DEFAULT_ON_MISSING_DF_COLUMNS,
  };
};

export const buildResolveWriteColumnsKey = (
  request: ResolveWriteColumnsRequest | null
): string | null => {
  return request ? JSON.stringify(request) : null;
};

export const buildResolveWriteColumnsTriggerKey = (
  request: ResolveWriteColumnsRequest | null
): string | null => {
  if (!request) {
    return null;
  }

  return JSON.stringify({
    mode: request.mode,
    connection_id: request.connection_id,
    database_name: request.database_name ?? null,
    schema_name: request.schema_name ?? null,
    table_name: request.table_name ?? null,
    column_mapping: JSON.parse(
      buildColumnMappingNameKey(request.column_mapping ?? null)
    ),
  });
};

export const buildColumnSelectorOptionsFromMapping = (
  mapping?: ColumnMappingItem[] | null
): Column[] => {
  return (mapping ?? []).map(item => ({
    name: item.target_name,
    dtype: (normalizeText(item.dtype) || 'UNKNOWN') as DataType,
    nullable: item.nullable ?? true,
  }));
};

export const buildTargetColumnNameSet = (
  mapping?: ColumnMappingItem[] | null
): Set<string> => {
  return new Set(
    (mapping ?? []).map(item => normalizeName(item.target_name)).filter(Boolean)
  );
};

export const buildChangedMappingPreviewItems = (
  changedMappingItems: ColumnMappingItem[],
  mappingChangeStateBySource: Map<string, ColumnMappingChangeState>,
  limit = 5
): ChangedColumnMappingPreviewItem[] => {
  const normalizedLimit = Math.max(0, limit);

  return changedMappingItems.slice(0, normalizedLimit).map(item => {
    const state = mappingChangeStateBySource.get(
      normalizeName(item.source_name)
    );
    const tokens: string[] = [];
    if (state?.dtypeChanged) {
      tokens.push(String(item.dtype));
    }
    if (state?.nullableChanged) {
      tokens.push(item.nullable ? 'NULL' : 'NOT NULL');
    }

    return {
      item,
      state,
      tokens,
    };
  });
};

export const getColumnMappingValidationErrors = (
  mapping?: ColumnMappingItem[] | null
): string[] => {
  const errors: string[] = [];
  const seenSourceNames = new Set<string>();
  const seenTargetNames = new Set<string>();

  for (const [index, item] of (mapping ?? []).entries()) {
    const rowNumber = index + 1;
    const sourceName = normalizeText(item.source_name);
    const targetName = normalizeText(item.target_name);
    const dtype = normalizeText(item.dtype);
    const normalizedSource = normalizeName(sourceName);
    const normalizedTarget = normalizeName(targetName);

    if (!sourceName) {
      errors.push(`Строка ${rowNumber}: source_name не может быть пустым.`);
    } else if (seenSourceNames.has(normalizedSource)) {
      errors.push(
        `Строка ${rowNumber}: source_name "${sourceName}" дублируется.`
      );
    } else {
      seenSourceNames.add(normalizedSource);
    }

    if (!targetName) {
      errors.push(`Строка ${rowNumber}: target_name не может быть пустым.`);
    } else if (seenTargetNames.has(normalizedTarget)) {
      errors.push(
        `Строка ${rowNumber}: target_name "${targetName}" должен быть уникален без учета регистра.`
      );
    } else {
      seenTargetNames.add(normalizedTarget);
    }

    if (!dtype) {
      errors.push(`Строка ${rowNumber}: dtype обязателен.`);
    }
  }

  return errors;
};

export const buildDataFrameMetadataFromColumnMapping = (args: {
  dataframeMetadata: DataFrameMetadata;
  mapping?: ColumnMappingItem[] | null | undefined;
}): DataFrameMetadataInput => {
  const mapping = buildColumnMapping({
    dataframeMetadata: args.dataframeMetadata,
    existingMapping: args.mapping,
  });
  const sourceColumnsByName = new Map(
    (args.dataframeMetadata.columns ?? []).map(column => [
      normalizeName(column.name),
      column,
    ])
  );

  return {
    ...args.dataframeMetadata,
    columns: mapping.map(item => {
      const sourceColumn = sourceColumnsByName.get(
        normalizeName(item.source_name)
      );

      return {
        name: item.target_name,
        dtype: (normalizeText(item.dtype) || 'UNKNOWN') as DataType,
        dtype_metadata: sourceColumn?.dtype_metadata ?? null,
        nullable: item.nullable ?? true,
      };
    }),
  };
};

export const buildDbColumnsFromColumnMapping = (args: {
  dataframeMetadata: DataFrameMetadata;
  mapping?: ColumnMappingItem[] | null | undefined;
}): DbColumn[] => {
  const mapping = buildColumnMapping({
    dataframeMetadata: args.dataframeMetadata,
    existingMapping: args.mapping,
  });
  const sourceColumnsByName = new Map(
    (args.dataframeMetadata.columns ?? []).map(column => [
      normalizeName(column.name),
      column,
    ])
  );

  return mapping.map(item => {
    const sourceColumn = sourceColumnsByName.get(
      normalizeName(item.source_name)
    );

    return {
      name: item.target_name,
      dtype: (normalizeText(item.dtype) || 'UNKNOWN') as DataType,
      dtype_metadata: sourceColumn?.dtype_metadata ?? null,
      nullable: item.nullable ?? true,
      index: null,
      indexes: null,
      primary_key: null,
    };
  });
};

export const normalizeTableCreateSpecColumns = (
  value?: GatewayTableCreateSpec | null,
  allowedColumnNames: string[] = []
): GatewayTableCreateSpec | null => {
  if (!value) {
    return null;
  }

  const allowedColumns = new Set(
    allowedColumnNames
      .map(columnName => normalizeName(columnName))
      .filter(Boolean)
  );
  const primaryKeyCols = filterAllowedColumns(
    value.primary_key_cols,
    allowedColumns
  );
  const indexes = (value.indexes ?? [])
    .map(index => ({
      ...index,
      columns: filterAllowedColumns(index.columns, allowedColumns),
      name: normalizeNullableText(index.name),
      unique: Boolean(index.unique),
    }))
    .filter(index => index.columns.length > 0);
  const foreignKeys = (value.foreign_keys ?? [])
    .map(foreignKey => ({
      ...foreignKey,
      columns: filterAllowedColumns(foreignKey.columns, allowedColumns),
      name: normalizeNullableText(foreignKey.name),
      ref_schema: normalizeNullableText(foreignKey.ref_schema),
      ref_table: normalizeText(foreignKey.ref_table),
      ref_columns: filterAllowedColumns(
        foreignKey.ref_columns,
        new Set(
          toStringArray(foreignKey.ref_columns).map(columnName =>
            normalizeName(columnName)
          )
        )
      ),
    }))
    .filter(foreignKey => {
      return (
        foreignKey.columns.length > 0 &&
        foreignKey.ref_columns.length > 0 &&
        foreignKey.ref_table.length > 0
      );
    });
  const clickhouse = value.clickhouse
    ? {
        ...value.clickhouse,
        engine_name: value.clickhouse.engine_name ?? 'MergeTree',
        order_by:
          filterAllowedColumns(value.clickhouse.order_by, allowedColumns)
            .length > 0
            ? filterAllowedColumns(value.clickhouse.order_by, allowedColumns)
            : null,
        partition_by:
          filterAllowedColumns(value.clickhouse.partition_by, allowedColumns)
            .length > 0
            ? filterAllowedColumns(
                value.clickhouse.partition_by,
                allowedColumns
              )
            : null,
        primary_key:
          filterAllowedColumns(value.clickhouse.primary_key, allowedColumns)
            .length > 0
            ? filterAllowedColumns(value.clickhouse.primary_key, allowedColumns)
            : null,
        sample_by:
          filterAllowedColumns(value.clickhouse.sample_by, allowedColumns)
            .length > 0
            ? filterAllowedColumns(value.clickhouse.sample_by, allowedColumns)
            : null,
        summing_columns:
          filterAllowedColumns(value.clickhouse.summing_columns, allowedColumns)
            .length > 0
            ? filterAllowedColumns(
                value.clickhouse.summing_columns,
                allowedColumns
              )
            : null,
        sign_column: filterAllowedScalarColumn(
          value.clickhouse.sign_column,
          allowedColumns
        ),
        version_column: filterAllowedScalarColumn(
          value.clickhouse.version_column,
          allowedColumns
        ),
        ttl_expression: normalizeNullableText(value.clickhouse.ttl_expression),
        table_path: normalizeNullableText(value.clickhouse.table_path),
        replica_name: normalizeNullableText(value.clickhouse.replica_name),
        settings:
          Object.keys(value.clickhouse.settings ?? {}).length > 0
            ? Object.entries(value.clickhouse.settings ?? {}).reduce<
                Record<string, string | number | boolean>
              >((accumulator, [key, settingValue]) => {
                accumulator[key] = parseLooseScalar(String(settingValue)) as
                  | string
                  | number
                  | boolean;
                return accumulator;
              }, {})
            : null,
      }
    : null;

  const normalizedClickhouse =
    clickhouse && hasClickHouseConfig(clickhouse) ? clickhouse : null;
  const hasContent =
    primaryKeyCols.length > 0 ||
    indexes.length > 0 ||
    foreignKeys.length > 0 ||
    Boolean(normalizedClickhouse);

  if (!hasContent) {
    return null;
  }

  return {
    primary_key_cols: serializePrimaryKeyCols(primaryKeyCols),
    indexes: indexes.length > 0 ? indexes : null,
    foreign_keys: foreignKeys.length > 0 ? foreignKeys : null,
    clickhouse: normalizedClickhouse,
  };
};

export const normalizeTableCreateSpecForDialect = (args: {
  connectionMetadata?: DBMetadata | null;
  value?: GatewayTableCreateSpec | null;
  allowedColumnNames?: string[];
}): GatewayTableCreateSpec | null => {
  const normalized = normalizeTableCreateSpecColumns(
    args.value,
    args.allowedColumnNames ?? []
  );

  if (!normalized) {
    return null;
  }

  const dialect = args.connectionMetadata?.dialect?.toLowerCase() ?? '';

  if (dialect.includes('clickhouse')) {
    return normalized;
  }

  return {
    ...normalized,
    clickhouse: null,
  };
};

export const getTypedSpecValidationErrors = (args: {
  connectionMetadata?: DBMetadata | null;
  mapping?: ColumnMappingItem[] | null | undefined;
  tableCreateSpec?: GatewayTableCreateSpec | null | undefined;
  upsertKeyColumn?: string | null | undefined;
  requireUpsertKey?: boolean | undefined;
  requireClickHouseCoreFields?: boolean | undefined;
}): string[] => {
  const errors = [...getColumnMappingValidationErrors(args.mapping)];
  const targetColumns = new Set(
    (args.mapping ?? [])
      .map(item => normalizeName(item.target_name))
      .filter(Boolean)
  );
  const normalizedUpsertKey = normalizeNullableText(args.upsertKeyColumn);

  if (args.requireUpsertKey && !normalizedUpsertKey) {
    errors.push('Для режима upsert укажите key column.');
  } else if (
    normalizedUpsertKey &&
    targetColumns.size > 0 &&
    !targetColumns.has(normalizeName(normalizedUpsertKey))
  ) {
    errors.push(
      `Upsert key column "${normalizedUpsertKey}" должен ссылаться на target_name из column_mapping.`
    );
  }

  const normalizedSpec = normalizeTableCreateSpecColumns(
    args.tableCreateSpec,
    (args.mapping ?? []).map(item => item.target_name)
  );
  const spec = args.tableCreateSpec ?? null;

  if (spec && normalizedSpec == null) {
    errors.push(
      'Table create spec содержит ссылки на колонки вне target_name или пустые конструкции.'
    );
  }

  const dialect = args.connectionMetadata?.dialect?.toLowerCase() ?? '';
  const clickhouse = normalizedSpec?.clickhouse;
  const hasOrderBy =
    (clickhouse?.order_by ?? []).some(columnName =>
      normalizeText(columnName)
    ) ?? false;
  const hasPrimaryKey =
    (clickhouse?.primary_key ?? []).some(columnName =>
      normalizeText(columnName)
    ) ?? false;

  if (
    (args.requireClickHouseCoreFields ?? true) &&
    dialect.includes('clickhouse') &&
    !hasOrderBy &&
    !hasPrimaryKey
  ) {
    errors.push(
      'Для ClickHouse в Typed Table spec нужно заполнить Order by или Primary key.'
    );
  }

  return errors;
};

export const shouldShowCreateTableSql = (
  _inputValues: WriteDataFrameToDBValues,
  isTableNew: boolean,
  creationMode: CreationMode = DEFAULT_CREATION_MODE
): boolean => {
  return isTableNew && creationMode === 'raw';
};

export const buildCreateSqlCacheKey = (args: {
  connectionMetadata?: DBMetadata | null;
  dataframeMetadata?: DataFrameMetadata | null;
  inputValues: WriteDataFrameToDBValues;
  mode: CreationMode;
}): string => {
  const mappingFingerprint = serializeColumnMapping(
    args.inputValues.column_mapping
  )
    ?.map(item => {
      return [
        item.source_name,
        item.target_name,
        item.dtype,
        String(item.nullable),
      ].join(':');
    })
    .join('|');
  const dataframeFingerprint = (args.dataframeMetadata?.columns ?? [])
    .map(column => {
      return [
        column.name,
        String(column.dtype ?? ''),
        String(column.nullable ?? ''),
      ].join(':');
    })
    .join('|');

  return [
    args.mode,
    getSelectorFingerprintValue(args.inputValues.table_name),
    getSelectorFingerprintValue(args.inputValues.database_name),
    getSelectorFingerprintValue(args.inputValues.schema_name),
    args.connectionMetadata?.connection_id ?? '',
    args.connectionMetadata?.connection_revision ?? '',
    mappingFingerprint ?? dataframeFingerprint,
    JSON.stringify(args.inputValues.table_create_spec ?? null),
  ].join('::');
};

export const isTargetStepValid = (
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

  return true;
};

export const isWriteModeStepValid = (
  inputValues: WriteDataFrameToDBValues,
  sharedState?: ExtensionState
): boolean => {
  if (!isNonEmpty(inputValues?.write_mode)) {
    return false;
  }

  const isUpsert =
    normalizeText(inputValues?.write_mode).toLowerCase() === 'upsert';

  if (!isUpsert) {
    return true;
  }

  if (!isNonEmpty(inputValues?.upsert_config?.key_column)) {
    return false;
  }

  const isTableNew = sharedState?.isTableNew ?? false;
  const creationMode = resolveCreationMode(sharedState, inputValues);
  const dataframeMetadata = sharedState?.inputDataframeMetadata ?? null;

  if (!isTableNew || creationMode !== 'typed' || !dataframeMetadata) {
    return true;
  }

  const mapping = buildColumnMapping({
    dataframeMetadata,
    existingMapping: inputValues?.column_mapping,
  });
  const typedErrors = getTypedSpecValidationErrors({
    connectionMetadata: sharedState?.inputConnectionMetadata ?? null,
    mapping,
    tableCreateSpec: inputValues?.table_create_spec,
    upsertKeyColumn: inputValues?.upsert_config?.key_column ?? null,
    requireUpsertKey: true,
    requireClickHouseCoreFields: false,
  });

  return typedErrors.length === 0;
};

export const isSchemaStrategyStepValid = (
  inputValues: WriteDataFrameToDBValues,
  sharedState?: ExtensionState
): boolean => {
  const isTableNew = sharedState?.isTableNew ?? false;

  if (getSyncingColumnCount(sharedState?.columnResolveStates) > 0) {
    return false;
  }

  if (!isTableNew) {
    // Пока backend разрешает колонки существующей таблицы (или запрос
    // завершился ошибкой), блокируем переход — нужно успешное разрешение.
    if (sharedState?.isResolvingColumns || sharedState?.resolveColumnsError) {
      return false;
    }
    return true;
  }

  if (sharedState?.isCreateSqlLoading || sharedState?.isCreateTableLoading) {
    return false;
  }

  const connectionMetadata = sharedState?.inputConnectionMetadata ?? null;
  const dataframeMetadata = sharedState?.inputDataframeMetadata ?? null;

  if (!connectionMetadata || !dataframeMetadata) {
    return false;
  }

  const creationMode = resolveCreationMode(sharedState, inputValues);

  if (creationMode === 'raw') {
    return isNonEmpty(inputValues?.create_table_sql);
  }

  if (sharedState?.isResolvingColumns || sharedState?.resolveColumnsError) {
    return false;
  }

  const mapping = buildColumnMapping({
    dataframeMetadata,
    existingMapping: inputValues?.column_mapping,
  });
  const typedErrors = getTypedSpecValidationErrors({
    connectionMetadata,
    mapping,
    tableCreateSpec: inputValues?.table_create_spec,
    upsertKeyColumn: null,
    requireUpsertKey: false,
    requireClickHouseCoreFields: false,
  });

  const resolutionErrors = getColumnResolutionValidationErrors({
    rows: sharedState?.resolvedColumnRows,
    diagnostics: sharedState?.resolvedDiagnostics,
  });

  return typedErrors.length === 0 && resolutionErrors.length === 0;
};

export const isWriteSettingsStepValid = (
  inputValues: WriteDataFrameToDBValues,
  sharedState?: ExtensionState
): boolean => {
  const isTableNew = sharedState?.isTableNew ?? false;
  const creationMode = resolveCreationMode(sharedState, inputValues);

  if (!isTableNew || creationMode !== 'typed') {
    return true;
  }

  const connectionMetadata = sharedState?.inputConnectionMetadata ?? null;
  const dataframeMetadata = sharedState?.inputDataframeMetadata ?? null;

  if (!connectionMetadata || !dataframeMetadata) {
    return false;
  }

  const requestedMapping = buildRequestedColumnMappingDraft({
    dataframeMetadata,
    existingMapping: inputValues.column_mapping,
    existingDraft: sharedState?.requestedColumnMappingDraft,
  });
  const mapping =
    serializeColumnMapping(inputValues.column_mapping) ?? requestedMapping;
  const writeMode = normalizeText(inputValues.write_mode).toLowerCase();

  return (
    getTypedSpecValidationErrors({
      connectionMetadata,
      mapping,
      tableCreateSpec: inputValues.table_create_spec,
      upsertKeyColumn: inputValues.upsert_config?.key_column ?? null,
      requireUpsertKey: writeMode === 'upsert',
    }).length === 0
  );
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
  const creationMode = resolveCreationMode(sharedState, inputValues);

  return [
    getSelectorFingerprintValue(inputValues.table_name),
    getSelectorFingerprintValue(inputValues.database_name),
    getSelectorFingerprintValue(inputValues.schema_name),
    inputValues.create_table_sql ?? '',
    JSON.stringify(serializeColumnMapping(inputValues.column_mapping) ?? null),
    JSON.stringify(inputValues.table_create_spec ?? null),
    connectionMetadata?.connection_id ?? '',
    connectionMetadata?.connection_revision ?? '',
    creationMode,
  ].join('::');
};

export const confirmWriteModeOnContinue = async (
  context: StepOnContinueContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<boolean> => {
  const writeMode = normalizeText(context.inputValues.write_mode).toLowerCase();
  const isTableNew = context.sharedState?.isTableNew ?? false;

  if (isTableNew || writeMode !== 'truncate') {
    return true;
  }

  const requestConfirm = context.sharedState?.requestTruncateConfirm;
  if (!requestConfirm) {
    return false;
  }

  const tableLabel =
    buildSelectedWriteTargetLabel(context.inputValues) || 'выбранной таблицы';
  return requestConfirm(tableLabel);
};

export const prepareWriteStepOnContinue = async (
  context: StepOnContinueContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<void> => {
  const { setSharedState, sharedState } = context;

  setSharedState(prev => ({
    ...(prev ?? {}),
    createTableError: null,
    createTableSuccess: null,
    createTableSuccessAt: null,
    isCreateTableLoading: false,
    lastCreateTableKey: null,
  }));

  const actions = sharedState?.selectedColumnActions ?? [];

  if (actions.length === 0) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      isApplyingColumnActions: false,
      applyColumnActionsError: null,
      applyColumnActionsSuccess: null,
      applyColumnActionsSuccessAt: null,
    }));
    return;
  }

  const confirmed = sharedState?.requestColumnActionsConfirm
    ? await sharedState.requestColumnActionsConfirm(actions)
    : false;

  if (!confirmed) {
    // Прерываем переход к следующему шагу.
    throw new Error('COLUMN_ACTIONS_CANCELLED');
  }

  const connectionMetadata = sharedState?.inputConnectionMetadata ?? null;
  if (!connectionMetadata) {
    throw new Error('Отсутствует connection metadata для применения действий.');
  }

  const tableName = getLiteralStringValue(context.inputValues.table_name);
  if (!tableName) {
    throw new Error('Не задано имя target table.');
  }

  setSharedState(prev => ({
    ...(prev ?? {}),
    isApplyingColumnActions: true,
    applyColumnActionsError: null,
    applyColumnActionsSuccess: null,
    applyColumnActionsSuccessAt: null,
  }));

  void client.utils.ddl.applyTableColumnActions
    .post(
      {
        body: {
          connection_id: requireDbConnectionId(connectionMetadata),
          table_name: tableName,
          database_name: getLiteralStringValue(
            context.inputValues.database_name
          ),
          schema_name: getLiteralStringValue(context.inputValues.schema_name),
          actions,
        },
      },
      { silent: true }
    )
    .then(response => {
      // Обновляем метаданные таблицы глобально свежими данными из ответа.
      if (response.data.table_metadata) {
        sharedState?.applyTableMetadataUpdate?.(response.data.table_metadata);
      }

      setSharedState(prev => ({
        ...(prev ?? {}),
        isApplyingColumnActions: false,
        applyColumnActionsError: null,
        applyColumnActionsSuccess:
          response.data.message || 'Изменения схемы применены.',
        applyColumnActionsSuccessAt: Date.now(),
        // Действия применены — сбрасываем выбор, чтобы при возврате на шаг
        // повторно не предлагалось подтвердить уже применённые изменения.
        selectedColumnActions: [],
        // Инвалидируем резолв, чтобы при возврате назад diff перечитался.
        lastResolveColumnsKey: null,
      }));
    })
    .catch((error: unknown) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        isApplyingColumnActions: false,
        applyColumnActionsError:
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Не удалось применить изменения схемы через backend.',
      }));
    });
};

export const isColumnActionsApplyReady = async (
  context: StepLoadingConditionContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<boolean> => {
  const sharedState = context.sharedState;

  if (sharedState?.isApplyingColumnActions) {
    return false;
  }

  if (sharedState?.applyColumnActionsError) {
    return false;
  }

  if (sharedState?.applyColumnActionsSuccess) {
    const successTimestamp = sharedState?.applyColumnActionsSuccessAt ?? null;
    if (successTimestamp == null) {
      return false;
    }

    const elapsed = Date.now() - successTimestamp;
    return elapsed >= CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS;
  }

  return true;
};

export const shouldShowColumnActionsLoadingOverlay = (
  context: StepLoadingConditionContext<WriteDataFrameToDBValues, ExtensionState>
): boolean => {
  const sharedState = context.sharedState;

  if (
    (sharedState?.selectedColumnActions?.length ?? 0) > 0 ||
    sharedState?.isApplyingColumnActions ||
    sharedState?.applyColumnActionsError
  ) {
    return true;
  }

  if (!sharedState?.applyColumnActionsSuccess) {
    return false;
  }

  const successTimestamp = sharedState.applyColumnActionsSuccessAt ?? null;
  if (successTimestamp == null) {
    return true;
  }

  return (
    Date.now() - successTimestamp < CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS
  );
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
  context: StepBeforeFinishContext<WriteDataFrameToDBValues, ExtensionState>;
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
  context: StepBeforeFinishContext<WriteDataFrameToDBValues, ExtensionState>;
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

  const mapping = buildColumnMapping({
    dataframeMetadata,
    existingMapping: context.inputValues.column_mapping,
  });
  const mappingErrors = getColumnMappingValidationErrors(mapping);

  if (mappingErrors.length > 0) {
    throw new Error(mappingErrors[0]);
  }

  const normalizedTypedSpec = normalizeTableCreateSpecForDialect({
    connectionMetadata,
    value: context.inputValues.table_create_spec ?? null,
    allowedColumnNames: mapping.map(item => item.target_name),
  });

  await client.utils.ddl.createTable.post(
    {
      body: {
        mode: 'from_schema',
        table_name: tableName,
        connection_id: connectionId,
        database_name: getLiteralStringValue(context.inputValues.database_name),
        schema_name: getLiteralStringValue(context.inputValues.schema_name),
        columns: buildDbColumnsFromColumnMapping({
          dataframeMetadata,
          mapping,
        }),
        table_create_spec: normalizedTypedSpec as any,
        on_exists: 'error',
      },
    },
    { silent: true }
  );

  context.sharedState?.invalidateCatalog?.();

  return 'Таблица успешно создана из Typed table spec.';
};

export const createTableBeforeFinish = async (
  context: StepBeforeFinishContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<boolean> => {
  const { sharedState, setSharedState } = context;
  const isTableNew = sharedState?.isTableNew ?? false;

  if (!isTableNew) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      isCreateTableLoading: false,
      createTableSuccessAt: null,
    }));
    return true;
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
    return false;
  }

  const creationMode = resolveCreationMode(sharedState, context.inputValues);
  const createTableKey = buildCreateTableKey(context.inputValues, sharedState);
  if (
    sharedState?.lastCreateTableKey === createTableKey &&
    !sharedState?.createTableError &&
    !!sharedState?.createTableSuccess
  ) {
    const successAt = sharedState.createTableSuccessAt ?? Date.now();
    setSharedState(prev => ({
      ...(prev ?? {}),
      isCreateTableLoading: false,
      createTableSuccessAt: successAt,
    }));
    await waitForCreateTableSuccessTransition(successAt);
    return true;
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

    const successAt = Date.now();
    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError: null,
      createTableSuccess: message,
      createTableSuccessAt: successAt,
      isCreateTableLoading: false,
      lastCreateTableKey: createTableKey,
    }));

    await waitForCreateTableSuccessTransition(successAt);
    return true;
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

    return false;
  }
};
