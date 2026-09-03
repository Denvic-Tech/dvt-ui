import {
  buildSelectedTableLabel,
  findSelectedTable,
  getDatabaseOptions,
  getFilteredTables,
  getLiteralStringValue,
  getSchemaOptions,
  getSelectorCollapsedValue,
  type MetadataOption,
} from '@/features/node/db-target-selector/model/helpers';

import {
  type DataFrameMetadata,
  type DbMetadata,
  type DbTable,
  type InputDefinitionModel,
  zIo,
} from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';
import { isExpressionValue } from '@/shared/lib/node-input-values';
import {
  DEFAULT_UNSET_SENTINEL,
  hydrateDefaultLiteralDraft,
  parseDefaultLiteralDraft,
} from '@/shared/lib/variables';

import type {
  ManualTargetDraft,
  ManualVariableDraft,
  ReadVariablesFromDBMode,
  SelectorValue,
  SqlVariablePolicyDraft,
} from './types';

const FALLBACK_AGGREGATIONS = [
  'min',
  'max',
  'count',
  'count_distinct',
  'sum',
  'avg',
  'first',
  'last',
] as const;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const createDraftID = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeSelectorValue = (value: unknown): SelectorValue => {
  if (typeof value === 'string') {
    return value;
  }

  return isExpressionValue(value) ? value : undefined;
};

const sanitizeSelectorValueForPayload = (
  value: SelectorValue
): SelectorValue => {
  if (typeof value === 'string') {
    return value.trim() ? value : undefined;
  }

  return isExpressionValue(value) ? value : undefined;
};

const resolveDialectFromMetadata = (
  connectionMetadata: DbMetadata | null | undefined
): string | null => {
  return connectionMetadata?.dialect?.toLowerCase() ?? null;
};

const readManualTargetFromRecord = (
  record: Record<string, unknown>
): ManualTargetDraft => ({
  database_name: normalizeSelectorValue(record['database_name']),
  schema_name: normalizeSelectorValue(record['schema_name']),
  table_name: normalizeSelectorValue(record['table_name']),
});

export const getMode = (value: unknown): ReadVariablesFromDBMode =>
  value === 'sql' ? 'sql' : 'manual';

export const hasConfiguredSelectorValue = (value: SelectorValue): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return isExpressionValue(value);
};

export const hasConfiguredManualTarget = (target: ManualTargetDraft): boolean =>
  hasConfiguredSelectorValue(target.table_name);

export const getSupportedAggregations = ({
  connectionMetadata,
  nodeDefinition,
}: {
  connectionMetadata: DbMetadata | null | undefined;
  nodeDefinition: {
    additional_schema?: Record<string, unknown> | null | undefined;
  };
}): string[] => {
  const readVariablesSchema = isObjectRecord(nodeDefinition.additional_schema)
    ? nodeDefinition.additional_schema['read_variables_from_db']
    : null;
  const manualModeSchema = isObjectRecord(readVariablesSchema)
    ? readVariablesSchema['manual_mode']
    : null;
  const aggregationsByDialect = isObjectRecord(manualModeSchema)
    ? manualModeSchema['aggregations_by_dialect']
    : null;
  const dialect = resolveDialectFromMetadata(connectionMetadata);

  if (dialect && isObjectRecord(aggregationsByDialect)) {
    const dialectAggregations = aggregationsByDialect[dialect];
    if (Array.isArray(dialectAggregations)) {
      return dialectAggregations.filter(
        (value): value is string => typeof value === 'string'
      );
    }
  }

  return [...FALLBACK_AGGREGATIONS];
};

export const getOrderByRequiredAggregations = (nodeDefinition: {
  additional_schema?: Record<string, unknown> | null | undefined;
}): Set<string> => {
  const readVariablesSchema = isObjectRecord(nodeDefinition.additional_schema)
    ? nodeDefinition.additional_schema['read_variables_from_db']
    : null;
  const manualModeSchema = isObjectRecord(readVariablesSchema)
    ? readVariablesSchema['manual_mode']
    : null;
  const rawValue = isObjectRecord(manualModeSchema)
    ? manualModeSchema['order_by_required_for']
    : null;

  if (Array.isArray(rawValue)) {
    return new Set(
      rawValue.filter((value): value is string => typeof value === 'string')
    );
  }

  return new Set(['first', 'last']);
};

export const buildSelectorInputDefinition = (
  attrName: string,
  label: string
): InputDefinitionModel => ({
  attr_name: attrName,
  display_name: label,
  type: zIo.enum.STRING,
  display_type: 'STRING',
  is_list_type: false,
  is_literal_type: false,
  options: null,
  optional: true,
  is_hidden: false,
  description: null,
  default: '',
  multiline: false,
  metadata_source_field: null,
  min_value: null,
  max_value: null,
  step: null,
  round_val: null,
  schema: null,
  allow_multiple_connections: false,
  allow_new: false,
  allow_expressions: true,
  expression_policy: 'default',
  force_handle_visible: false,
});

export const hydrateManualTarget = (
  rawValue: unknown
): {
  hasMixedTargets: boolean;
  target: ManualTargetDraft;
} => {
  if (!isObjectRecord(rawValue)) {
    return {
      hasMixedTargets: false,
      target: {},
    };
  }

  let referenceTarget: ManualTargetDraft | null = null;
  let hasMixedTargets = false;

  Object.values(rawValue).forEach(payload => {
    const record = isObjectRecord(payload) ? payload : {};
    const nextTarget = readManualTargetFromRecord(record);

    if (!referenceTarget) {
      referenceTarget = nextTarget;
      return;
    }

    if (JSON.stringify(referenceTarget) !== JSON.stringify(nextTarget)) {
      hasMixedTargets = true;
    }
  });

  if (hasMixedTargets) {
    return {
      hasMixedTargets: true,
      target: {},
    };
  }

  return {
    hasMixedTargets: false,
    target: referenceTarget ?? {},
  };
};

export const hydrateManualVariableDrafts = (
  rawValue: unknown
): ManualVariableDraft[] => {
  if (!isObjectRecord(rawValue)) {
    return [];
  }

  return Object.entries(rawValue).map(([name, payload]) => {
    const record = isObjectRecord(payload) ? payload : {};

    return {
      id: createDraftID('read-variables-manual'),
      name,
      column_name: normalizeSelectorValue(record['column_name']),
      aggregation:
        typeof record['aggregation'] === 'string' &&
        record['aggregation'].trim()
          ? record['aggregation']
          : 'count',
      order_by_column: normalizeSelectorValue(record['order_by_column']),
      nullable: Boolean(record['nullable']),
      default_literal: hydrateDefaultLiteralDraft(record['default']),
    };
  });
};

export const buildEmptyManualVariableDraft = (): ManualVariableDraft => ({
  id: createDraftID('read-variables-manual'),
  name: '',
  aggregation: 'count',
  nullable: false,
  default_literal: '',
});

export const serializeManualVariableDrafts = (
  rows: ManualVariableDraft[],
  target: ManualTargetDraft
): Record<string, unknown> => {
  return rows.reduce<Record<string, unknown>>((acc, row) => {
    const trimmedName = row.name.trim();
    if (!trimmedName) {
      return acc;
    }

    const parsedDefault = parseDefaultLiteralDraft(row.default_literal);
    const payload: Record<string, unknown> = {
      aggregation: row.aggregation,
      nullable: row.nullable,
      default: parsedDefault.error
        ? DEFAULT_UNSET_SENTINEL
        : parsedDefault.value,
    };

    const nextDatabaseName = sanitizeSelectorValueForPayload(
      target.database_name
    );
    if (nextDatabaseName !== undefined) {
      payload['database_name'] = nextDatabaseName;
    }

    const nextSchemaName = sanitizeSelectorValueForPayload(target.schema_name);
    if (nextSchemaName !== undefined) {
      payload['schema_name'] = nextSchemaName;
    }

    const nextTableName = sanitizeSelectorValueForPayload(target.table_name);
    if (nextTableName !== undefined) {
      payload['table_name'] = nextTableName;
    }

    const nextColumnName = sanitizeSelectorValueForPayload(row.column_name);
    if (nextColumnName !== undefined) {
      payload['column_name'] = nextColumnName;
    }

    const nextOrderByColumn = sanitizeSelectorValueForPayload(
      row.order_by_column
    );
    if (nextOrderByColumn !== undefined) {
      payload['order_by_column'] = nextOrderByColumn;
    }

    acc[trimmedName] = payload;
    return acc;
  }, {});
};

export const buildManualVariablePayloadFingerprint = (value: unknown): string =>
  JSON.stringify(value ?? {});

export const buildSqlPreviewFingerprint = ({
  connectionID,
  sqlQuery,
}: {
  connectionID: string | null | undefined;
  sqlQuery: string;
}): string => `${connectionID ?? ''}::${sqlQuery}`;

export const extractSqlQueryText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  return isExpressionValue(value) && value.expression_kind === 'template'
    ? value.value
    : '';
};

export const buildSqlPolicyDrafts = ({
  columns,
  rawValue,
}: {
  columns: Array<{ dtype?: string | null | undefined; name: string }>;
  rawValue: unknown;
}): SqlVariablePolicyDraft[] => {
  const overrides = isObjectRecord(rawValue) ? rawValue : {};

  return columns.map(column => {
    const rawPayload = overrides[column.name];
    const payload = isObjectRecord(rawPayload) ? rawPayload : {};

    return {
      id: createDraftID('read-variables-sql'),
      name: column.name,
      dtype: column.dtype,
      nullable: Boolean(payload['nullable']),
      default_literal: hydrateDefaultLiteralDraft(payload['default']),
    };
  });
};

export const serializeSqlPolicyDrafts = (
  rows: SqlVariablePolicyDraft[]
): Record<string, unknown> => {
  return rows.reduce<Record<string, unknown>>((acc, row) => {
    const parsedDefault = parseDefaultLiteralDraft(row.default_literal);
    const shouldInclude = row.nullable || !parsedDefault.isUnset;

    if (!shouldInclude) {
      return acc;
    }

    const payload: Record<string, unknown> = {
      nullable: row.nullable,
      default: parsedDefault.error
        ? DEFAULT_UNSET_SENTINEL
        : parsedDefault.value,
    };

    acc[row.name] = payload;
    return acc;
  }, {});
};

export const findManualVariableTable = ({
  connectionMetadata,
  target,
}: {
  connectionMetadata: DbMetadata | null | undefined;
  target: ManualTargetDraft;
}): DbTable | null => {
  return findSelectedTable(connectionMetadata ?? null, {
    database_name: target.database_name,
    schema_name: target.schema_name,
    table_name: target.table_name,
  });
};

export const getManualDatabaseMetadataOptions = (
  connectionMetadata: DbMetadata | null | undefined
): MetadataOption[] => getDatabaseOptions(connectionMetadata ?? null);

export const getManualSchemaMetadataOptions = ({
  connectionMetadata,
  databaseName,
}: {
  connectionMetadata: DbMetadata | null | undefined;
  databaseName?: SelectorValue;
}): MetadataOption[] =>
  getSchemaOptions(connectionMetadata ?? null, databaseName);

export const getManualFilteredTables = ({
  connectionMetadata,
  databaseName,
  schemaName,
}: {
  connectionMetadata: DbMetadata | null | undefined;
  databaseName?: SelectorValue;
  schemaName?: SelectorValue;
}): DbTable[] =>
  getFilteredTables(connectionMetadata ?? null, databaseName, schemaName);

export const getManualColumnOptions = (table: DbTable | null): string[] =>
  table?.columns.map(column => column.name) ?? [];

export const getManualColumnNullable = ({
  columnValue,
  table,
}: {
  columnValue: SelectorValue;
  table: DbTable | null;
}): boolean | undefined => {
  const columnName = getLiteralStringValue(columnValue);
  if (!columnName) {
    return undefined;
  }

  const matchedColumn = table?.columns.find(
    column => column.name === columnName
  );
  if (!matchedColumn) {
    return undefined;
  }

  return Boolean(matchedColumn.nullable);
};

export const getSqlPreviewColumns = (
  metadata: DataFrameMetadata | null | undefined
) => metadata?.columns ?? [];

export const getManualDatabaseCollapsedValue = (target: ManualTargetDraft) =>
  getSelectorCollapsedValue(target.database_name, 'База не выбрана');

export const getManualSchemaCollapsedValue = (target: ManualTargetDraft) =>
  getSelectorCollapsedValue(target.schema_name, 'Схема не выбрана');

export const getManualTableCollapsedValue = (target: ManualTargetDraft) =>
  getSelectorCollapsedValue(target.table_name, 'Таблица не выбрана');

export const getManualSelectedTableLabel = (target: ManualTargetDraft) =>
  buildSelectedTableLabel({
    databaseName: target.database_name,
    schemaName: target.schema_name,
    tableName: target.table_name,
  });

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const payload = (error as { payload?: ApiErrorPayload } | null | undefined)
    ?.payload;
  if (typeof payload?.detail === 'string' && payload.detail.trim()) {
    return payload.detail;
  }

  const metaDetail = (
    payload?.meta as { exc_data?: { detail?: unknown } } | undefined
  )?.exc_data?.detail;
  if (typeof metaDetail === 'string' && metaDetail.trim()) {
    return metaDetail;
  }

  return fallbackMessage;
};

export const getManualVariableLabelWithTarget = ({
  row,
  target,
}: {
  row: ManualVariableDraft;
  target: ManualTargetDraft;
}): string => {
  const tableName = getLiteralStringValue(target.table_name) ?? 'Table';
  const columnName = getLiteralStringValue(row.column_name) ?? 'column';
  return `${tableName}.${columnName}`;
};
