import {
  getAvailablePartitionGroupingModes,
  type PartitionGrouping,
} from '@/features/node/db-partitioning-grouping-input';

import type {
  DbColumn,
  PartitioningAdviceRequest,
  PartitioningAdviceResponse,
} from '@/shared/gatewayClient';

import { getPartitionColumnType } from './helpers';
import type { ReadTableFromDBV3Values } from './types';

/** Поля, которые подставляет «Подобрать настройки» и возвращает «Отменить». */
export type PartitioningSettings = {
  partition_col: string | null;
  partition_grouping: PartitionGrouping | null;
};

export type PartitioningAdviceTarget = {
  databaseName: string | null;
  schemaName: string | null;
  tableName: string;
};

const isPositiveInteger = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

/**
 * Запрос подбора для выбранной таблицы. Колонки чтения и заданные вручную
 * размеры партиций передаются, чтобы подбор считал по тем же настройкам,
 * с которыми нода будет читать.
 */
export const buildPartitioningAdviceRequest = (
  target: PartitioningAdviceTarget,
  values: ReadTableFromDBV3Values | null | undefined
): PartitioningAdviceRequest => ({
  table_name: target.tableName,
  ...(target.databaseName ? { database_name: target.databaseName } : {}),
  ...(target.schemaName ? { schema_name: target.schemaName } : {}),
  ...(values?.columns?.length ? { read_columns: values.columns } : {}),
  ...(isPositiveInteger(values?.npartitions)
    ? { npartitions: values.npartitions }
    : {}),
  ...(isPositiveInteger(values?.max_rows_per_partition)
    ? { max_rows_per_partition: values.max_rows_per_partition }
    : {}),
});

export const pickPartitioningSettings = (
  values: ReadTableFromDBV3Values | null | undefined
): PartitioningSettings => ({
  partition_col: values?.partition_col || null,
  partition_grouping: values?.partition_grouping ?? null,
});

/**
 * Лучшая рекомендация ответа в терминах формы. `null` — подставить нечего:
 * рекомендаций нет, колонки нет среди колонок таблицы или режим
 * группировки недоступен для её типа.
 */
export const resolvePartitioningAdvice = (
  response: PartitioningAdviceResponse,
  columns: DbColumn[]
): PartitioningSettings | null => {
  const best = response.recommendations.reduce<
    PartitioningAdviceResponse['recommendations'][number] | null
  >(
    (current, item) => (!current || item.rank < current.rank ? item : current),
    null
  );
  if (!best || !columns.some(column => column.name === best.partition_col)) {
    return null;
  }

  const { mode } = best.partition_grouping;
  const isModeAvailable = getAvailablePartitionGroupingModes(
    getPartitionColumnType(best.partition_col, columns)
  ).some(option => option.value === mode);
  if (!isModeAvailable) {
    return null;
  }

  return {
    partition_col: best.partition_col,
    partition_grouping: best.partition_grouping as PartitionGrouping,
  };
};

const sortKeys = (_key: string, value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).sort(([left], [right]) =>
          left.localeCompare(right)
        )
      )
    : value;

export const isSamePartitioningSettings = (
  left: PartitioningSettings,
  right: PartitioningSettings
) =>
  left.partition_col === right.partition_col &&
  JSON.stringify(left.partition_grouping, sortKeys) ===
    JSON.stringify(right.partition_grouping, sortKeys);
