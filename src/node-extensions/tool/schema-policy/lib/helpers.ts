import type {
  ColumnSchemaPolicy,
  ExtraColumnsAction,
  SchemaPolicySettings,
  TableSchemaColumnMetadata,
  TableSchemaMetadata,
} from './types';

export const DEFAULT_COLUMN_POLICY: Readonly<ColumnSchemaPolicy> = {
  on_missing: 'error',
  fill_value: null,
  on_type_mismatch: 'error',
};

const EXTRA_COLUMN_ACTIONS = new Set<ExtraColumnsAction>([
  'error',
  'drop',
  'ignore',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeColumnPolicy = (value: unknown): ColumnSchemaPolicy => {
  if (!isRecord(value)) {
    return { ...DEFAULT_COLUMN_POLICY };
  }

  const onMissing =
    value['on_missing'] === 'fill' || value['on_missing'] === 'ignore'
      ? value['on_missing']
      : 'error';
  const onTypeMismatch =
    value['on_type_mismatch'] === 'cast' ||
    value['on_type_mismatch'] === 'soft_cast' ||
    value['on_type_mismatch'] === 'ignore'
      ? value['on_type_mismatch']
      : 'error';

  return {
    on_missing: onMissing,
    fill_value: value['fill_value'] ?? null,
    on_type_mismatch: onTypeMismatch,
  };
};

export const normalizeSchemaPolicy = (value: unknown): SchemaPolicySettings => {
  const source = isRecord(value) ? value : {};
  const sourceColumns = isRecord(source['columns']) ? source['columns'] : {};
  const columns = Object.fromEntries(
    Object.entries(sourceColumns).map(([name, policy]) => [
      name,
      normalizeColumnPolicy(policy),
    ])
  );
  const extraAction = source['on_extra_columns'];

  return {
    columns,
    on_extra_columns:
      typeof extraAction === 'string' &&
      EXTRA_COLUMN_ACTIONS.has(extraAction as ExtraColumnsAction)
        ? (extraAction as ExtraColumnsAction)
        : 'error',
  };
};

export const getTableSchemaColumns = (
  value: unknown
): TableSchemaColumnMetadata[] => {
  if (!isRecord(value) || !Array.isArray(value['columns'])) {
    return [];
  }

  const seenNames = new Set<string>();

  return value['columns'].filter(
    (column): column is TableSchemaColumnMetadata => {
      if (!isRecord(column) || typeof column['name'] !== 'string') {
        return false;
      }

      const name = column['name'].trim();
      if (!name || seenNames.has(name)) {
        return false;
      }

      seenNames.add(name);
      return true;
    }
  );
};

export const syncPolicyWithSchema = (
  policy: SchemaPolicySettings,
  columns: TableSchemaColumnMetadata[]
): SchemaPolicySettings => ({
  ...policy,
  columns: Object.fromEntries(
    columns.map(column => [
      column.name,
      policy.columns[column.name] ?? { ...DEFAULT_COLUMN_POLICY },
    ])
  ),
});

export const getPolicyColumnDiff = (
  policy: SchemaPolicySettings,
  columns: TableSchemaColumnMetadata[]
) => {
  const schemaNames = new Set(columns.map(column => column.name));
  const policyNames = new Set(Object.keys(policy.columns));

  return {
    missing: columns
      .map(column => column.name)
      .filter(name => !policyNames.has(name)),
    unknown: Object.keys(policy.columns).filter(name => !schemaNames.has(name)),
  };
};

const isStringDtype = (dtype: string | null | undefined) => {
  const normalized = dtype?.toUpperCase() ?? '';
  return ['STRING', 'TEXT', 'CHAR', 'VARCHAR', 'CATEGORY'].some(type =>
    normalized.includes(type)
  );
};

export const parseFillValue = (
  rawValue: string,
  dtype?: string | null
): unknown => {
  if (isStringDtype(dtype)) {
    return rawValue;
  }

  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === 'null') {
    return null;
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) {
    return Number(trimmed);
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return rawValue;
  }
};

export const formatFillValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const isTableSchemaMetadata = (
  value: unknown
): value is TableSchemaMetadata =>
  isRecord(value) &&
  (value['type'] === 'TABLE_SCHEMA' || Array.isArray(value['columns']));
