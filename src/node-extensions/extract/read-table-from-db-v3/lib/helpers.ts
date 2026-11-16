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
  NodeInputExpressionValue,
} from '@/shared/gatewayClient';
import { findDbMetadataTable } from '@/shared/lib/db-metadata';
import {
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';

import type {
  ReadTableFromDBV3Errors,
  ReadTableFromDBV3SectionErrors,
  ReadTableFromDBV3SelectorValue,
  ReadTableFromDBV3Values,
} from './types';

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

/** Значение задано: непустая строка или непустое выражение. */
export const hasFilledSelectorValue = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return isExpressionValue(value) && value.value.trim().length > 0;
};

export const hasSelectorExpression = (
  values: ReadTableFromDBV3Values | null | undefined
): boolean =>
  isExpressionValue(values?.database_name) ||
  isExpressionValue(values?.schema_name) ||
  isExpressionValue(values?.table_name);

/**
 * Переводит значение селектора в выражение. Выбранное имя становится
 * строковым литералом внутри выражения, как при ручном переключении поля.
 */
export const toSelectorExpression = (
  value: ReadTableFromDBV3SelectorValue
): NodeInputExpressionValue => {
  if (isExpressionValue(value)) {
    return value;
  }

  const literal = getLiteralStringValue(value);
  return makeExpressionValue(literal ? JSON.stringify(literal) : '', 'single');
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

/**
 * Сколько полей блока «Дополнительные настройки» отличается
 * от значений по умолчанию.
 */
export const countChangedAdvancedSettings = (
  values: ReadTableFromDBV3Values | null | undefined
): number => {
  const optionalFields = [
    values?.npartitions,
    values?.max_rows_per_partition,
    values?.limit,
  ];
  const changedOptional = optionalFields.filter(
    value => value !== undefined && value !== null
  ).length;

  return changedOptional + (sanitizeTTLCache(values?.TTL_CACHE) !== 0 ? 1 : 0);
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

/**
 * Переключает колонку в выборе, сохраняя порядок колонок таблицы.
 * Пустой выбор сохраняется как null.
 */
export const toggleColumnSelection = (
  tableColumns: readonly string[],
  selectedColumns: string[] | null | undefined,
  columnName: string
): string[] | null => {
  const selected = new Set(selectedColumns ?? []);

  if (selected.has(columnName)) {
    selected.delete(columnName);
  } else {
    selected.add(columnName);
  }

  const nextColumns = tableColumns.filter(name => selected.has(name));
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
    advanced: Boolean(
      errors.npartitions || errors.max_rows_per_partition || errors.limit
    ),
  };
};
