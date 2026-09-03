import type {
  TableSchemaColumnMetadata,
  TableSchemaMetadata,
} from '@/shared/gatewayClient';

export type MissingColumnAction = 'error' | 'fill' | 'ignore';

export type TypeMismatchAction = 'error' | 'cast' | 'soft_cast' | 'ignore';

export type ExtraColumnsAction = 'error' | 'drop' | 'ignore';

export type ColumnSchemaPolicy = {
  fill_value: unknown;
  on_missing: MissingColumnAction;
  on_type_mismatch: TypeMismatchAction;
};

export type SchemaPolicySettings = {
  columns: Record<string, ColumnSchemaPolicy>;
  on_extra_columns: ExtraColumnsAction;
};

export type SchemaPolicyValues = {
  policy?: SchemaPolicySettings | null;
};

export type { TableSchemaColumnMetadata, TableSchemaMetadata };
