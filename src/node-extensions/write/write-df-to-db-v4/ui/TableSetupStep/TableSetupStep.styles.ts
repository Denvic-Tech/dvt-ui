import { styled } from '@mui/material/styles';

import {
  MONO_FONT_FAMILY,
  scrollbarStyles,
  tokens,
} from '@/shared/ui/clean-minimal/tokens';

/** Правая панель шага 1: выбранная или новая таблица (макет: `.wpane`). */
export const DetailPane = styled('section')({
  position: 'relative',
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 16,
});

export const EmptyState = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontSize: 13,
  color: tokens.textSubtle,
  textAlign: 'center',
});

export const EmptyIcon = styled('span')({
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  backgroundColor: tokens.surfaceMuted,
  color: tokens.textSubtle,
});

export const EmptyTitle = styled('span')({
  fontWeight: 500,
  color: tokens.textSecondary,
});

export const EmptyHint = styled('span')({
  fontSize: 12.5,
});

export const DetailHeader = styled('div')({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const DetailIcon = styled('span')({
  width: 32,
  height: 32,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
  color: tokens.textMuted,
});

export const DetailTitles = styled('div')({
  flex: 1,
  minWidth: 0,
  height: 32,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

export const DetailTitle = styled('div')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 15,
  lineHeight: '18px',
  fontWeight: 600,
  color: tokens.text,
});

export const DetailPath = styled('div')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12.5,
  lineHeight: '14px',
  color: tokens.textMuted,
});

export const DetailForm = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const LoadingState = styled(EmptyState)({
  flexDirection: 'row',
  flex: 'none',
  paddingTop: 48,
});

/* ---------- Вкладки выбранной таблицы (как в Read Table DB V3) ---------- */

/** Панель с вкладками: отступы задают строка вкладок и содержимое. */
export const TabbedDetailPane = styled('section')({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

// Отступ сверху 8px — как у тулбара дерева слева.
export const DetailTabsBar = styled('div')({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 16px 0',
  marginBottom: 8,
});

export const DetailTabPanel = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

/** Цвета пути новой таблицы: акцентные, префикс схемы — приглушённый синий. */
const NEW_TABLE_PREFIX_COLOR = '#868BDA';

/** Путь таблицы справа от вкладок; при нехватке места — многоточие. */
export const TablePath = styled('span', {
  shouldForwardProp: prop => prop !== 'isNew',
})<{ isNew?: boolean }>(({ isNew = false }) => ({
  flex: '0 1 auto',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: isNew ? tokens.accent : tokens.textMuted,
  '& > svg': { flex: 'none' },
}));

export const TablePathText = styled('span', {
  shouldForwardProp: prop => prop !== 'isNew',
})<{ isNew?: boolean }>(({ isNew = false }) => ({
  minWidth: 0,
  overflow: 'hidden',
  fontSize: 12.5,
  fontWeight: 500,
  lineHeight: '18px',
  color: isNew ? tokens.accentStrong : tokens.text,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '& .table-schema': {
    color: isNew ? NEW_TABLE_PREFIX_COLOR : tokens.textSubtle,
    fontWeight: 400,
  },
  '& .table-unnamed': { color: NEW_TABLE_PREFIX_COLOR, fontWeight: 400 },
}));

export const NewBadge = styled('span')({
  flex: 'none',
  height: 16,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 5px',
  borderRadius: 4,
  backgroundColor: tokens.accentSoft,
  color: tokens.accentStrong,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.04em',
});

/** Сообщение вместо содержимого вкладки: «В таблице нет строк» и т. п. */
export const PaneMessage = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '0 24px',
  color: tokens.textSubtle,
  fontSize: 13,
  textAlign: 'center',
});

/** Форма новой таблицы под строкой вкладок. */
export const DraftBody = styled(DetailForm)({
  padding: '8px 16px 16px',
});

/** Колонки существующей таблицы (макет: `.wbox.wcols`). */
export const ColumnsBox = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  margin: '8px 16px 16px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

export const ColumnsBoxHeader = styled('div')({
  height: 36,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 500,
  color: tokens.textMuted,
});

export const ColumnsCount = styled('span')({
  fontSize: 12,
  color: tokens.textSubtle,
  fontVariantNumeric: 'tabular-nums',
});

export const ColumnsList = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  ...scrollbarStyles(tokens.surfaceMuted),
});

export const ColumnRow = styled('div')({
  height: 34,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '0 6px 0 14px',
  '& + &': { borderTop: '1px solid #ECEEF2' },
});

export const ColumnName = styled('span')({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13,
  color: tokens.text,
});

export const ColumnType = styled('span')({
  flex: 'none',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12,
  color: tokens.textSubtle,
});

/* ---------- Строки дерева шага 1 ---------- */

/** «+ Новая таблица» — акцентная строка в начале узла. */
export const AddRowName = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13,
  fontWeight: 500,
  color: tokens.accentStrong,
});

export const AddRowIcon = styled('span')({
  width: 16,
  height: 16,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: tokens.accent,
});
