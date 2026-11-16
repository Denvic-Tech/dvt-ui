import { styled } from '@mui/material/styles';

import { SkeletonBar } from '@/shared/ui/clean-minimal/controls';
import { tokens } from '@/shared/ui/clean-minimal/tokens';

const previewScrollbar = {
  '&::-webkit-scrollbar': { width: 10, height: 10 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    background: tokens.scrollThumb,
    borderRadius: 8,
    border: `3px solid ${tokens.surface}`,
  },
  '&::-webkit-scrollbar-button': { display: 'none', width: 0, height: 0 },
  '&::-webkit-scrollbar-corner': { background: 'transparent' },
  '@supports not selector(::-webkit-scrollbar)': {
    scrollbarWidth: 'thin',
    scrollbarColor: `${tokens.scrollThumb} transparent`,
  },
} as const;

/** Контейнер таблицы превью: рамка и скролл. */
export const DataPreviewFrame = styled('div')({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  margin: '8px 16px 16px',
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  backgroundColor: tokens.surface,
  ...previewScrollbar,
});

/**
 * Таблица превью. Колонка нумерации — ячейки с классом `preview-index`.
 * `skeleton` отключает подсветку строк при наведении на время загрузки.
 */
export const DataPreviewTable = styled('table', {
  shouldForwardProp: prop => prop !== 'skeleton',
})<{ skeleton?: boolean }>(({ skeleton = false }) => ({
  minWidth: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: 12,
  '& th': {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    height: 28,
    padding: '0 10px',
    borderBottom: `1px solid ${tokens.divider}`,
    backgroundColor: tokens.surfaceMuted,
    color: tokens.textMuted,
    fontSize: 11.5,
    fontWeight: 500,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  '& th + th': { borderLeft: `1px solid ${tokens.divider}` },
  '& td': {
    maxWidth: 200,
    height: 28,
    padding: '0 10px',
    overflow: 'hidden',
    borderBottom: `1px solid ${tokens.dividerSoft}`,
    color: tokens.text,
    fontVariantNumeric: 'tabular-nums',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& td + td': { borderLeft: `1px solid ${tokens.dividerSoft}` },
  '& tbody tr:nth-of-type(even) td': { backgroundColor: '#FAFBFD' },
  ...(skeleton
    ? {}
    : { '& tbody tr:hover td': { backgroundColor: '#F2F4FF' } }),
  '& tbody tr:last-of-type td': { borderBottom: 'none' },
  '& .preview-index': {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    // В превью не больше 99 строк: ширина под двузначный номер.
    width: 16,
    boxSizing: 'content-box',
    padding: '0 6px',
    borderRight: `1px solid ${tokens.divider}`,
    color: tokens.textDisabled,
    textAlign: 'right',
  },
  '& th.preview-index': { zIndex: 3 },
  '& tr td.preview-index, & tbody tr:nth-of-type(even) td.preview-index, & tbody tr:hover td.preview-index':
    { backgroundColor: tokens.surfaceMuted },
  '& .preview-index + th, & .preview-index + td': { borderLeft: 'none' },
  '& .preview-null': { color: tokens.textFaint },
}));

/** Плашка скелетонной шапки: ниже и на тон темнее плашек в ячейках. */
export const SkeletonHeadBar = styled(SkeletonBar)({
  height: 7,
  background: 'linear-gradient(90deg, #E6E9EF 0%, #DDE1E8 50%, #E6E9EF 100%)',
  backgroundSize: '200% 100%',
});

/** Номер строки: короткая плашка по правому краю колонки. */
export const SkeletonIndexBar = styled(SkeletonBar)({
  width: 12,
  height: 7,
  marginLeft: 'auto',
});
