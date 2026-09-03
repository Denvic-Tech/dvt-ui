import {
  type ColumnBaseType,
  MODE_OPTIONS,
  type PartitionGrouping,
} from '@/features/node/db-partitioning-grouping-input';

import type { DbCatalogState } from '@/entities/data/db-connection/model/catalogTypes';

import type {
  DbColumn,
  DbMetadata as DBMetadata,
  DbTable,
} from '@/shared/gatewayClient';
import {
  buildDbMetadataTableLabel,
  type DbMetadataOption,
  findDbMetadataTable,
  getDbMetadataDatabaseOptions,
  getDbMetadataFilteredTables,
  getDbMetadataSchemaOptions,
  isDialectSupportsDatabases,
  isDialectSupportsSchemas,
} from '@/shared/lib/db-metadata';
import { isExpressionValue } from '@/shared/lib/node-input-values';

import type {
  ReadTableFromDBV3Errors,
  ReadTableFromDBV3SectionErrors,
  ReadTableFromDBV3SectionId,
  ReadTableFromDBV3SelectorValue,
  ReadTableFromDBV3Values,
} from './types';

export type MetadataOption = DbMetadataOption;

export const getLiteralStringValue = (
  value: ReadTableFromDBV3SelectorValue
): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const hasConfiguredSelectorValue = (
  value: ReadTableFromDBV3SelectorValue
): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return isExpressionValue(value);
};

export const parseOptionalInteger = (
  value: string,
  { min, max }: { min: number; max?: number }
): number | undefined => {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const integer = Math.floor(parsed);

  if (max !== undefined) {
    return Math.min(Math.max(integer, min), max);
  }

  return Math.max(integer, min);
};

export const sanitizeTTLCache = (value: unknown): number => {
  if (value === undefined || value === null || typeof value === 'boolean') {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
};

export const getInitialActiveSection = (
  inputData?: ReadTableFromDBV3Values | null,
  inputMetadata?: DBMetadata | null
): ReadTableFromDBV3SectionId => {
  const databaseSelectionSupported =
    inputMetadata && isDialectSupportsDatabases(inputMetadata.dialect);
  const schemaSelectionSupported =
    inputMetadata && isDialectSupportsSchemas(inputMetadata.dialect);

  if (
    databaseSelectionSupported &&
    !hasConfiguredSelectorValue(inputData?.database_name)
  ) {
    return 'database';
  }

  if (
    schemaSelectionSupported &&
    !hasConfiguredSelectorValue(inputData?.schema_name)
  ) {
    return 'schema';
  }

  if (!hasConfiguredSelectorValue(inputData?.table_name)) {
    return 'table';
  }

  return 'table';
};

export const buildInitialOpenSections = (
  inputData?: ReadTableFromDBV3Values | null,
  inputMetadata?: DBMetadata | null
): ReadTableFromDBV3SectionId[] => [
  getInitialActiveSection(inputData, inputMetadata),
];

export const getReadTablePreviewState = ({
  hasExpression,
  hasTableName,
  loading,
  hasSelectedTable,
}: {
  hasExpression: boolean;
  hasTableName: boolean;
  loading: boolean;
  hasSelectedTable: boolean;
}): 'empty' | 'loading' | 'ready' | 'error' => {
  if (hasExpression || !hasTableName) return 'empty';
  if (loading) return 'loading';
  return hasSelectedTable ? 'ready' : 'error';
};

export const getReadTableDataPreviewState = ({
  hasExpression,
  hasTableName,
  state,
}: {
  hasExpression: boolean;
  hasTableName: boolean;
  state: DbCatalogState;
}): 'empty' | 'loading' | 'ready' | 'error' => {
  if (hasExpression || !hasTableName) return 'empty';
  if (state === 'loading') return 'loading';
  if (state === 'ready') return 'ready';
  if (state === 'empty') return 'empty';
  return 'error';
};

export const findSelectedTable = (
  inputMetadata: DBMetadata | null,
  inputData?: ReadTableFromDBV3Values | null
): DbTable | null => {
  const tableName = getLiteralStringValue(inputData?.table_name);
  const databaseName = getLiteralStringValue(inputData?.database_name);
  const schemaName = getLiteralStringValue(inputData?.schema_name);

  if (!inputMetadata || !tableName) {
    return null;
  }

  return findDbMetadataTable(inputMetadata, {
    databaseName,
    schemaName,
    tableName,
  });
};

export const buildSelectedTableLabel = (
  inputData?: ReadTableFromDBV3Values | null
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

export const getSelectorCollapsedValue = (
  value: ReadTableFromDBV3SelectorValue,
  fallback: string
): string => {
  const literalValue = getLiteralStringValue(value);
  if (literalValue) {
    return literalValue;
  }

  return isExpressionValue(value) ? 'Expression' : fallback;
};

export const getDatabaseOptions = (
  inputMetadata: DBMetadata | null
): MetadataOption[] => {
  return getDbMetadataDatabaseOptions(inputMetadata);
};

export const getSchemaOptions = (
  inputMetadata: DBMetadata | null,
  databaseNameValue?: ReadTableFromDBV3SelectorValue
): MetadataOption[] => {
  return getDbMetadataSchemaOptions(
    inputMetadata,
    getLiteralStringValue(databaseNameValue)
  );
};

export const getFilteredTables = (
  inputMetadata: DBMetadata | null,
  databaseNameValue?: ReadTableFromDBV3SelectorValue,
  schemaNameValue?: ReadTableFromDBV3SelectorValue
): DbTable[] => {
  return getDbMetadataFilteredTables(inputMetadata, {
    databaseName: getLiteralStringValue(databaseNameValue),
    schemaName: getLiteralStringValue(schemaNameValue),
  });
};

export const getFilteredColumns = (
  selectedTable: DbTable | null,
  selectedColumnNames?: string[] | null
): DbColumn[] => {
  if (
    !selectedTable ||
    !selectedColumnNames ||
    selectedColumnNames.length === 0
  ) {
    return [];
  }

  return selectedTable.columns.filter(column => {
    return selectedColumnNames.includes(column.name);
  });
};

export const getSelectedColumnsCount = (
  selectedColumnNames?: string[] | null
): number => {
  return selectedColumnNames?.length ?? 0;
};

export const hasSinglePrimaryKeyColumn = (
  selectedTable: DbTable | null
): boolean => {
  if (!selectedTable) {
    return false;
  }

  const primaryKeyColumns = selectedTable.columns.filter(column => {
    return column.primary_key === true;
  });

  return primaryKeyColumns.length === 1;
};

export const getBaseType = (
  dtype: string | null | undefined
): ColumnBaseType => {
  if (!dtype) {
    return 'UNKNOWN';
  }

  const type = dtype.toUpperCase();

  if (type.includes('DATE') || type.includes('TIME')) {
    return 'DATETIME';
  }

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

  if (type.includes('BOOL')) {
    return 'BOOL';
  }

  return 'UNKNOWN';
};

export const getPartitionColumnType = (
  partitionColumnName: string | null | undefined,
  columns: DbColumn[]
): ColumnBaseType => {
  if (!partitionColumnName || columns.length === 0) {
    return 'UNKNOWN';
  }

  const partitionColumn = columns.find(column => {
    return column.name === partitionColumnName;
  });

  return getBaseType(
    partitionColumn?.dtype ? String(partitionColumn.dtype) : null
  );
};

export const isPartitionGroupingModeCompatible = (
  grouping: PartitionGrouping | null | undefined,
  columnType: ColumnBaseType
): boolean => {
  if (!grouping || columnType === 'UNKNOWN') {
    return true;
  }

  const modeInfo = MODE_OPTIONS.find(option => {
    return option.value === grouping.mode;
  });

  return !modeInfo || modeInfo.compatibleTypes.includes(columnType);
};

export const toggleColumnSelection = (
  selectedColumns: string[] | null | undefined,
  columnName: string
): string[] | null => {
  const nextColumns = selectedColumns ? [...selectedColumns] : [];

  if (nextColumns.includes(columnName)) {
    nextColumns.splice(nextColumns.indexOf(columnName), 1);
  } else {
    nextColumns.push(columnName);
  }

  return nextColumns.length > 0 ? nextColumns : null;
};

export const getSectionErrors = (
  errors: ReadTableFromDBV3Errors
): ReadTableFromDBV3SectionErrors => {
  return {
    table: Boolean(errors.table_name),
    options: Boolean(
      errors.partition_col ||
      errors.partition_grouping ||
      errors.npartitions ||
      errors.max_rows_per_partition ||
      errors.limit ||
      errors.time_zone
    ),
  };
};

export const getFirstErrorSection = (
  errors: ReadTableFromDBV3Errors
): Extract<ReadTableFromDBV3SectionId, 'table' | 'options'> | null => {
  const sectionErrors = getSectionErrors(errors);
  if (sectionErrors.table) return 'table';
  if (sectionErrors.options) return 'options';
  return null;
};
