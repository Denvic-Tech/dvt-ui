import type {
  DataFrameMetadata,
  DbMetadata,
  NodeInputExpressionValue,
} from '@/shared/gatewayClient';

export type ReadVariablesFromDBMode = 'manual' | 'sql';

export type SelectorValue =
  | string
  | NodeInputExpressionValue
  | null
  | undefined;

export type ReadVariablesFromDBValues = {
  manual_variables?: Record<string, unknown>;
  mode?: ReadVariablesFromDBMode;
  sql_code?: unknown;
  sql_variables?: Record<string, unknown>;
};

export type ManualTargetDraft = {
  database_name?: SelectorValue;
  schema_name?: SelectorValue;
  table_name?: SelectorValue;
};

export type ManualVariableDraft = {
  aggregation: string;
  column_name?: SelectorValue;
  default_literal: string;
  id: string;
  name: string;
  nullable: boolean;
  order_by_column?: SelectorValue;
};

export type SqlVariablePolicyDraft = {
  default_literal: string;
  dtype?: string | null | undefined;
  id: string;
  name: string;
  nullable: boolean;
};

export type SqlPreviewState = {
  error: string | null;
  fingerprint: string | null;
  metadata: DataFrameMetadata | null;
  status: 'idle' | 'loading' | 'success' | 'error';
};

export type ReadVariablesFromDBConnectionState = {
  connectionID: string | null;
  connectionMetadata: DbMetadata | null;
};
