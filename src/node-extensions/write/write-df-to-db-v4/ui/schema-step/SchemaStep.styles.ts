import { keyframes, styled } from '@mui/material/styles';

import {
  FONT_FAMILY,
  MONO_FONT_FAMILY,
  scrollbarStyles,
  tokens,
} from '@/shared/ui/clean-minimal/tokens';

/**
 * Разметка шага «Схема таблицы» (макеты WdbStep2New и WdbMapD):
 * шапка с путём таблицы, таблица колонок на CSS grid и боковая панель
 * комментария.
 */

const CHANGED_BORDER = '#A9AEF6';
const CHANGED_BACKGROUND = '#F7F8FF';
const ROW_PADDING_RIGHT = 10;
/** Ширина скроллбара из `scrollbarStyles`: GridBody резервирует её всегда. */
const SCROLLBAR_GUTTER = 8;

export const SchemaStepRoot = styled('div')({
  position: 'relative',
  height: '100%',
  minHeight: 0,
  // Панель комментария въезжает справа (translateX): без обрезки она на
  // время анимации выходит за край, и в модалке мелькает горизонтальный
  // скролл. clip, а не hidden: не создаёт прокручиваемый контейнер.
  overflowX: 'clip',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
  backgroundColor: tokens.surface,
  color: tokens.text,
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  '& button, & input, & textarea': { fontFamily: 'inherit' },
});

export const SchemaStepHeader = styled('div')({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});

export const HeaderSpacer = styled('span')({ flex: 1 });

/** Чип пути таблицы: клик возвращает к шагу 1 (макет: `.tpath`). */
export const TablePathButton = styled('button')({
  minWidth: 0,
  height: 32,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 12px 0 10px',
  border: 'none',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
  fontSize: 13,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  '&:hover': { backgroundColor: tokens.divider },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accent}`,
  },
  '&:disabled': { cursor: 'default' },
  '&:disabled:hover': { backgroundColor: tokens.surfaceMuted },
  '& .path-icon': { flex: 'none', marginRight: 2, color: tokens.textMuted },
  '& .path-parent': { color: tokens.textMuted },
  '& .path-separator': { color: tokens.textDisabled },
  '& .path-name': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: tokens.text,
    fontWeight: 600,
  },
  '& .path-dot': {
    width: 3,
    height: 3,
    flex: 'none',
    margin: '0 2px',
    borderRadius: '50%',
    backgroundColor: tokens.textDisabled,
  },
  '& .path-count': { fontSize: 12.5, color: tokens.textMuted },
});

/** Переключатель-сегменты в серой подложке (макет: `.pseg.t-seg`). */
export const SegmentGroup = styled('div')({
  flex: 'none',
  height: 32,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  padding: 4,
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

export const SegmentTab = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  height: 24,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 10px',
  border: 'none',
  borderRadius: 5,
  backgroundColor: active ? tokens.surface : 'transparent',
  boxShadow: active ? tokens.raisedShadow : 'none',
  color: active ? tokens.text : tokens.textMuted,
  fontSize: 12.5,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  '&:hover': { color: tokens.text },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accentRing}`,
  },
  '& .segment-count': {
    marginLeft: 2,
    color: tokens.textSubtle,
    fontVariantNumeric: 'tabular-nums',
  },
}));

/* ───────────────────────── Таблица колонок ───────────────────────── */

export const GridTable = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

/**
 * Строка таблицы. `columns` — grid-template-columns: у новой таблицы и у
 * сопоставления разные наборы колонок.
 */
export const GridRow = styled('div', {
  shouldForwardProp: prop =>
    prop !== 'columns' && prop !== 'gap' && prop !== 'active' && prop !== 'off',
})<{ columns: string; gap: number; active?: boolean; off?: boolean }>(
  ({ columns, gap, active = false, off = false }) => ({
    display: 'grid',
    gridTemplateColumns: columns,
    columnGap: gap,
    alignItems: 'center',
    padding: `0 ${ROW_PADDING_RIGHT}px 0 14px`,
    backgroundColor: active ? '#FAFBFD' : undefined,
    ...(off
      ? {
          '& .df-name, & .df-type, & .db-type': { color: tokens.textDisabled },
          '& .grid-input input': { color: tokens.textSubtle },
        }
      : {}),
  })
);

export const GridHeadRow = styled(GridRow)({
  flex: 'none',
  height: 34,
  // Тот же резерв под скроллбар, что у GridBody (scrollbar-gutter: stable):
  // иначе резиновые колонки в строках уже, чем в шапке, и колонки правее
  // них съезжают влево относительно заголовков.
  paddingRight: ROW_PADDING_RIGHT + SCROLLBAR_GUTTER,
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
  fontSize: 12,
  fontWeight: 500,
  color: tokens.textMuted,
  whiteSpace: 'nowrap',
  '& > *': {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export const GridBody = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
  paddingBottom: 8,
  ...scrollbarStyles(),
});

export const GridBodyRow = styled(GridRow)({
  height: 44,
  boxSizing: 'border-box',
  borderTop: `1px solid ${tokens.divider}`,
  '&[data-first-row="true"]': { borderTopColor: 'transparent' },
});

export const GridEmpty = styled('div')({
  padding: 14,
  fontSize: 13,
  color: tokens.textSubtle,
});

export const HeadWithHint = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  overflow: 'visible !important',
});

/** Значок (i) с подсказкой по наведению/фокусу (макет: `.sgi2`). */
export const HintIcon = styled('span')({
  position: 'relative',
  width: 16,
  height: 16,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  color: tokens.textSubtle,
  cursor: 'help',
  outline: 'none',
  '&:hover, &:focus-visible': { color: tokens.textSecondary },
  '& .hint-tip': {
    position: 'absolute',
    top: 22,
    left: -6,
    zIndex: 50,
    width: 280,
    padding: '8px 10px',
    borderRadius: 8,
    backgroundColor: tokens.tooltip,
    boxShadow: tokens.tooltipShadow,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 400,
    lineHeight: '17px',
    whiteSpace: 'normal',
    textAlign: 'left',
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
    transition: 'opacity .12s, visibility .12s',
  },
  '&:hover .hint-tip, &:focus-visible .hint-tip': {
    opacity: 1,
    visibility: 'visible',
  },
});

/** Колонка DataFrame: имя и тип (макет: `.dfc`). */
export const DfCell = styled('span')({
  minWidth: 0,
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  '& .df-name': {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 13,
    color: tokens.text,
  },
  '& .df-type': {
    flex: 'none',
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 11.5,
    color: tokens.textSubtle,
  },
});

export const MutedDash = styled('span')({
  fontSize: 12.5,
  color: tokens.textSubtle,
});

/** Поле ввода в ячейке (макет: `.inp.gin`). */
export const GridInput = styled('label', {
  shouldForwardProp: prop =>
    prop !== 'changed' && prop !== 'invalid' && prop !== 'mono',
})<{ changed?: boolean; invalid?: boolean; mono?: boolean }>(
  ({ changed = false, invalid = false, mono = false }) => ({
    position: 'relative',
    width: '100%',
    height: 30,
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 10px',
    border: `1px solid ${
      invalid ? '#E5484D' : changed ? CHANGED_BORDER : tokens.border
    }`,
    borderRadius: 8,
    backgroundColor: changed && !invalid ? CHANGED_BACKGROUND : tokens.surface,
    cursor: 'text',
    '&:focus-within': {
      borderColor: invalid ? '#E5484D' : tokens.accent,
      boxShadow: invalid ? '0 0 0 3px #FDECEC' : tokens.focusRing,
    },
    '& input': {
      flex: 1,
      minWidth: 0,
      padding: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: tokens.text,
      fontFamily: mono ? MONO_FONT_FAMILY : 'inherit',
      fontSize: mono ? 12.5 : 13,
      '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
    },
    '& .input-reset': {
      opacity: 0,
      pointerEvents: 'none',
    },
    '&:hover .input-reset, &:focus-within .input-reset': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  })
);

/** Кнопка «вернуть исходное имя» внутри поля. */
export const InputResetButton = styled('button')({
  width: 18,
  height: 18,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: -4,
  padding: 0,
  border: 'none',
  borderRadius: 5,
  backgroundColor: 'transparent',
  color: tokens.textSubtle,
  cursor: 'pointer',
  transition: 'opacity .12s',
  '&:hover': { backgroundColor: tokens.hoverStrong, color: tokens.text },
});

const freshFlash = keyframes`
  0%, 50% { color: ${tokens.accentStrong}; }
  100% { color: ${tokens.textSecondary}; }
`;

/** «Имя в БД»: результат нормализации (макет: `.eff`). */
export const EffectiveCell = styled('span')({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

export const EffectiveName = styled('span', {
  shouldForwardProp: prop => prop !== 'stale' && prop !== 'fresh',
})<{ stale?: boolean; fresh?: boolean }>(
  ({ stale = false, fresh = false }) => ({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 12.5,
    color: tokens.textSecondary,
    opacity: stale ? 0.45 : 1,
    transition: 'color .3s, opacity .2s',
    ...(fresh ? { animation: `${freshFlash} 1s ease-out` } : {}),
  })
);

/** Переключатель NULL (макет: `.tgl`); изменённый — оранжевый. */
export const ToggleSwitch = styled('button', {
  shouldForwardProp: prop => prop !== 'checked' && prop !== 'changed',
})<{ checked: boolean; changed?: boolean }>(({ checked, changed = false }) => ({
  position: 'relative',
  width: 30,
  height: 18,
  flex: 'none',
  padding: 0,
  border: 'none',
  borderRadius: 9,
  backgroundColor: changed
    ? checked
      ? '#F5A524'
      : '#FAD7A0'
    : checked
      ? tokens.accent
      : '#DCE1EA',
  cursor: 'pointer',
  transition: 'background-color .18s',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(20, 24, 40, 0.18)',
    transform: checked ? 'translateX(12px)' : 'none',
    transition: 'transform .18s cubic-bezier(.3, .7, .2, 1)',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${tokens.accentRing}`,
  },
  '&:disabled': { cursor: 'default', opacity: 0.45 },
}));

/** Роль колонки в схеме — только чтение (макет: `.rtag`). */
export const RoleCell = styled('span')({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  overflow: 'hidden',
});

export const RoleTag = styled('span')({
  flex: 'none',
  padding: '0 6px',
  borderRadius: 5,
  backgroundColor: tokens.accentSoft,
  color: tokens.accentStrong,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '.02em',
  lineHeight: '18px',
});

/** Кнопка комментария в ячейке (макет: `.cbtn`). */
export const CommentButton = styled('button', {
  shouldForwardProp: prop => prop !== 'changed' && prop !== 'active',
})<{ changed?: boolean; active?: boolean }>(
  ({ changed = false, active = false }) => ({
    width: '100%',
    height: 30,
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 10px',
    border: `1px solid ${
      active ? tokens.accent : changed ? CHANGED_BORDER : tokens.border
    }`,
    borderRadius: 8,
    backgroundColor: changed && !active ? CHANGED_BACKGROUND : tokens.surface,
    boxShadow: active ? tokens.focusRing : 'none',
    fontSize: 13,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      borderColor: active
        ? tokens.accent
        : changed
          ? CHANGED_BORDER
          : '#D3D7E0',
    },
    '&:focus-visible': {
      outline: 'none',
      borderColor: tokens.accent,
      boxShadow: tokens.focusRing,
    },
    '&:disabled, &:disabled:hover': {
      backgroundColor: tokens.hover,
      borderColor: tokens.divider,
      cursor: 'default',
    },
    '& .comment-text': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: tokens.text,
    },
    '& .comment-placeholder': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: tokens.textDisabled,
    },
    '&:disabled .comment-text': { color: tokens.textSubtle },
  })
);

/** Статус сопоставления — цветной текст (макет: `.stp`). */
export const StatusText = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'ok' | 'new' | 'warn' | 'error' | 'muted' }>(({ tone }) => ({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13,
  fontWeight: tone === 'new' || tone === 'warn' || tone === 'error' ? 500 : 400,
  color: {
    ok: tokens.textSubtle,
    new: '#1E7A43',
    warn: '#A15C00',
    error: '#B42318',
    muted: tokens.textDisabled,
  }[tone],
}));

/** Имя колонки, которой нет в DF (макет: `.dbn`). */
export const DbOnlyName = styled('span', {
  shouldForwardProp: prop => prop !== 'strike',
})<{ strike?: boolean }>(({ strike = false }) => ({
  display: 'block',
  paddingLeft: 11,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12.5,
  color: strike ? '#B42318' : tokens.text,
  textDecoration: strike ? 'line-through' : 'none',
}));

export const MonoText = styled('span')({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12.5,
  color: tokens.textSecondary,
});

/** Цвет отмеченного действия: create — зелёный, danger — красный. */
export type ActionCheckboxTone = 'create' | 'danger';

/** Цвета из макета: `.acb.on.g` / `.acb.on.r`. */
const ACTION_CHECKBOX_COLORS: Record<
  ActionCheckboxTone,
  { fill: string; label: string }
> = {
  create: { fill: '#1E9E57', label: '#1E7A43' },
  danger: { fill: '#E5484D', label: '#B42318' },
};

/**
 * Действие с колонкой — чекбокс с постоянной подписью (макет: `.acb`).
 * Состояние показывает галочка; без фона и рамки у самой кнопки.
 */
export const ActionCheckbox = styled('button', {
  shouldForwardProp: prop => prop !== 'tone' && prop !== 'checked',
})<{ tone: ActionCheckboxTone; checked: boolean }>(({ tone, checked }) => {
  const colors = ACTION_CHECKBOX_COLORS[tone];
  return {
    maxWidth: '100%',
    height: 28,
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: checked ? colors.label : tokens.textMuted,
    fontSize: 12.5,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    '& .checkbox-box': {
      width: 16,
      height: 16,
      flex: 'none',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1.5px solid ${checked ? colors.fill : '#C3C8D2'}`,
      borderRadius: 4,
      backgroundColor: checked ? colors.fill : tokens.surface,
      color: checked ? '#FFFFFF' : 'transparent',
      transition: 'background-color .12s, border-color .12s',
    },
    '& .checkbox-label': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    ...(checked
      ? {}
      : {
          '&:hover:not(:disabled) .checkbox-box': {
            borderColor: tokens.textSubtle,
          },
        }),
    '&:focus-visible': { outline: 'none' },
    '&:focus-visible .checkbox-box': {
      boxShadow: `0 0 0 3px ${tokens.accentRing}`,
    },
    '&:disabled': { cursor: 'default', opacity: 0.5 },
  };
});

export const ChangedNote = styled('span')({
  fontSize: 12.5,
  fontWeight: 500,
  color: '#C2410C',
  whiteSpace: 'nowrap',
});

/* ─────────────────────── SQL и сообщения ─────────────────────── */

export const SqlEditor = styled('textarea')({
  flex: 1,
  minHeight: 0,
  boxSizing: 'border-box',
  width: '100%',
  margin: 0,
  padding: '14px 16px',
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  outline: 'none',
  resize: 'none',
  backgroundColor: tokens.surface,
  color: tokens.text,
  fontFamily: `${MONO_FONT_FAMILY} !important`,
  fontSize: 12.5,
  lineHeight: '20px',
  whiteSpace: 'pre',
  ...scrollbarStyles(),
  '&:focus': {
    borderColor: tokens.accent,
    boxShadow: tokens.focusRing,
  },
  '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
});

export const MessageList = styled('div')({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const MessageBox = styled('div', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'error' | 'info' }>(({ tone }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '8px 12px',
  borderRadius: 8,
  backgroundColor: tone === 'error' ? '#FEF3F2' : tokens.surfaceMuted,
  color: tone === 'error' ? '#B42318' : tokens.textSecondary,
  fontSize: 12.5,
  lineHeight: '18px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  '& .message-text': { flex: 1, minWidth: 0 },
}));

export const LinkButton = styled('button')({
  flex: 'none',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: tokens.accentStrong,
  fontSize: 12.5,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  '&:hover': { textDecoration: 'underline', textUnderlineOffset: 3 },
  '&:disabled': { color: tokens.textDisabled, cursor: 'default' },
  '&:disabled:hover': { textDecoration: 'none' },
});

/** Слой поверх таблицы: проверка колонок, пересоздание, ошибка. */
export const TableOverlay = styled('div')({
  position: 'absolute',
  inset: 0,
  zIndex: 6,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '0 24px',
  borderRadius: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.82)',
  textAlign: 'center',
  '& .overlay-title': { fontSize: 13.5, fontWeight: 600, color: tokens.text },
  '& .overlay-text': {
    maxWidth: 560,
    fontSize: 12.5,
    color: tokens.textMuted,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
});

export const TableArea = styled('div', {
  shouldForwardProp: prop => prop !== 'dimmed',
})<{ dimmed?: boolean }>(({ dimmed = false }) => ({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  ...(dimmed
    ? {
        '& > [data-table-content="true"]': {
          filter: 'blur(1.5px)',
          pointerEvents: 'none',
          userSelect: 'none',
        },
      }
    : {}),
}));
