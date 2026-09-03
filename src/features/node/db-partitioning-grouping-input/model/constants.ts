import type { ColumnBaseType, PartitionGroupingMode } from '../model/types';

export const GENERIC_ERROR_MESSAGE =
  'Invalid partition grouping configuration.';

export const MODE_OPTIONS: Array<{
  value: PartitionGroupingMode;
  label: string;
  compatibleTypes: ColumnBaseType[];
  description: string;
  example: string;
}> = [
  {
    value: 'range',
    label: 'Range',
    compatibleTypes: ['NUMERIC', 'DATETIME'],
    description:
      'Базовая стратегия диапазонов. Движок сам выберет оптимальные границы.',
    example: 'Минимальная конфигурация: {"mode":"range"}',
  },
  {
    value: 'hash',
    label: 'Hash',
    compatibleTypes: ['STRING', 'NUMERIC', 'DATETIME', 'BOOL'],
    description:
      'Группировка по хеш-функции. Подходит для nullable/строковых/сложных ключей.',
    example:
      'Минимальная конфигурация: {"mode":"hash"}; с бакетами: {"mode":"hash","buckets":64}',
  },
  {
    value: 'prefix',
    label: 'Prefix',
    compatibleTypes: ['STRING'],
    description:
      'Группировка по первым N символам строки. Например: "Москва" → "Мо"',
    example:
      'Length=2, Lower=true, Other=true: группирует "Москва", "Монреаль" в префикс "мо"',
  },
  {
    value: 'explicit_values',
    label: 'Explicit Values',
    compatibleTypes: ['STRING', 'BOOL'],
    description:
      'Создаёт сегменты только для явно перечисленных значений. Остальные значения опционально группируются в __other__',
    example: 'Values=["RU", "US", "EN"], Other=true: итого 4 сегмента',
  },
  {
    value: 'quantiles',
    label: 'Quantiles',
    compatibleTypes: ['NUMERIC'],
    description:
      'Разбивает данные на k квантилей (например, k=4 для квартилей).',
    example: 'K=4: создаёт 4 сегмента (квартили)',
  },
  {
    value: 'percentiles',
    label: 'Percentiles',
    compatibleTypes: ['NUMERIC'],
    description:
      'Аналогично квантилям, но использует значения от 0 до 1 (исключая границы)',
    example:
      'Percentiles=[0.1, 0.5, 0.9]: создаёт сегменты на уровнях 10%, 50%, 90%',
  },
  {
    value: 'ranges',
    label: 'Ranges',
    compatibleTypes: ['NUMERIC', 'DATETIME'],
    description:
      'Явные диапазоны [начало, конец]. Для дат используйте ISO формат "2024-01-01"',
    example:
      'Ranges=[[0, 100], [100, 1000]]: значения 0-100 в первом, 100-1000 во втором',
  },
  {
    value: 'step',
    label: 'Step',
    compatibleTypes: ['NUMERIC', 'DATETIME'],
    description:
      'Интервалы равного размера. Для datetime: шаг в секундах, для date: шаг в днях',
    example:
      'Start=0, Step=100, Bins=10: создаёт сегменты 0-100, 100-200 и т.д.',
  },
  {
    value: 'granularity',
    label: 'Granularity',
    compatibleTypes: ['DATETIME'],
    description:
      'Группировка по календарным единицам: час, день, неделя, месяц, год',
    example:
      'Granularity=day: группирует все записи по дате (игнорирует время)',
  },
  {
    value: 'as_is',
    label: 'As Is',
    compatibleTypes: ['BOOL'],
    description:
      'Без группировки — сегменты по фактическим булевым значениям: true, false, null',
    example: 'Создаёт до 3 сегментов на основе присутствующих значений',
  },
];
