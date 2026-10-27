import type {
  DescriptionTarget,
  LineageDescriptionProvenance,
  ProjectColumnRow,
} from './types';

/** Фильтры вкладки «Колонки проекта». */
export type ProjectColumnsFilter = 'all' | 'described' | 'empty' | 'splits';

export const PROJECT_COLUMNS_FILTERS: {
  id: ProjectColumnsFilter;
  label: string;
}[] = [
  { id: 'all', label: 'Все' },
  { id: 'empty', label: 'Без описания' },
  { id: 'described', label: 'С описанием' },
  { id: 'splits', label: 'Уточнения и переименования' },
];

export const hasRowDescription = (row: ProjectColumnRow): boolean =>
  Boolean(row.description?.trim());

/** Строка возникла из разрыва цепочки: переименование или уточнение в ноде. */
export const isSplitRow = (row: ProjectColumnRow): boolean =>
  Boolean(row.is_rename || row.is_refinement);

export const matchesProjectColumnsFilter = (
  row: ProjectColumnRow,
  filter: ProjectColumnsFilter
): boolean => {
  switch (filter) {
    case 'described':
      return hasRowDescription(row);
    case 'empty':
      return !hasRowDescription(row);
    case 'splits':
      return isSplitRow(row);
    default:
      return true;
  }
};

/** Текст строки для поиска: имя, прежнее имя, источник, описание, ноды. */
export const getRowSearchText = (row: ProjectColumnRow): string =>
  [
    row.name,
    row.renamed_from,
    row.dataset_location,
    row.field_name,
    row.origin_node_name,
    row.description,
    ...(row.occurrences ?? []).map(item => `${item.node_name} ${item.column}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const filterProjectColumnRows = (
  rows: ProjectColumnRow[],
  filter: ProjectColumnsFilter,
  query: string
): ProjectColumnRow[] => {
  const needle = query.trim().toLowerCase();
  return rows.filter(
    row =>
      matchesProjectColumnsFilter(row, filter) &&
      (!needle || getRowSearchText(row).includes(needle))
  );
};

export const countProjectColumnsFilters = (
  rows: ProjectColumnRow[]
): Record<ProjectColumnsFilter, number> => ({
  all: rows.length,
  described: rows.filter(hasRowDescription).length,
  empty: rows.filter(row => !hasRowDescription(row)).length,
  splits: rows.filter(isSplitRow).length,
});

export interface ProjectColumnsStats {
  total: number;
  empty: number;
  renames: number;
  refinements: number;
}

export const getProjectColumnsStats = (
  rows: ProjectColumnRow[]
): ProjectColumnsStats => ({
  total: rows.length,
  empty: rows.filter(row => !hasRowDescription(row)).length,
  renames: rows.filter(row => Boolean(row.is_rename)).length,
  refinements: rows.filter(row => Boolean(row.is_refinement)).length,
});

/** Имя ноды, с которой начинается отрезок (стартовое вхождение). */
export const getRowStartNodeName = (row: ProjectColumnRow): string | null =>
  row.occurrences?.[0]?.node_name ?? row.start.node_id ?? null;

/**
 * Пометки под именем колонки: откуда переименована и в какой ноде уточнена.
 * Переименование с собственным текстом остаётся переименованием.
 */
export const getRowMarks = (
  row: ProjectColumnRow
): { rename: string | null; refinement: string | null } => ({
  rename: row.is_rename && row.renamed_from ? `из ${row.renamed_from}` : null,
  refinement: row.is_refinement
    ? `уточнение в ноде ${getRowStartNodeName(row) ?? '?'}`
    : null,
});

/** Подпись источника строки: `schema.table.field` или нода, где колонка вычислена. */
export const getRowOriginLabel = (row: ProjectColumnRow): string => {
  if (row.kind === 'dataset_field') {
    const table = row.dataset_location?.split(' @ ')[0]?.trim();
    return [table, row.field_name].filter(Boolean).join('.') || row.origin.key;
  }
  return row.origin_node_name ?? row.start.node_id ?? row.origin.key;
};

/** Имена строк, из которых собрана вычисляемая колонка (`depends_on` → `name`). */
export const getRowDependencyNames = (
  row: ProjectColumnRow,
  rows: ProjectColumnRow[]
): string[] => {
  const byId = new Map(rows.map(item => [item.id, item.name]));
  return Array.from(
    new Set(
      (row.depends_on ?? [])
        .map(id => byId.get(id))
        .filter((n): n is string => Boolean(n))
    )
  );
};

/** Цель записи по умолчанию: поле таблицы, если оно доступно, иначе нода. */
export const getDefaultTarget = (
  targets: DescriptionTarget[] | undefined
): DescriptionTarget | null =>
  targets?.find(target => target.scope === 'global') ?? targets?.[0] ?? null;

/** Описание принадлежит самой строке и его можно удалить (не комментарий БД). */
export const canClearRowDescription = (row: ProjectColumnRow): boolean =>
  hasRowDescription(row) && row.description_provenance === 'declared';

const NODE_WORD_FORMS: [string, string, string] = ['нода', 'ноды', 'нод'];

export const formatNodeCount = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod10 === 1 && mod100 !== 11
      ? NODE_WORD_FORMS[0]
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? NODE_WORD_FORMS[1]
        : NODE_WORD_FORMS[2];
  return `${count} ${form}`;
};

export const PROVENANCE_TONE: Record<
  LineageDescriptionProvenance,
  'success' | 'info' | 'muted' | 'warning' | 'error'
> = {
  declared: 'success',
  source: 'info',
  inherited: 'muted',
  derived: 'warning',
  none: 'warning',
  unknown: 'error',
};
