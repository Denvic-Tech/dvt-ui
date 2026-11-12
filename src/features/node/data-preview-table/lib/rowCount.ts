import { pluralFormRu } from '@/shared/lib/string/pluralizeRu';

/** «из … строк»: форма по общему числу — из 1 строки, из 2 строк, из 5 строк. */
const PREVIEW_ROW_COUNT_UNIT_FORMS: [string, string, string] = [
  'строки',
  'строк',
  'строк',
];

const ROW_COUNT_FORMAT = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

/** Разряды разделяются узким пробелом (U+2009): «5 000 000». */
export const formatRowCount = (value: number): string =>
  ROW_COUNT_FORMAT.formatToParts(value)
    .map(part => (part.type === 'group' ? '\u2009' : part.value))
    .join('');

export type PreviewRowCountLabel = {
  shown: string;
  total: string;
  isEstimate: boolean;
  unit: string;
};

/** Подпись «N из M строк»; null, если источник не сообщил число строк. */
export const getPreviewRowCountLabel = ({
  shownRows,
  rowCount,
  rowCountExact,
}: {
  shownRows: number;
  rowCount: number | null;
  rowCountExact: boolean;
}): PreviewRowCountLabel | null => {
  if (rowCount === null || !Number.isFinite(rowCount)) return null;
  return {
    shown: formatRowCount(shownRows),
    total: formatRowCount(rowCount),
    isEstimate: !rowCountExact,
    unit: pluralFormRu(rowCount, PREVIEW_ROW_COUNT_UNIT_FORMS),
  };
};
