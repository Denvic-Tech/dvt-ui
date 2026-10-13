import dayjs from 'dayjs';

import type {
  DatasetDetails,
  DatasetFieldStatus,
  DatasetFreshness,
  DatasetLocator,
  DatasetLocatorParts,
  DatasetSummary,
  DatasetUsageDirection,
} from './types';

export type DatasetBadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive';

interface DatasetStatusAppearance {
  label: string;
  description: string;
  variant: DatasetBadgeVariant;
}

export const DATASET_FRESHNESS_APPEARANCE: Record<
  DatasetFreshness,
  DatasetStatusAppearance
> = {
  fresh: {
    label: 'Актуален',
    description: 'Схема совпадает с источником.',
    variant: 'success',
  },
  stale: {
    label: 'Устарел',
    description: 'Схема в источнике изменилась с момента последней проверки.',
    variant: 'warning',
  },
  unverified: {
    label: 'Не проверен',
    description: 'Схема ещё не сверялась с источником.',
    variant: 'default',
  },
  unreachable: {
    label: 'Недоступен',
    description: 'Не удалось подключиться к источнику.',
    variant: 'destructive',
  },
  not_found: {
    label: 'Не найден',
    description: 'Таблица не найдена в источнике.',
    variant: 'destructive',
  },
};

export const DATASET_FIELD_STATUS_APPEARANCE: Record<
  DatasetFieldStatus,
  DatasetStatusAppearance
> = {
  ok: {
    label: 'OK',
    description: 'Поле присутствует в источнике.',
    variant: 'default',
  },
  new: {
    label: 'Новое',
    description: 'Поле появилось при последней синхронизации.',
    variant: 'primary',
  },
  missing: {
    label: 'Отсутствует',
    description: 'Поле больше не найдено в источнике.',
    variant: 'destructive',
  },
  type_changed: {
    label: 'Тип изменён',
    description: 'Тип поля в источнике изменился.',
    variant: 'warning',
  },
};

export const DATASET_USAGE_DIRECTION_LABELS: Record<
  DatasetUsageDirection,
  string
> = {
  read: 'Чтение',
  write: 'Запись',
};

const DIALECT_ALIASES: Record<string, string> = {
  postgresql: 'postgres',
  pg: 'postgres',
  'clickhouse+native': 'clickhouse',
  'clickhouse+http': 'clickhouse',
};

/** Приводит dialect датасета к типу подключения (для логотипа/подписи). */
export const normalizeDatasetDialect = (
  dialect: string | null | undefined
): string => {
  const normalized = (dialect ?? '').trim().toLowerCase();
  return DIALECT_ALIASES[normalized] ?? normalized;
};

const readLocatorString = (
  parts: DatasetLocator['parts'],
  key: string
): string | null => {
  const value = parts?.[key];
  if (value == null) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
};

const readLocatorNumber = (
  parts: DatasetLocator['parts'],
  key: string
): number | null => {
  const value = parts?.[key];
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const getDatasetLocatorParts = (
  locator: DatasetLocator
): DatasetLocatorParts => ({
  dialect: readLocatorString(locator.parts, 'dialect'),
  host: readLocatorString(locator.parts, 'host'),
  port: readLocatorNumber(locator.parts, 'port'),
  database: readLocatorString(locator.parts, 'database'),
  schema: readLocatorString(locator.parts, 'schema'),
  table: readLocatorString(locator.parts, 'table') ?? locator.location,
});

/** Dialect источника (`null`, если адаптер его не сообщает). */
export const getDatasetDialect = (locator: DatasetLocator): string | null =>
  getDatasetLocatorParts(locator).dialect;

/** Имя таблицы/объекта для заголовков и списков. */
export const getDatasetName = (locator: DatasetLocator): string =>
  getDatasetLocatorParts(locator).table;

/** `database.schema` без пустых сегментов. */
export const getDatasetNamespace = (locator: DatasetLocator): string => {
  const { database, schema } = getDatasetLocatorParts(locator);
  return [database, schema].filter(Boolean).join('.');
};

/** Полное имя таблицы: `database.schema.table`. */
export const getDatasetQualifiedName = (locator: DatasetLocator): string => {
  const { database, schema, table } = getDatasetLocatorParts(locator);
  return [database, schema, table].filter(Boolean).join('.');
};

/** `host:port` источника или `null`, если хост неизвестен. */
export const getDatasetHostLabel = (locator: DatasetLocator): string | null => {
  const { host, port } = getDatasetLocatorParts(locator);
  if (!host) {
    return null;
  }

  return port != null ? `${host}:${port}` : host;
};

export const formatDatasetDateTime = (
  value: string | null | undefined
): string | null => {
  if (!value) {
    return null;
  }

  const date = dayjs(value);
  return date.isValid() ? date.format('DD.MM.YYYY HH:mm') : value;
};

/** Переносит актуальные поля из detail-ответа в summary-элемент списка. */
export const applyDatasetDetailsToSummary = (
  summary: DatasetSummary,
  details: DatasetDetails
): DatasetSummary => {
  // Счётчики (field/reader/writer_count) есть только в summary — сохраняем их.
  const {
    fields: _fields,
    connection_ids: _connectionIds,
    created_at: _createdAt,
    ...sharedFields
  } = details;

  return { ...summary, ...sharedFields };
};
