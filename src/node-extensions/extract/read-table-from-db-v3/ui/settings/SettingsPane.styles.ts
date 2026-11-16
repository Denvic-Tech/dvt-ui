import { Popover } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Spinner } from '@/shared/ui/clean-minimal/controls';
import {
  MONO_FONT_FAMILY,
  scrollbarStyles,
  tokens,
} from '@/shared/ui/clean-minimal/tokens';

export const Pane = styled('section')({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

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

export const PaneMessageIcon = styled('span')({
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  backgroundColor: tokens.surfaceMuted,
  color: tokens.textSubtle,
});

/* ---------- Вкладки ---------- */

// Высоту задаёт контент: фиксированная при border-box съедает padding-top,
// а отступ сверху должен совпадать с тулбаром дерева (8px).
export const TabsBar = styled('div')({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 16px 0',
  marginBottom: 8,
  '& > label': { width: 240, flex: 'none', marginLeft: 'auto' },
});

/** Выбранная таблица сразу после вкладок; при нехватке места — многоточие. */
export const TableName = styled('span')({
  flex: '0 1 auto',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: tokens.textMuted,
  '& > svg': { flex: 'none' },
});

export const TableNameText = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  fontSize: 12.5,
  fontWeight: 500,
  lineHeight: '18px',
  color: tokens.text,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '& .table-schema': { color: tokens.textSubtle, fontWeight: 400 },
});

export const TabPanel = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

/* ---------- Подбор настроек ---------- */

/**
 * Правый край строки вкладок: состояние подбора и (i). Форма «Параметров»
 * держит stable scrollbar-gutter 8px, поэтому блок сдвинут на ту же
 * величину и заканчивается ровно по правому краю серого бокса.
 */
export const Advice = styled('div')({
  flex: 'none',
  marginLeft: 'auto',
  marginRight: 8,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
});

export const AdviceState = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
});

export const AdviceMessage = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone?: 'muted' | 'error' }>(({ tone = 'muted' }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12.5,
  color: tone === 'error' ? tokens.errorText : tokens.textMuted,
}));

export const AdviceSpinner = styled(Spinner)({ borderWidth: 2 });

/** Текстовая ссылка: без подложки и рамки. */
export const AdviceLink = styled('button')({
  height: 22,
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: tokens.accentStrong,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: 'pointer',
  '&:hover': {
    color: tokens.accentHover,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accentRing}`,
  },
});

/** Тултип открывается по наведению и по фокусу с клавиатуры. */
export const AdviceInfo = styled('button')({
  position: 'relative',
  width: 16,
  height: 16,
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'transparent',
  // Приглушённый синий в тон ссылке «Подобрать настройки».
  color: '#868BDA',
  cursor: 'help',
  '&:hover, &:focus-visible': { color: tokens.accent },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accentRing}`,
  },
  '&:hover .advice-tooltip, &:focus-visible .advice-tooltip': {
    opacity: 1,
    visibility: 'visible',
    transform: 'none',
  },
});

export const AdviceTooltip = styled('span')({
  position: 'absolute',
  top: 24,
  right: -6,
  zIndex: 50,
  width: 280,
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderRadius: 8,
  backgroundColor: tokens.tooltip,
  boxShadow: tokens.tooltipShadow,
  color: tokens.surface,
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '17px',
  textAlign: 'left',
  whiteSpace: 'normal',
  cursor: 'default',
  opacity: 0,
  visibility: 'hidden',
  transform: 'translateY(-2px)',
  transition: 'opacity .12s, transform .12s, visibility .12s',
  pointerEvents: 'none',
});

/* ---------- Параметры ---------- */

export const Form = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '8px 16px 24px',
  ...scrollbarStyles(),
});

export const Box = styled('div')({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  padding: '0 10px 0 14px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

export const Row = styled('div')({
  minHeight: 44,
  boxSizing: 'border-box',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  columnGap: 16,
  padding: '6px 0',
  borderTop: `1px solid ${tokens.boxDivider}`,
  '&:first-of-type': { borderTopColor: 'transparent' },
  '& > :last-child': { justifySelf: 'end' },
  '&:hover .row-clear': { opacity: 1 },
});

export const RowLabel = styled('div')({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
});

export const RowName = styled('span')({
  fontSize: 13,
  fontWeight: 500,
  color: tokens.text,
});

export const RowError = styled('span')({
  fontSize: 12,
  lineHeight: '16px',
  color: tokens.error,
});

export const RowControls = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
});

export const ClearButton = styled('button')({
  width: 24,
  height: 24,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: tokens.textSubtle,
  cursor: 'pointer',
  opacity: 0,
  transition: 'opacity .12s',
  '&:hover': { backgroundColor: tokens.boxHover, color: tokens.text },
  '&:focus-visible': {
    opacity: 1,
    outline: 'none',
    boxShadow: `inset 0 0 0 1px ${tokens.accent}`,
  },
});

export const GhostSelectButton = styled('button', {
  shouldForwardProp: prop => prop !== 'open',
})<{ open: boolean }>(({ open }) => ({
  maxWidth: 300,
  height: 32,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 6px 0 10px',
  border: 'none',
  borderRadius: 8,
  backgroundColor: open ? tokens.boxHover : 'transparent',
  color: tokens.text,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { backgroundColor: tokens.boxHover },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `inset 0 0 0 1px ${tokens.accent}`,
  },
  '&:disabled, &:disabled:hover': {
    paddingRight: 10,
    backgroundColor: 'transparent',
    cursor: 'not-allowed',
  },
  '&:disabled .select-placeholder': { color: tokens.textDisabled },
  '&:disabled .select-chevron': { display: 'none' },
  '&[aria-invalid="true"] .select-placeholder': { color: tokens.error },
}));

export const SelectValue = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  fontSize: 13,
  fontWeight: 500,
  color: tokens.text,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const SelectType = styled('span')({
  flex: 'none',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 11.5,
  color: tokens.textSubtle,
  whiteSpace: 'nowrap',
});

export const SelectPlaceholder = styled('span')({
  flex: 'none',
  fontSize: 13,
  color: tokens.textMuted,
  whiteSpace: 'nowrap',
});

export const SelectChevron = styled('span')({
  flex: 'none',
  display: 'flex',
  color: tokens.textSubtle,
});

export const SelectPopover = styled(Popover)({
  '& .MuiPaper-root': {
    marginTop: 4,
    padding: 4,
    boxSizing: 'border-box',
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    backgroundColor: tokens.surface,
    boxShadow: tokens.menuShadow,
    color: tokens.text,
  },
  '& .MuiPaper-root > label': { marginBottom: 4 },
});

export const SelectList = styled('div')({
  maxHeight: 240,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  ...scrollbarStyles(),
});

/** Невидимая строка, задающая ширину меню без поиска. */
export const SelectSizer = styled('span')({
  display: 'block',
  height: 0,
  overflow: 'hidden',
  visibility: 'hidden',
  padding: '0 22px 0 6px',
  fontSize: 13,
  whiteSpace: 'nowrap',
});

export const SelectOption = styled('button')({
  flex: 'none',
  height: 30,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 8px',
  border: 'none',
  borderRadius: 7,
  background: 'transparent',
  color: tokens.text,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover, &:focus-visible': {
    outline: 'none',
    backgroundColor: tokens.hover,
  },
  '& > span:last-of-type:not(:first-of-type)': { marginLeft: 'auto' },
  '&[aria-selected="true"] > span:first-of-type': {
    color: tokens.accentStrong,
    fontWeight: 600,
  },
});

export const InputBox = styled('label', {
  shouldForwardProp: prop => prop !== 'invalid',
})<{ invalid?: boolean }>(({ invalid = false }) => ({
  width: 180,
  height: 32,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 10px',
  border: `1px solid ${invalid ? tokens.error : tokens.border}`,
  borderRadius: 8,
  backgroundColor: tokens.surface,
  cursor: 'text',
  '&:focus-within': {
    borderColor: invalid ? tokens.error : tokens.accent,
    boxShadow: tokens.focusRing,
  },
  '& input': {
    flex: 1,
    minWidth: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: tokens.text,
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
  },
}));

export const InputSuffix = styled('span')({
  flex: 'none',
  fontSize: 12,
  color: tokens.textSubtle,
  whiteSpace: 'nowrap',
});

export const SwitchWrap = styled('div')({
  display: 'flex',
  paddingRight: 6,
});

export const Switch = styled('button')({
  position: 'relative',
  width: 30,
  height: 18,
  flex: 'none',
  padding: 0,
  border: 'none',
  borderRadius: 9,
  backgroundColor: '#DCE1EA',
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
    backgroundColor: tokens.surface,
    boxShadow: '0 1px 2px rgba(20, 24, 40, 0.18)',
    transition: 'transform .18s cubic-bezier(.3, .7, .2, 1)',
  },
  '&[aria-checked="true"]': { backgroundColor: tokens.accent },
  '&[aria-checked="true"]::after': { transform: 'translateX(12px)' },
  '&:focus-visible': { outline: 'none', boxShadow: tokens.focusRing },
});

export const Advanced = styled('div')({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

export const AdvancedToggle = styled('button')({
  height: 44,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 14px',
  border: 'none',
  borderRadius: 7,
  background: 'transparent',
  color: tokens.text,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { backgroundColor: '#EEF0F5' },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `inset 0 0 0 1px ${tokens.accent}`,
  },
});

export const AdvancedChevron = styled('span', {
  shouldForwardProp: prop => prop !== 'open',
})<{ open: boolean }>(({ open }) => ({
  display: 'flex',
  color: tokens.textSubtle,
  transition: 'transform .15s',
  transform: open ? 'rotate(90deg)' : 'none',
}));

export const AdvancedLabel = styled('span')({
  fontSize: 13,
  fontWeight: 500,
  color: tokens.text,
});

export const AdvancedSummary = styled('span', {
  shouldForwardProp: prop => prop !== 'invalid',
})<{ invalid?: boolean }>(({ invalid = false }) => ({
  marginLeft: 'auto',
  paddingRight: 2,
  fontSize: 12.5,
  color: invalid ? tokens.error : tokens.accentStrong,
}));

export const AdvancedBody = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  padding: '0 10px 0 14px',
  borderTop: `1px solid ${tokens.boxDivider}`,
});

/* ---------- Колонки ---------- */

export const ColumnsBox = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  margin: '8px 16px 16px',
  overflow: 'hidden',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

export const ColumnsHead = styled('div')({
  flex: 'none',
  height: 36,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 14px',
  '& > span:first-of-type': {
    marginRight: 'auto',
    fontSize: 13,
    fontWeight: 500,
    color: tokens.textMuted,
  },
  '& > button': { marginLeft: 12 },
});

export const ColumnsList = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  ...scrollbarStyles(tokens.surfaceMuted),
  '&::-webkit-scrollbar-track': { margin: '4px 0' },
});

export const ColumnRow = styled('button')({
  flex: 'none',
  width: '100%',
  height: 36,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 6px 0 14px',
  border: 'none',
  borderTop: '1px solid #ECEEF2',
  background: 'transparent',
  color: tokens.text,
  textAlign: 'left',
  cursor: 'pointer',
  '&:first-of-type': { borderTop: 'none' },
  '&:hover': { backgroundColor: tokens.divider },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `inset 0 0 0 1px ${tokens.accent}`,
  },
  '& .column-check': {
    width: 18,
    height: 18,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: tokens.surface,
    boxShadow: 'inset 0 0 0 1px #D3D7E0',
    color: tokens.surface,
  },
  '&:hover .column-check': {
    boxShadow: `inset 0 0 0 1px ${tokens.textDisabled}`,
  },
  '&[aria-checked="true"] .column-check': {
    backgroundColor: tokens.accent,
    boxShadow: 'none',
  },
  '& .column-label': {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  // Имя в приоритете: комментарий занимает только оставшееся место.
  '& .column-name': {
    flex: '0 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    fontSize: 13,
    fontWeight: 500,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .column-comment': {
    flex: '1 1 0',
    minWidth: 0,
    overflow: 'hidden',
    fontSize: 12,
    color: tokens.textSubtle,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '&[aria-checked="false"] .column-name': {
    color: tokens.textSubtle,
    fontWeight: 400,
  },
  '&[aria-checked="false"] .column-comment': { color: tokens.textDisabled },
  '& .column-type': {
    flex: 'none',
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 12,
    color: tokens.textSubtle,
  },
});

export const ColumnsEmpty = styled('div')({
  padding: '12px 14px',
  fontSize: 12.5,
  color: tokens.textSubtle,
});
