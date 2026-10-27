import { alpha, styled, type Theme } from '@mui/material/styles';

import { thinScrollbar, withActive } from './DataCatalogModal.styles';

/** Палитра таблицы колонок (Clean Minimal); в тёмной теме — от текста темы. */
export const columnTokens = (theme: Theme) => {
  const light = theme.palette.mode === 'light';
  const ink = theme.palette.text.primary;
  const fade = (value: number) => alpha(ink, value);
  return {
    ink: light ? '#1d1f24' : ink,
    t2: light ? '#5a5e68' : theme.palette.text.secondary,
    t3: light ? '#8d919a' : fade(0.5),
    t4: light ? '#b8bbc2' : fade(0.32),
    border: light ? '#e5e6ea' : theme.palette.divider,
    line: light ? '#f0f1f3' : fade(0.06),
    surface: light ? '#f5f6f7' : fade(0.05),
    rowHover: light ? '#fafafb' : fade(0.03),
    tree: light ? '#d6d8de' : fade(0.18),
    treeHover: light ? '#b8bbc2' : fade(0.32),
    rail: light ? '#c9ccd3' : fade(0.24),
    railSolid: light ? '#a3a7b0' : fade(0.4),
    inherited: light ? '#c9ccd2' : fade(0.3),
    mark: light ? '#ffeeb0' : alpha('#facc15', 0.32),
    srcIconBg: light ? '#f0f1f4' : fade(0.07),
    srcIcon: light ? '#6b7080' : fade(0.6),
    srcText: light ? '#3e424b' : fade(0.82),
    tableBg: light ? '#e6effc' : alpha('#3b82f6', 0.16),
    table: light ? '#2f6fd6' : '#60a5fa',
    calcBg: light ? '#fdf1e4' : alpha('#f59e0b', 0.16),
    calc: light ? '#c2620e' : '#f59e0b',
    accent: theme.palette.primary.main,
    accentHover: theme.palette.primary.dark,
    accentSoft: light ? '#eef2ff' : alpha(theme.palette.primary.main, 0.16),
    // На полтона плотнее rowHover, чтобы раскрытую строку не путать с hover.
    openRow: light ? '#f4f5f7' : fade(0.05),
    danger: theme.palette.error.main,
    bg: theme.palette.background.paper,
    footer: light ? '#f7f7f8' : fade(0.03),
  };
};

/** Имена колонок — моноширинным шрифтом (подключён из @fontsource). */
const MONO_FONT =
  "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

const GRID_COLUMNS =
  'minmax(200px, 1.15fr) minmax(200px, 2fr) minmax(200px, 1.3fr) 88px';

/** Классы ячеек: состояния строки задаются data-атрибутами на `.dc-rw`. */
export const CLS = {
  rw: 'dc-rw',
  row: 'dc-row',
  cell: 'dc-c',
  nameCell: 'dc-namel',
  name: 'dc-name',
  branch: 'dc-branch',
  branchLabel: 'dc-br-l',
  group: 'dc-grp',
  desc: 'dc-desc',
  descText: 'dc-desc-t',
  descEmpty: 'dc-desc-e',
  src: 'dc-src',
  srcIcon: 'dc-src-i',
  srcText: 'dc-src-t',
  srcSchema: 'dc-src-s',
  srcExtra: 'dc-src-x',
  nodes: 'dc-nodes',
  chev: 'dc-chev',
  chain: 'dc-chain',
  node: 'dc-node',
  nodeName: 'dc-node-n',
  rail: 'dc-rail',
  nodeIcon: 'dc-node-ic',
  nodeIndex: 'dc-node-i',
  nodeTitle: 'dc-node-t',
  nodeExtra: 'dc-node-e',
  nodeDesc: 'dc-nd-desc',
  nodeDescValue: 'dc-dv',
  nodeInherited: 'dc-nd-inh',
  nodeNote: 'dc-nd-note',
  nodeAdd: 'dc-nd-add',
} as const;

const c = (name: string) => `.${name}`;

export const ColumnsPane = styled('div')({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
});

export const Toolbar = styled('div')({
  alignItems: 'center',
  display: 'flex',
  flexShrink: 0,
  flexWrap: 'wrap',
  gap: 8,
  padding: '14px 24px',
});

export const SearchBox = styled('label')(({ theme }) => {
  const t = columnTokens(theme);
  return {
    alignItems: 'center',
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    color: t.t3,
    display: 'flex',
    flex: '1 1 260px',
    gap: 8,
    height: 32,
    padding: '0 10px',
    '&:focus-within': {
      borderColor: t.accent,
      boxShadow: `0 0 0 3px ${t.accentSoft}`,
    },
    '& input': {
      background: 'none',
      border: 0,
      color: t.ink,
      flex: 1,
      font: 'inherit',
      fontSize: 13,
      minWidth: 0,
      outline: 0,
    },
    '& input::placeholder': { color: t.t3 },
  };
});

export const Seg = styled('div')(({ theme }) => {
  const t = columnTokens(theme);
  return {
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    display: 'flex',
    height: 32,
    overflow: 'hidden',
  };
});

export const SegButton = styled('button', { shouldForwardProp: withActive })<{
  active: boolean;
}>(({ theme, active }) => {
  const t = columnTokens(theme);
  return {
    alignItems: 'center',
    background: active ? t.accentSoft : 'none',
    border: 0,
    borderLeft: `1px solid ${t.border}`,
    color: active ? t.accent : t.t2,
    cursor: 'pointer',
    display: 'flex',
    font: 'inherit',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    gap: 6,
    padding: '0 12px',
    whiteSpace: 'nowrap',
    '&:first-of-type': { borderLeft: 0 },
    '&:hover': { background: active ? t.accentSoft : t.surface },
    '& span': {
      color: active ? t.accent : t.t3,
      fontVariantNumeric: 'tabular-nums',
    },
  };
});

export const ToolbarNote = styled('span')(({ theme }) => ({
  color: columnTokens(theme).t3,
  fontSize: 12,
}));

export const TableHead = styled('div')(({ theme }) => {
  const t = columnTokens(theme);
  return {
    alignItems: 'center',
    borderBottom: `1px solid ${t.border}`,
    color: t.t3,
    columnGap: 24,
    display: 'grid',
    flexShrink: 0,
    fontSize: 12,
    gridTemplateColumns: GRID_COLUMNS,
    height: 32,
    overflowY: 'hidden',
    padding: '0 24px',
    scrollbarGutter: 'stable',
  };
});

export const TableBody = styled('div')(({ theme }) => {
  const t = columnTokens(theme);
  const rw = c(CLS.rw);
  const row = c(CLS.row);
  const name = c(CLS.name);
  const branchLabel = c(CLS.branchLabel);
  const nodeName = c(CLS.nodeName);
  const rail = c(CLS.rail);

  return {
    ...thinScrollbar(theme),
    color: t.ink,
    flex: 1,
    fontSize: 13,
    lineHeight: '18px',
    minHeight: 0,
    overflowX: 'hidden',
    overflowY: 'auto',

    '& mark': { background: t.mark, borderRadius: 2, color: 'inherit' },

    // Строка колонки
    [`& ${rw}`]: {
      borderBottom: `1px solid ${t.line}`,
      position: 'relative',
    },
    [`& ${row}`]: {
      columnGap: 24,
      cursor: 'pointer',
      display: 'grid',
      gridTemplateColumns: GRID_COLUMNS,
      minHeight: 44,
      outline: 'none',
      // 13 + 18 (строка) + 13 = 44: однострочная строка центрирована,
      // а «локоть» дерева (высота 23px) приходит в середину имени.
      padding: '13px 24px',
      position: 'relative',
    },
    [`& ${row}:hover`]: { background: t.rowHover },
    [`& ${row}:focus-visible`]: {
      boxShadow: `inset 0 0 0 2px ${alpha(t.accent, 0.4)}`,
    },
    // Раскрытая колонка: серый фон только у строки-родителя, раскрытая
    // область без тонировки. `&&` перебивает hover-сбросы ниже.
    [`& ${rw}[data-g="1"] ${row}:hover`]: { background: 'none' },
    [`&& ${rw}[data-colopen="1"] > ${row}, && ${rw}[data-colopen="1"] > ${row}:hover`]:
      { background: t.openRow },
    [`& ${rw}[data-grp-end="0"]`]: { borderBottomColor: 'transparent' },

    [`& ${c(CLS.cell)}`]: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      position: 'relative',
    },
    [`& ${c(CLS.nameCell)}`]: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: 6,
      whiteSpace: 'nowrap',
    },
    [`& ${name}`]: {
      color: t.srcText,
      flexShrink: 1,
      fontFamily: MONO_FONT,
      fontSize: 12.5,
      fontWeight: 500,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    [`& ${c(CLS.branch)}`]: {
      alignItems: 'baseline',
      display: 'flex',
      gap: 6,
      minWidth: 0,
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.branch)} ${name}`]: { color: t.t2 },
    [`& ${branchLabel}`]: {
      color: t.t2,
      flexShrink: 0,
      fontWeight: 500,
      letterSpacing: '.01em',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    [`& ${c(CLS.group)}`]: {
      alignItems: 'center',
      color: t.t3,
      display: 'flex',
      flexShrink: 0,
      fontSize: 12,
      gap: 3,
      marginLeft: 'auto',
      paddingLeft: 10,
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.group)}[data-on="1"]`]: { color: t.accent },

    // Дерево отрезков: вертикаль от строки-колонки и «локти» вложенных строк
    [`& ${rw}[data-nested="1"] ${c(CLS.nameCell)}`]: { paddingLeft: 22 },
    // Отрезки изменений плотнее строк колонок: 9 + 18 + 9 = 36.
    [`& ${rw}[data-nested="1"] ${row}`]: {
      minHeight: 36,
      paddingBottom: 9,
      paddingTop: 9,
    },
    [`& ${rw}[data-nested="1"] ${row}:hover`]: { background: 'none' },
    [`& ${rw}[data-parent="1"]::after`]: {
      borderLeft: `1px solid ${t.tree}`,
      bottom: -1,
      content: '""',
      left: 30,
      pointerEvents: 'none',
      position: 'absolute',
      top: 44,
      zIndex: 1,
    },
    [`& ${rw}[data-nested="1"] ${row}::before`]: {
      borderBottom: `1px solid ${t.tree}`,
      borderBottomLeftRadius: 7,
      borderLeft: `1px solid ${t.tree}`,
      content: '""',
      // До середины имени отрезка: -1 + 19 = 18 (9px отступ + половина строки).
      height: 19,
      left: 30,
      position: 'absolute',
      top: -1,
      width: 10,
      zIndex: 0,
    },
    [`& ${rw}[data-nested="1"][data-grp-end="0"]::after`]: {
      borderLeft: `1px solid ${t.tree}`,
      bottom: -1,
      content: '""',
      left: 30,
      pointerEvents: 'none',
      position: 'absolute',
      top: -1,
      zIndex: 1,
    },
    [`& ${rw}[data-nested="1"]:is([data-hl="hov"], [data-hl="open"]) ${row}::before`]:
      { zIndex: 2 },
    [`& ${rw}[data-nested="1"][data-hl="hov"] ${row}::before`]: {
      borderColor: t.treeHover,
    },
    [`& ${rw}[data-hl="hov"] :is(${branchLabel}, ${name})`]: { color: t.ink },
    [`& ${rw}[data-nested="1"][data-hl="open"] ${row}::before`]: {
      borderColor: t.accent,
    },
    [`& ${rw}[data-hl="open"] :is(${branchLabel}, ${name})`]: {
      color: t.accent,
    },
    // !important: правило вертикали вложенных строк специфичнее и иначе
    // оставляет серыми участки линии рядом с соседними отрезками.
    [`& ${rw}[data-line="hov"]::after`]: {
      borderColor: `${t.treeHover} !important`,
    },
    [`& ${rw}[data-line="open"]::after`]: {
      borderColor: `${t.accent} !important`,
    },
    [`& ${rw}[data-nested="1"][data-hl="open"] ${row}:not([data-fresh]):hover::before`]:
      { borderColor: `${t.accentHover} !important` },
    [`& ${rw}[data-hl="open"] ${row}:not([data-fresh]):hover :is(${branchLabel}, ${name})`]:
      { color: t.accentHover },
    [`&:has(${rw}[data-hl="open"] ${row}:not([data-fresh]):hover) ${rw}[data-line="open"]::after`]:
      { borderColor: `${t.accentHover} !important` },
    [`& ${rw}:is([data-nested="1"], [data-parent="1"]) ${nodeName}`]: {
      paddingLeft: 52,
    },
    [`& ${rw}:is([data-nested="1"], [data-parent="1"]) ${rail}`]: { left: 28 },

    // Описание
    [`& ${c(CLS.desc)}`]: {
      alignSelf: 'flex-start',
      background: 'none',
      border: 0,
      color: 'inherit',
      cursor: 'pointer',
      font: 'inherit',
      maxWidth: '100%',
      padding: 0,
      textAlign: 'left',
    },
    [`& ${c(CLS.desc)}:focus-visible`]: {
      borderRadius: 3,
      outline: `2px solid ${alpha(t.accent, 0.4)}`,
      outlineOffset: 2,
    },
    [`& ${c(CLS.descText)}`]: {
      color: t.t2,
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.descEmpty)}`]: { color: t.t4 },
    [`& ${c(CLS.desc)}:hover ${c(CLS.descEmpty)}`]: { color: t.accent },
    [`& ${c(CLS.desc)}:hover ${c(CLS.descText)}`]: {
      color: t.accent,
      textDecoration: 'underline',
      textDecorationColor: 'currentColor',
      textUnderlineOffset: 3,
    },

    // Источник
    // Источник тем же моноширинным шрифтом, что и имена колонок.
    [`& ${c(CLS.src)}`]: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: MONO_FONT,
      fontSize: 12.5,
      gap: 8,
      minWidth: 0,
    },
    [`& ${c(CLS.srcIcon)}`]: {
      alignItems: 'center',
      background: t.tableBg,
      borderRadius: 6,
      color: t.table,
      display: 'flex',
      flex: 'none',
      height: 22,
      justifyContent: 'center',
      margin: '-2px 0',
      width: 22,
    },
    [`& ${c(CLS.src)}[data-calc="1"] ${c(CLS.srcIcon)}`]: {
      background: t.calcBg,
      color: t.calc,
    },
    [`& ${c(CLS.srcText)}`]: {
      color: t.srcText,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.srcSchema)}`]: { color: t.t3 },
    [`& ${c(CLS.src)}[data-calc="1"] ${c(CLS.srcText)}`]: { flex: 'none' },
    [`& ${c(CLS.srcExtra)}`]: {
      color: t.t3,
      marginLeft: -3,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    // Путь
    [`& ${c(CLS.nodes)}`]: {
      alignItems: 'flex-start',
      color: t.t3,
      flexDirection: 'row',
      fontSize: 12.5,
      fontVariantNumeric: 'tabular-nums',
      justifyContent: 'space-between',
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.chev)}`]: {
      alignItems: 'center',
      color: t.t4,
      display: 'flex',
      height: 18,
      transition: 'transform .15s',
    },
    [`& ${rw}:is([data-open="1"], [data-colopen="1"]) ${c(CLS.chev)}`]: {
      color: t.accent,
      transform: 'rotate(90deg)',
    },

    // Цепочка нод колонки
    [`& ${c(CLS.chain)}`]: {
      borderTop: `1px solid ${t.line}`,
      padding: '4px 24px',
    },
    // Без отрезков ниже цепочка закрывает строку — оставляем воздух снизу.
    [`& ${c(CLS.chain)}[data-plain="1"]`]: { paddingBottom: 10 },
    [`& ${c(CLS.chain)}[data-plain="1"] ${rail}`]: { left: 9 },
    [`& ${c(CLS.chain)}[data-plain="1"] ${nodeName}`]: { paddingLeft: 33 },
    [`& ${c(CLS.node)}`]: {
      alignItems: 'center',
      columnGap: 24,
      display: 'grid',
      gridTemplateColumns: GRID_COLUMNS,
      margin: '0 -24px',
      minHeight: 36,
      padding: '0 24px',
      position: 'relative',
    },
    [`& ${c(CLS.node)} > *`]: {
      alignItems: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      position: 'relative',
    },
    [`& ${nodeName}`]: {
      gap: 8,
      minWidth: 0,
      paddingLeft: 24,
    },
    [`& ${rail}`]: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      top: 0,
      width: 7,
    },
    [`& ${rail}::before, & ${rail}::after`]: {
      borderLeft: `1px dashed ${t.rail}`,
      content: '""',
      left: 3,
      position: 'absolute',
    },
    [`& ${rail}::before`]: { bottom: '50%', top: 0 },
    [`& ${rail}::after`]: { bottom: 0, top: '50%' },
    [`& ${c(CLS.node)}[data-first="1"] ${rail}::before`]: { display: 'none' },
    [`& ${c(CLS.node)}[data-last="1"] ${rail}::after`]: { display: 'none' },
    [`& ${c(CLS.node)}[data-pt="1"] ${rail}::before, & ${c(CLS.node)}[data-pb="1"] ${rail}::after`]:
      { borderColor: t.railSolid, borderLeftStyle: 'solid' },
    // Подложка непрозрачная: линия цепочки уходит под иконку, а не сквозь неё.
    [`& ${c(CLS.nodeIcon)}`]: {
      alignItems: 'center',
      backgroundColor: t.bg,
      backgroundImage: `linear-gradient(${t.srcIconBg}, ${t.srcIconBg})`,
      borderRadius: 5,
      color: t.srcIcon,
      cursor: 'default',
      display: 'flex',
      height: 20,
      justifyContent: 'center',
      left: -7,
      marginTop: -10,
      position: 'absolute',
      top: '50%',
      transition: 'transform .12s ease-out',
      width: 20,
      zIndex: 1,
    },
    [`& ${c(CLS.nodeIcon)}:hover`]: { transform: 'scale(1.2)', zIndex: 3 },
    [`& ${c(CLS.node)}[data-in="0"] ${c(CLS.nodeIcon)}`]: {
      backgroundImage: `linear-gradient(${t.srcIconBg}, ${t.srcIconBg}) !important`,
      color: `${t.t3} !important`,
    },
    [`& ${c(CLS.nodeTitle)}`]: {
      background: 'none',
      border: 0,
      color: t.ink,
      cursor: 'pointer',
      font: 'inherit',
      overflow: 'hidden',
      padding: 0,
      textAlign: 'left',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.nodeTitle)}:hover`]: { color: t.accent },
    // Номер внутри кнопки названия: цвет и hover наследуются от неё.
    [`& ${c(CLS.nodeIndex)}`]: {
      display: 'inline-block',
      fontVariantNumeric: 'tabular-nums',
      marginRight: 4,
      minWidth: 16,
      textAlign: 'right',
    },
    [`& ${c(CLS.node)}[data-in="0"] ${c(CLS.nodeTitle)}`]: { color: t.t3 },
    // Неактивные ноды на hover не синеют, а темнеют на тон серого.
    [`& ${c(CLS.node)}[data-in="0"] ${c(CLS.nodeTitle)}:hover`]: {
      color: t.t2,
    },
    [`& ${c(CLS.nodeExtra)}`]: { minWidth: 0 },
    [`& ${c(CLS.nodeDesc)}`]: {
      alignItems: 'baseline',
      background: 'none',
      border: 0,
      color: t.t2,
      cursor: 'pointer',
      display: 'flex',
      font: 'inherit',
      gap: 8,
      maxWidth: '100%',
      minWidth: 0,
      padding: 0,
      textAlign: 'left',
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.nodeDescValue)}`]: {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    [`& ${c(CLS.nodeDesc)}:hover ${c(CLS.nodeDescValue)}`]: {
      color: t.accent,
      textDecoration: 'underline',
      textDecorationColor: 'currentColor',
      textUnderlineOffset: 3,
    },
    [`& :is(${c(CLS.nodeInherited)}, ${c(CLS.nodeNote)})`]: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    [`& ${c(CLS.nodeInherited)}`]: { color: t.inherited },
    [`& ${c(CLS.nodeNote)}`]: { color: t.t3 },
    [`& ${c(CLS.nodeAdd)}`]: {
      alignItems: 'center',
      background: 'none',
      border: 0,
      color: t.t4,
      cursor: 'pointer',
      display: 'inline-flex',
      font: 'inherit',
      maxWidth: '100%',
      padding: 0,
      textAlign: 'left',
    },
    [`& ${c(CLS.nodeAdd)}:hover`]: { color: t.accent },
  };
});

export const EmptyState = styled('div')(({ theme }) => ({
  alignItems: 'center',
  color: columnTokens(theme).t3,
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  padding: '48px 0',
}));

/** Служебные списки под таблицей: ноды без колонок и потерянные описания. */
export const IssuesSection = styled('section')(({ theme }) => {
  const t = columnTokens(theme);
  return {
    borderTop: `1px solid ${t.border}`,
    display: 'grid',
    gap: 4,
    padding: '14px 24px 16px',
    '& h3': {
      color: t.t3,
      fontSize: 12,
      fontWeight: 500,
      margin: '0 0 4px',
    },
  };
});

export const IssueRow = styled('div')(({ theme }) => {
  const t = columnTokens(theme);
  return {
    alignItems: 'baseline',
    color: t.t2,
    display: 'flex',
    gap: 10,
    minHeight: 28,
    minWidth: 0,
    '& b': { color: t.ink, fontWeight: 500 },
    '& span': {
      color: t.t3,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  };
});

export const TextButton = styled('button')(({ theme }) => {
  const t = columnTokens(theme);
  return {
    background: 'none',
    border: 0,
    color: t.danger,
    cursor: 'pointer',
    flexShrink: 0,
    font: 'inherit',
    fontWeight: 500,
    marginLeft: 'auto',
    padding: 0,
    '&:hover:not(:disabled)': {
      textDecoration: 'underline',
      textUnderlineOffset: 3,
    },
    '&:disabled': { cursor: 'default', opacity: 0.5 },
  };
});

/** Строка-заглушка скелетона: та же сетка и высота, что у строки колонки. */
export const SkeletonRow = styled('div')(({ theme }) => ({
  alignItems: 'center',
  borderBottom: `1px solid ${columnTokens(theme).line}`,
  columnGap: 24,
  display: 'grid',
  gridTemplateColumns: GRID_COLUMNS,
  minHeight: 44,
  padding: '0 24px',
}));
