/**
 * Раскладка скелетона таблицы превью. Ширины плашек близки к ширине
 * реальных значений, чтобы при подстановке данных колонки почти не прыгали.
 */

export type DataPreviewSkeletonColumn = {
  name: string;
  dtype?: string | null | undefined;
};

export type DataPreviewSkeletonHeadCell =
  | { kind: 'label'; label: string; title: string | undefined }
  | { kind: 'bar'; width: number };

export type DataPreviewSkeletonLayout = {
  head: DataPreviewSkeletonHeadCell[];
  /** Ширины плашек в px: строка → колонка. */
  rows: number[][];
};

export const DATA_PREVIEW_SKELETON_ROW_COUNT = 18;

/** Базовые ширины плашек в ячейках по типу колонки, px. */
export const SKELETON_CELL_WIDTH = {
  temporal: 104,
  longText: 120,
  text: 52,
  shortChar: 26,
  boolean: 34,
  numeric: 44,
  integer: 36,
} as const;

/** Колонки неизвестны: 9 колонок, типы чередуются. */
const FALLBACK_COLUMN_TYPES = [
  'bigint',
  'text',
  'numeric',
  'text',
  'timestamp',
  'integer',
  'text',
  'boolean',
  'text',
] as const;

/** Ширины плашек скелетонной шапки, px — по кругу. */
const FALLBACK_HEAD_WIDTHS = [52, 84, 64, 72, 90, 60, 78, 56, 70] as const;

const TEMPORAL_TYPE = /date|time/i;
const BOOLEAN_TYPE = /bool/i;
const SHORT_CHAR_TYPE =
  /(^|[^a-z])(n?char|character|fixedstring)\s*\(\s*[1-3]\s*\)/i;
const NUMERIC_TYPE = /numeric|decimal|real|double|float|money/i;
const INTEGER_TYPE =
  /(^|[^a-z])u?(tiny|small|medium|big)?int(eger)?\d*([^a-z]|$)|serial/i;
/** Длинный текст узнаём по имени колонки: тип у него обычный строковый. */
const LONG_TEXT_NAME =
  /comment|descr|note|remark|message|коммент|описан|примеч/i;

export const getSkeletonCellBaseWidth = (
  column: Partial<DataPreviewSkeletonColumn>
): number => {
  const type = column.dtype ?? '';
  if (TEMPORAL_TYPE.test(type)) return SKELETON_CELL_WIDTH.temporal;
  if (BOOLEAN_TYPE.test(type)) return SKELETON_CELL_WIDTH.boolean;
  if (SHORT_CHAR_TYPE.test(type)) return SKELETON_CELL_WIDTH.shortChar;
  if (NUMERIC_TYPE.test(type)) return SKELETON_CELL_WIDTH.numeric;
  if (INTEGER_TYPE.test(type)) return SKELETON_CELL_WIDTH.integer;
  return LONG_TEXT_NAME.test(column.name ?? '')
    ? SKELETON_CELL_WIDTH.longText
    : SKELETON_CELL_WIDTH.text;
};

/**
 * 65–100 % от базовой ширины с шагом 5 %. Зависит только от позиции
 * ячейки, поэтому на ререндере картинка не меняется.
 */
export const getSkeletonWidthFactor = (row: number, column: number): number =>
  0.65 + ((row * 7 + column * 13) % 8) / 20;

export const buildDataPreviewSkeletonLayout = (
  columns: readonly DataPreviewSkeletonColumn[] | null | undefined,
  rowCount: number = DATA_PREVIEW_SKELETON_ROW_COUNT
): DataPreviewSkeletonLayout => {
  const hasColumns = Boolean(columns && columns.length > 0);
  const sizedColumns: ReadonlyArray<Partial<DataPreviewSkeletonColumn>> =
    hasColumns && columns
      ? columns
      : FALLBACK_COLUMN_TYPES.map(dtype => ({ dtype }));

  const head: DataPreviewSkeletonHeadCell[] =
    hasColumns && columns
      ? columns.map(column => ({
          kind: 'label',
          label: column.name,
          title: column.dtype ?? undefined,
        }))
      : FALLBACK_HEAD_WIDTHS.map(width => ({ kind: 'bar', width }));

  const baseWidths = sizedColumns.map(getSkeletonCellBaseWidth);
  const rows = Array.from({ length: rowCount }, (_, row) =>
    baseWidths.map((base, column) =>
      Math.round(base * getSkeletonWidthFactor(row, column))
    )
  );

  return { head, rows };
};
