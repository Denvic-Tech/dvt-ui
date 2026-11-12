import { Menu } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

import { scrollbarStyles, tokens } from '@/shared/ui/clean-minimal/tokens';

export const TREE_INDENT = 18;
export const TREE_BASE_PADDING = 8;

export const getCatalogTreeRowPadding = (depth: number) =>
  TREE_BASE_PADDING + depth * TREE_INDENT;

/** Высоты строк — из них считается top прилипающих шапок. */
export const TREE_ROW_HEIGHT = 30;
export const TREE_FILTER_ROW_HEIGHT = 32;

export const TreePane = styled('section')({
  width: 320,
  flex: 'none',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${tokens.divider}`,
});

export const TreeToolbar = styled('div')({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '8px 12px 0 8px',
  '& > label': { flex: 1, marginRight: 2 },
});

/**
 * Скролл-контейнер дерева. Вертикального отступа здесь нет, иначе над
 * прилипшей шапкой просвечивали бы строки; он — на `TreeListInner`.
 */
export const TreeList = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '0 8px',
  ...scrollbarStyles(),
});

export const TreeListInner = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 0',
});

/** Раскрытый узел с детьми: ограничивает прилипание шапки своим узлом. */
export const TreeGroup = styled('div')({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
});

/** Строка раскрытого узла и его поле поиска; `top` и `z-index` — inline. */
export const TreeStickyHeader = styled('div')({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  backgroundColor: tokens.surface,
});

/** Короткая подсветка только что созданного узла. */
const justCreatedFlash = keyframes`
  0%, 40% { background-color: ${tokens.accentSoft}; }
  100% { background-color: transparent; }
`;

export const TreeRowButton = styled('button', {
  shouldForwardProp: prop =>
    prop !== 'selected' && prop !== 'onPath' && prop !== 'highlighted',
})<{ selected: boolean; onPath: boolean; highlighted?: boolean }>(
  ({ selected, onPath, highlighted = false }) => ({
    flex: 'none',
    width: '100%',
    height: TREE_ROW_HEIGHT,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
    border: 'none',
    borderRadius: 7,
    backgroundColor: selected ? tokens.accentSoft : 'transparent',
    color: tokens.text,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: selected ? tokens.accentSoft : tokens.hover,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `inset 0 0 0 1px ${tokens.accent}`,
    },
    '& .tree-icon': {
      color: selected
        ? tokens.accentStrong
        : onPath
          ? tokens.accent
          : tokens.textMuted,
    },
    // На пути к выбранной таблице название того же цвета, что у таблицы,
    // начертание прежнее.
    '& .tree-name': {
      color: selected || onPath ? tokens.accentStrong : tokens.text,
      fontWeight: selected ? 600 : 500,
    },
    ...(highlighted
      ? {
          animation: `${justCreatedFlash} 1.6s ease-out`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }
      : {}),
  })
);

/**
 * Строка узла с действиями справа (кнопка «⋯»): действия видны при
 * наведении или когда их меню открыто, счётчик в это время прячется.
 */
export const TreeRowWithActions = styled('div')({
  position: 'relative',
  flex: 'none',
  display: 'flex',
  '& > button[role="treeitem"]': { flex: 1, minWidth: 0 },
  '&:hover .tree-row-actions, & .tree-row-actions:focus-within, & .tree-row-actions:has([aria-expanded="true"])':
    { opacity: 1 },
  '&:hover .tree-count, &:has(.tree-row-actions [aria-expanded="true"]) .tree-count':
    { opacity: 0 },
  '&:has(.tree-row-actions [aria-expanded="true"]) > button[role="treeitem"]': {
    backgroundColor: tokens.hover,
  },
});

export const TreeRowActions = styled('span')({
  position: 'absolute',
  top: 3,
  right: 4,
  display: 'flex',
  opacity: 0,
});

/** Кнопка «⋯» в строке узла. */
export const TreeRowActionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ active = false }) => ({
  width: 24,
  height: 24,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 6,
  backgroundColor: active ? '#E9ECF2' : 'transparent',
  color: active ? tokens.text : tokens.textMuted,
  cursor: 'pointer',
  '&:hover': { backgroundColor: '#E9ECF2', color: tokens.text },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accent}`,
  },
}));

export const TreeChevron = styled('span', {
  shouldForwardProp: prop => prop !== 'open',
})<{ open?: boolean }>(({ open = false }) => ({
  width: 16,
  height: 16,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: tokens.textSubtle,
  transition: 'transform .12s',
  transform: open ? 'rotate(90deg)' : 'none',
}));

export const TreeIcon = styled('span')({
  width: 16,
  height: 16,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const TreeName = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  fontSize: 13,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const TreeCount = styled('span')({
  marginLeft: 'auto',
  flex: 'none',
  fontSize: 12,
  color: tokens.textSubtle,
  fontVariantNumeric: 'tabular-nums',
});

export const TreeStatusRow = styled('div')({
  flex: 'none',
  minHeight: 28,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingRight: 8,
  fontSize: 12.5,
  color: tokens.textSubtle,
});

/* ---------- Поиск внутри узла ---------- */

export const TreeFilterRow = styled('div')({
  flex: 'none',
  height: TREE_FILTER_ROW_HEIGHT,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  paddingRight: 8,
});

export const NodeSearchField = styled('div')({
  flex: 1,
  minWidth: 0,
  height: 26,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 4px 0 8px',
  borderRadius: 6,
  backgroundColor: tokens.surfaceMuted,
  color: tokens.textSubtle,
  '&:focus-within': {
    backgroundColor: tokens.surface,
    boxShadow: `inset 0 0 0 1px ${tokens.accent}, ${tokens.focusRing}`,
  },
});

/** Иконка и поле ввода; кнопка очистки — соседний элемент, не внутри label. */
export const NodeSearchLabel = styled('label')({
  flex: 1,
  minWidth: 0,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'text',
  '& > svg': { flex: 'none' },
  '& input': {
    flex: 1,
    minWidth: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: tokens.text,
    fontSize: 12.5,
    '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
  },
});

export const NodeSearchClear = styled('button')({
  width: 18,
  height: 18,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: tokens.textSubtle,
  cursor: 'pointer',
  '&:hover': { backgroundColor: tokens.border, color: tokens.text },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accent}`,
  },
});

export const TreeSkeletonRow = styled('div')({
  flex: 'none',
  height: TREE_ROW_HEIGHT,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  paddingLeft: TREE_BASE_PADDING,
  paddingRight: 8,
  '& .tree-skeleton-icon': {
    width: 14,
    height: 14,
    margin: '0 1px',
    flex: 'none',
    borderRadius: 4,
  },
});

export const TreeMenu = styled(Menu)({
  '& .MuiPaper-root': {
    minWidth: 200,
    marginTop: 4,
    padding: 4,
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    backgroundColor: tokens.surface,
    boxShadow: tokens.menuShadow,
  },
  '& .MuiList-root': {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    padding: 0,
  },
  '& .MuiDivider-root': {
    // !important: иначе MUI `MenuItem + .MuiDivider-root` ставит 8px.
    margin: '4px 6px !important',
    borderColor: tokens.divider,
  },
  '& .MuiMenuItem-root': {
    minHeight: 32,
    height: 32,
    gap: 10,
    padding: '0 10px',
    borderRadius: 7,
    color: tokens.text,
    fontSize: 13,
    fontWeight: 500,
    '& svg': { color: tokens.textMuted },
    '&:hover, &.Mui-focusVisible': { backgroundColor: tokens.hover },
  },
});

export const ExpressionHeader = styled('div')({
  flex: 'none',
  height: 40,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 12px 0 16px',
  '& > *:first-of-type': { marginLeft: -7 },
});

export const ExpressionTitle = styled('span')({
  flex: 1,
  fontSize: 13,
  fontWeight: 500,
});

export const ExpressionFieldsList = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: '12px 16px 16px',
  ...scrollbarStyles(),
});

export const ExpressionLabel = styled('div')({
  display: 'block',
  marginBottom: 6,
  fontSize: 12.5,
  fontWeight: 500,
  color: tokens.textSecondary,
});

export const ExpressionHint = styled('div')({
  fontSize: 12,
  color: tokens.textSubtle,
});
