import type {
  ColumnOccurrence,
  ProjectColumnRow,
} from '@/entities/data/lineage';

/**
 * Колонка каталога: все строки-отрезки одного origin и общая цепочка нод.
 * Первая строка (`host`) начинает цепочку, остальные — уточнения и
 * переименования ниже по цепочке.
 */
export interface ColumnGroup {
  key: string;
  host: ProjectColumnRow;
  rows: ProjectColumnRow[];
  chain: ColumnOccurrence[];
}

export interface ColumnTree {
  groups: ColumnGroup[];
  /** Строки в порядке групп: сначала host, затем отрезки по глубине. */
  ordered: ProjectColumnRow[];
  groupOf: Map<string, ColumnGroup>;
  /** Строка, которой принадлежит вхождение колонки в ноду (`ref.key`). */
  rowOfOccurrence: Map<string, ProjectColumnRow>;
}

const sortedOccurrences = (row: ProjectColumnRow): ColumnOccurrence[] =>
  [...(row.occurrences ?? [])].sort((a, b) => a.depth - b.depth);

const startOccurrence = (row: ProjectColumnRow): ColumnOccurrence | undefined =>
  row.occurrences?.find(item => item.ref.key === row.start.key) ??
  sortedOccurrences(row)[0];

const startDepth = (row: ProjectColumnRow): number =>
  startOccurrence(row)?.depth ?? Number.POSITIVE_INFINITY;

const isSplit = (row: ProjectColumnRow): boolean =>
  Boolean(row.is_rename || row.is_refinement);

export const buildColumnTree = (rows: ProjectColumnRow[]): ColumnTree => {
  const byOrigin = new Map<string, ProjectColumnRow[]>();
  rows.forEach(row => {
    const key = row.origin.key;
    byOrigin.set(key, [...(byOrigin.get(key) ?? []), row]);
  });

  const groups: ColumnGroup[] = [];
  const groupOf = new Map<string, ColumnGroup>();
  const rowOfOccurrence = new Map<string, ProjectColumnRow>();

  byOrigin.forEach((items, key) => {
    const byDepth = [...items].sort(
      (a, b) =>
        startDepth(a) - startDepth(b) || Number(isSplit(a)) - Number(isSplit(b))
    );
    const [host, ...rest] = byDepth;
    const chain: ColumnOccurrence[] = [];
    const seen = new Set<string>();
    byDepth.forEach(row => {
      sortedOccurrences(row).forEach(item => {
        if (!rowOfOccurrence.has(item.ref.key)) {
          rowOfOccurrence.set(item.ref.key, row);
        }
        if (!seen.has(item.ref.key)) {
          seen.add(item.ref.key);
          chain.push(item);
        }
      });
    });
    chain.sort((a, b) => a.depth - b.depth);

    const group = { key, host, rows: [host, ...rest], chain };
    groups.push(group);
    group.rows.forEach(row => groupOf.set(row.id, group));
  });

  return {
    groups,
    ordered: groups.flatMap(group => group.rows),
    groupOf,
    rowOfOccurrence,
  };
};

/** Индекс ноды в цепочке колонки, с которой начинается строка. */
export const getRowChainIndex = (
  group: ColumnGroup,
  row: ProjectColumnRow
): number => {
  const start = startOccurrence(row);
  const index = start
    ? group.chain.findIndex(item => item.ref.key === start.ref.key)
    : -1;
  return Math.max(index, 0);
};

/** Ноды строки по порядку цепочки. */
export const getRowChainNodes = (row: ProjectColumnRow): ColumnOccurrence[] =>
  sortedOccurrences(row);
