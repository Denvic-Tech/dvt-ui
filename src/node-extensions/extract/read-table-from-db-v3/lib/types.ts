import {
  type ColumnBaseType,
  type PartitionGrouping,
} from '@/features/node/db-partitioning-grouping-input';

import type {
  DbMetadata as DBMetadata,
  DbTable as DBTable,
  NodeInputExpressionValue,
} from '@/shared/gatewayClient';

export type ReadTableFromDBV3SelectorValue =
  | string
  | null
  | undefined
  | NodeInputExpressionValue;

export type ReadTableFromDBV3Values = {
  table_name?: ReadTableFromDBV3SelectorValue;
  database_name?: ReadTableFromDBV3SelectorValue;
  schema_name?: ReadTableFromDBV3SelectorValue;
  columns?: string[] | null;
  limit?: number | null | undefined;
  time_zone?: string | null | undefined;
  partition_col?: string | null | undefined;
  npartitions?: number | null | undefined;
  max_rows_per_partition?: number | null | undefined;
  partition_grouping?: PartitionGrouping | null | undefined;
  TTL_CACHE?: number;
};

export type ReadTableFromDBV3Errors = Partial<
  Record<keyof ReadTableFromDBV3Values, string>
>;

export type ReadTableFromDBV3SectionId =
  | 'database'
  | 'schema'
  | 'table'
  | 'columns'
  | 'options';

export type ReadTableFromDBV3SectionErrors = {
  table: boolean;
  options: boolean;
};

export type ReadTableFromDBV3ValidationResult = {
  errors: ReadTableFromDBV3Errors;
  partitionGroupingErrors?: Record<string, string> | undefined;
  isValid: boolean;
};

export type ReadTableFromDBV3DerivedState = {
  inputMetadata: DBMetadata | null;
  selectedTable: DBTable | null;
  selectedTableLabel: string;
  selectedColumnsCount: number;
  hasSinglePrimaryKey: boolean;
  isPartitionColumnRequired: boolean;
  partitionColumnType: ColumnBaseType;
  sectionErrors: ReadTableFromDBV3SectionErrors;
};
