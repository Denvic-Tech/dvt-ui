import {
  type DbTargetSelectorValue,
  findSelectedTable,
  getDatabaseOptions,
  getFilteredTables,
  getLiteralStringValue,
  getSchemaOptions,
  getSelectorCollapsedValue,
  hasConfiguredSelectorValue,
} from '@/features/node/db-target-selector';

import type {
  DataFrameMetadataInput,
  DbMetadata,
  NodeInputExpressionValue,
  TableCreateSpec,
} from '@/shared/gatewayClient';
import {
  isDialectSupportsDatabases,
  isDialectSupportsSchemas,
} from '@/shared/lib/db-metadata';

export type CreateTableValues = {
  database_name?: DbTargetSelectorValue;
  dataframe_metadata?: DataFrameMetadataInput;
  on_exists?: string | null;
  schema_name?: DbTargetSelectorValue;
  table_create_spec?: TableCreateSpec | null;
  table_name?: DbTargetSelectorValue;
};

export type CreateTableSectionId =
  | 'database'
  | 'schema'
  | 'table'
  | 'dataframe_metadata'
  | 'table_create_spec'
  | 'on_exists';

export type CreateTableFieldErrors = Partial<
  Record<'dataframe_metadata' | 'table_create_spec' | 'table_name', string>
>;

export const buildInitialOpenSections = (
  inputValues: CreateTableValues | undefined,
  connectionMetadata: DbMetadata | null
): CreateTableSectionId[] => {
  const sections: CreateTableSectionId[] = [];
  const databaseSelectionSupported = connectionMetadata
    ? isDialectSupportsDatabases(connectionMetadata.dialect)
    : false;

  if (
    databaseSelectionSupported &&
    !hasConfiguredSelectorValue(inputValues?.database_name)
  ) {
    sections.push('database');
  } else if (
    connectionMetadata &&
    isDialectSupportsSchemas(connectionMetadata.dialect) &&
    !hasConfiguredSelectorValue(inputValues?.schema_name)
  ) {
    sections.push('schema');
  } else if (!hasConfiguredSelectorValue(inputValues?.table_name)) {
    sections.push('table');
  }

  if (!inputValues?.dataframe_metadata?.columns?.length) {
    sections.push('dataframe_metadata');
  }

  sections.push('table_create_spec', 'on_exists');

  return Array.from(new Set(sections));
};

export const buildCreateTableDerivedState = (
  inputValues: CreateTableValues | undefined,
  connectionMetadata: DbMetadata | null
) => {
  const selectedTable = findSelectedTable(connectionMetadata, {
    database_name: inputValues?.database_name,
    schema_name: inputValues?.schema_name,
    table_name: inputValues?.table_name,
  });

  return {
    databaseOptions: getDatabaseOptions(connectionMetadata),
    filteredTables: getFilteredTables(
      connectionMetadata,
      inputValues?.database_name,
      inputValues?.schema_name
    ),
    isClickHouse: connectionMetadata?.dialect?.toLowerCase() === 'clickhouse',
    isDatabaseSelectionSupported: connectionMetadata
      ? isDialectSupportsDatabases(connectionMetadata.dialect)
      : false,
    isSchemaSupported: connectionMetadata
      ? isDialectSupportsSchemas(connectionMetadata.dialect)
      : false,
    literalDatabaseName: getLiteralStringValue(inputValues?.database_name),
    literalSchemaName: getLiteralStringValue(inputValues?.schema_name),
    selectedTable,
    selectedTableLabel: [
      getLiteralStringValue(inputValues?.database_name),
      getLiteralStringValue(inputValues?.schema_name),
      getLiteralStringValue(inputValues?.table_name),
    ]
      .filter(Boolean)
      .join('.'),
    tableColumns: inputValues?.dataframe_metadata?.columns ?? [],
  };
};

export const buildCreateTableCollapsedValues = (
  inputValues: CreateTableValues | undefined
) => {
  return {
    database: getSelectorCollapsedValue(
      inputValues?.database_name,
      'База не выбрана'
    ),
    schema: getSelectorCollapsedValue(
      inputValues?.schema_name,
      'Схема не выбрана'
    ),
    table: getSelectorCollapsedValue(
      inputValues?.table_name,
      'Таблица не выбрана'
    ),
  };
};

export const getCreateTableSchemaOptions = (
  connectionMetadata: DbMetadata | null,
  databaseNameValue?: DbTargetSelectorValue
) => {
  return getSchemaOptions(connectionMetadata, databaseNameValue);
};

export const isExpressionLikeValue = (
  value: unknown
): value is NodeInputExpressionValue => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'expression_kind' in (value as Record<string, unknown>) &&
    'value' in (value as Record<string, unknown>)
  );
};
