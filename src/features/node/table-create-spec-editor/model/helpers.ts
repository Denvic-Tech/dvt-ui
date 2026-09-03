import type { Column, TableCreateSpec } from '@/shared/gatewayClient';

export type DraftId = string;

export type DraftIndexSpec = {
  columns: string[];
  id: DraftId;
  name: string;
  unique: boolean;
};

export type DraftForeignKeySpec = {
  columns: string[];
  id: DraftId;
  name: string;
  refColumns: string[];
  refSchema: string;
  refTable: string;
};

export type DraftClickHouseSetting = {
  id: DraftId;
  key: string;
  value: string;
};

export const CLICKHOUSE_ENGINE_OPTIONS = [
  'MergeTree',
  'ReplacingMergeTree',
  'SummingMergeTree',
  'AggregatingMergeTree',
  'CollapsingMergeTree',
  'VersionedCollapsingMergeTree',
  'ReplicatedMergeTree',
  'ReplicatedReplacingMergeTree',
  'ReplicatedSummingMergeTree',
  'ReplicatedAggregatingMergeTree',
  'ReplicatedCollapsingMergeTree',
  'ReplicatedVersionedCollapsingMergeTree',
] as const;

export type ClickHouseEngineName = (typeof CLICKHOUSE_ENGINE_OPTIONS)[number];

export type TableCreateSpecDraft = {
  clickhouse: {
    engineName: ClickHouseEngineName;
    orderBy: string[];
    partitionBy: string[];
    primaryKey: string[];
    replicaName: string;
    sampleBy: string[];
    settings: DraftClickHouseSetting[];
    signColumn: string;
    summingColumns: string[];
    tablePath: string;
    ttlExpression: string;
    versionColumn: string;
  };
  foreignKeys: DraftForeignKeySpec[];
  indexes: DraftIndexSpec[];
  primaryKeyColumns: string[];
};

export type TableCreateSpecValidationResult = {
  errors: string[];
  isValid: boolean;
};

const makeDraftId = (prefix: string): DraftId => {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
};

const normalizeText = (value: string | null | undefined) => {
  return (value ?? '').trim();
};

const normalizeNullableText = (value: string | null | undefined) => {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
};

const parseLooseScalar = (value: string) => {
  const trimmed = value.trim();

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
    return Number(trimmed);
  }

  return value;
};

const toArray = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  return [];
};

const hasClickHouseContent = (draft: TableCreateSpecDraft) => {
  return Boolean(
    draft.clickhouse.orderBy.length > 0 ||
    draft.clickhouse.partitionBy.length > 0 ||
    draft.clickhouse.primaryKey.length > 0 ||
    draft.clickhouse.sampleBy.length > 0 ||
    draft.clickhouse.ttlExpression.trim() ||
    draft.clickhouse.versionColumn.trim() ||
    draft.clickhouse.signColumn.trim() ||
    draft.clickhouse.summingColumns.length > 0 ||
    draft.clickhouse.tablePath.trim() ||
    draft.clickhouse.replicaName.trim() ||
    draft.clickhouse.settings.some(setting => setting.key.trim()) ||
    draft.clickhouse.engineName !== 'MergeTree'
  );
};

export const createEmptyIndexDraft = (): DraftIndexSpec => ({
  columns: [],
  id: makeDraftId('index'),
  name: '',
  unique: false,
});

export const createEmptyForeignKeyDraft = (): DraftForeignKeySpec => ({
  columns: [],
  id: makeDraftId('foreign-key'),
  name: '',
  refColumns: [],
  refSchema: '',
  refTable: '',
});

export const createEmptyClickHouseSettingDraft =
  (): DraftClickHouseSetting => ({
    id: makeDraftId('setting'),
    key: '',
    value: '',
  });

export const createDefaultTableCreateSpecDraft = (): TableCreateSpecDraft => ({
  clickhouse: {
    engineName: 'MergeTree',
    orderBy: [],
    partitionBy: [],
    primaryKey: [],
    replicaName: '',
    sampleBy: [],
    settings: [],
    signColumn: '',
    summingColumns: [],
    tablePath: '',
    ttlExpression: '',
    versionColumn: '',
  },
  foreignKeys: [],
  indexes: [],
  primaryKeyColumns: [],
});

export const hydrateTableCreateSpecDraft = (
  value?: TableCreateSpec | null
): TableCreateSpecDraft => {
  const draft = createDefaultTableCreateSpecDraft();

  if (!value) {
    return draft;
  }

  return {
    primaryKeyColumns: toArray(value.primary_key_cols),
    indexes: (value.indexes ?? []).map(index => ({
      columns: [...index.columns],
      id: makeDraftId('index'),
      name: index.name ?? '',
      unique: Boolean(index.unique),
    })),
    foreignKeys: (value.foreign_keys ?? []).map(foreignKey => ({
      columns: [...foreignKey.columns],
      id: makeDraftId('foreign-key'),
      name: foreignKey.name ?? '',
      refColumns: [...foreignKey.ref_columns],
      refSchema: foreignKey.ref_schema ?? '',
      refTable: foreignKey.ref_table,
    })),
    clickhouse: {
      engineName: value.clickhouse?.engine_name ?? 'MergeTree',
      orderBy: [...(value.clickhouse?.order_by ?? [])],
      partitionBy: [...(value.clickhouse?.partition_by ?? [])],
      primaryKey: [...(value.clickhouse?.primary_key ?? [])],
      replicaName: value.clickhouse?.replica_name ?? '',
      sampleBy: [...(value.clickhouse?.sample_by ?? [])],
      settings: Object.entries(value.clickhouse?.settings ?? {}).map(
        ([key, settingValue]) => ({
          id: makeDraftId('setting'),
          key,
          value: String(settingValue),
        })
      ),
      signColumn: value.clickhouse?.sign_column ?? '',
      summingColumns: [...(value.clickhouse?.summing_columns ?? [])],
      tablePath: value.clickhouse?.table_path ?? '',
      ttlExpression: value.clickhouse?.ttl_expression ?? '',
      versionColumn: value.clickhouse?.version_column ?? '',
    },
  };
};

export const serializeTableCreateSpecDraft = (
  draft: TableCreateSpecDraft
): TableCreateSpec | null => {
  const primaryKeyColumns = draft.primaryKeyColumns.filter(Boolean);
  const indexes = draft.indexes.map(index => ({
    columns: index.columns.filter(Boolean),
    name: normalizeNullableText(index.name),
    unique: Boolean(index.unique),
  }));
  const foreignKeys = draft.foreignKeys.map(foreignKey => ({
    columns: foreignKey.columns.filter(Boolean),
    name: normalizeNullableText(foreignKey.name),
    ref_columns: foreignKey.refColumns.filter(Boolean),
    ref_schema: normalizeNullableText(foreignKey.refSchema),
    ref_table: normalizeText(foreignKey.refTable),
  }));
  const clickhouseSettings = draft.clickhouse.settings
    .map(setting => ({
      key: normalizeText(setting.key),
      value: setting.value,
    }))
    .filter(setting => setting.key.length > 0)
    .reduce<Record<string, string | number | boolean>>(
      (accumulator, setting) => {
        accumulator[setting.key] = parseLooseScalar(setting.value) as
          | string
          | number
          | boolean;
        return accumulator;
      },
      {}
    );

  const clickhouse = hasClickHouseContent(draft)
    ? {
        engine_name: draft.clickhouse.engineName,
        order_by:
          draft.clickhouse.orderBy.length > 0
            ? draft.clickhouse.orderBy.filter(Boolean)
            : null,
        partition_by:
          draft.clickhouse.partitionBy.length > 0
            ? draft.clickhouse.partitionBy.filter(Boolean)
            : null,
        primary_key:
          draft.clickhouse.primaryKey.length > 0
            ? draft.clickhouse.primaryKey.filter(Boolean)
            : null,
        sample_by:
          draft.clickhouse.sampleBy.length > 0
            ? draft.clickhouse.sampleBy.filter(Boolean)
            : null,
        ttl_expression: normalizeNullableText(draft.clickhouse.ttlExpression),
        version_column: normalizeNullableText(draft.clickhouse.versionColumn),
        sign_column: normalizeNullableText(draft.clickhouse.signColumn),
        summing_columns:
          draft.clickhouse.summingColumns.length > 0
            ? draft.clickhouse.summingColumns.filter(Boolean)
            : null,
        table_path: normalizeNullableText(draft.clickhouse.tablePath),
        replica_name: normalizeNullableText(draft.clickhouse.replicaName),
        settings:
          Object.keys(clickhouseSettings).length > 0
            ? clickhouseSettings
            : null,
      }
    : null;

  const hasContent =
    primaryKeyColumns.length > 0 ||
    indexes.length > 0 ||
    foreignKeys.length > 0 ||
    Boolean(clickhouse);

  if (!hasContent) {
    return null;
  }

  return {
    primary_key_cols:
      primaryKeyColumns.length === 0
        ? null
        : primaryKeyColumns.length === 1
          ? primaryKeyColumns[0]
          : primaryKeyColumns,
    indexes: indexes.length > 0 ? indexes : null,
    foreign_keys: foreignKeys.length > 0 ? foreignKeys : null,
    clickhouse,
  };
};

export const parseCommaSeparatedList = (value: string) => {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

export const stringifyStringList = (value: string[]) => {
  return value.join(', ');
};

export const validateTableCreateSpecDraft = (
  draft: TableCreateSpecDraft,
  _columns: Column[]
): TableCreateSpecValidationResult => {
  const errors: string[] = [];

  draft.indexes.forEach((index, indexNumber) => {
    if (index.columns.length === 0) {
      errors.push(`Индекс ${indexNumber + 1}: выберите хотя бы одну колонку.`);
    }
  });

  draft.foreignKeys.forEach((foreignKey, index) => {
    if (foreignKey.columns.length === 0) {
      errors.push(
        `Foreign key ${index + 1}: выберите исходные колонки текущей таблицы.`
      );
    }

    if (!foreignKey.refTable.trim()) {
      errors.push(`Foreign key ${index + 1}: укажите ref table.`);
    }

    if (foreignKey.refColumns.length === 0) {
      errors.push(`Foreign key ${index + 1}: укажите ref columns.`);
    }

    if (
      foreignKey.columns.length > 0 &&
      foreignKey.refColumns.length > 0 &&
      foreignKey.columns.length !== foreignKey.refColumns.length
    ) {
      errors.push(
        `Foreign key ${index + 1}: количество source/ref columns должно совпадать.`
      );
    }
  });

  const clickhouseIsActive = hasClickHouseContent(draft);

  if (clickhouseIsActive) {
    const normalizedEngineName = draft.clickhouse.engineName.toLowerCase();
    const isReplicated = normalizedEngineName.startsWith('replicated');
    const isSumming = normalizedEngineName.includes('summing');
    const isVersioned = normalizedEngineName.includes('versionedcollapsing');
    const isCollapsing =
      normalizedEngineName.includes('collapsing') && !isVersioned;

    if (isReplicated) {
      if (!draft.clickhouse.tablePath.trim()) {
        errors.push('ClickHouse: для replicated engine обязателен table path.');
      }

      if (!draft.clickhouse.replicaName.trim()) {
        errors.push(
          'ClickHouse: для replicated engine обязательно имя replica.'
        );
      }
    }

    if (isCollapsing && !draft.clickhouse.signColumn.trim()) {
      errors.push('ClickHouse: для Collapsing engine обязателен sign column.');
    }

    if (isVersioned) {
      if (!draft.clickhouse.signColumn.trim()) {
        errors.push(
          'ClickHouse: для VersionedCollapsing engine обязателен sign column.'
        );
      }

      if (!draft.clickhouse.versionColumn.trim()) {
        errors.push(
          'ClickHouse: для VersionedCollapsing engine обязателен version column.'
        );
      }
    }

    if (isSumming && draft.clickhouse.summingColumns.length === 0) {
      errors.push('ClickHouse: для Summing engine выберите summing columns.');
    }
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
};
