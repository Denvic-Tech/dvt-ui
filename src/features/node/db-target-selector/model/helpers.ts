import type { DbCatalogState } from '@/entities/data/db-connection/model/catalogTypes';

import type {
  DbMetadata,
  DbTable,
  NodeInputExpressionValue,
} from '@/shared/gatewayClient';
import {
  buildDbMetadataTableLabel,
  type DbMetadataOption,
  findDbMetadataTable,
  getDbMetadataDatabaseOptions,
  getDbMetadataFilteredTables,
  getDbMetadataSchemaOptions,
} from '@/shared/lib/db-metadata';
import { isExpressionValue } from '@/shared/lib/node-input-values';

export type DbTargetSelectorValue =
  | string
  | null
  | undefined
  | NodeInputExpressionValue;

export type MetadataOption = Omit<DbMetadataOption, 'tableCount'> & {
  tableCount?: number;
};

export type CatalogListUiProps = {
  query?: string | undefined;
  onQueryChange?: ((value: string) => void) | undefined;
  state?: DbCatalogState | undefined;
  hasNextPage?: boolean | undefined;
  isFetchingNextPage?: boolean | undefined;
  loadMoreError?: unknown;
  onLoadNextPage?: (() => void) | undefined;
  onRetry?: (() => void | Promise<unknown>) | undefined;
  onRefresh?: (() => boolean | void | Promise<boolean | void>) | undefined;
  isRefreshing?: boolean | undefined;
};

export const getLiteralStringValue = (
  value: DbTargetSelectorValue
): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const hasConfiguredSelectorValue = (
  value: DbTargetSelectorValue
): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return isExpressionValue(value);
};

export const getSelectorCollapsedValue = (
  value: DbTargetSelectorValue,
  fallback: string
): string => {
  const literalValue = getLiteralStringValue(value);
  if (literalValue) {
    return literalValue;
  }

  return isExpressionValue(value) ? 'Expression' : fallback;
};

export const buildSelectedTableLabel = ({
  databaseName,
  schemaName,
  tableName,
}: {
  databaseName?: DbTargetSelectorValue;
  schemaName?: DbTargetSelectorValue;
  tableName?: DbTargetSelectorValue;
}) => {
  const literalTableName = getLiteralStringValue(tableName);
  const literalDatabaseName = getLiteralStringValue(databaseName);
  const literalSchemaName = getLiteralStringValue(schemaName);

  if (!literalTableName) {
    return '';
  }

  return buildDbMetadataTableLabel({
    name: literalTableName,
    database_name: literalDatabaseName,
    schema_name: literalSchemaName,
  });
};

export const getDatabaseOptions = (
  inputMetadata: DbMetadata | null
): MetadataOption[] => {
  return getDbMetadataDatabaseOptions(inputMetadata);
};

export const getSchemaOptions = (
  inputMetadata: DbMetadata | null,
  databaseNameValue?: DbTargetSelectorValue
): MetadataOption[] => {
  return getDbMetadataSchemaOptions(
    inputMetadata,
    getLiteralStringValue(databaseNameValue)
  );
};

export const getFilteredTables = (
  inputMetadata: DbMetadata | null,
  databaseNameValue?: DbTargetSelectorValue,
  schemaNameValue?: DbTargetSelectorValue
): DbTable[] => {
  return getDbMetadataFilteredTables(inputMetadata, {
    databaseName: getLiteralStringValue(databaseNameValue),
    schemaName: getLiteralStringValue(schemaNameValue),
  });
};

export const findSelectedTable = (
  inputMetadata: DbMetadata | null,
  selectorValues?: {
    database_name?: DbTargetSelectorValue;
    schema_name?: DbTargetSelectorValue;
    table_name?: DbTargetSelectorValue;
  } | null
): DbTable | null => {
  const tableName = getLiteralStringValue(selectorValues?.table_name);
  const databaseName = getLiteralStringValue(selectorValues?.database_name);
  const schemaName = getLiteralStringValue(selectorValues?.schema_name);

  if (!inputMetadata || !tableName) {
    return null;
  }

  return findDbMetadataTable(inputMetadata, {
    databaseName,
    schemaName,
    tableName,
  });
};
