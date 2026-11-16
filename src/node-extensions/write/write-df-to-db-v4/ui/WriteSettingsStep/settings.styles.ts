import { styled } from '@mui/material/styles';

import { SelectButton } from '@/shared/ui/clean-minimal/dropdown';
import {
  FONT_FAMILY,
  MONO_FONT_FAMILY,
  scrollbarStyles,
  tokens,
} from '@/shared/ui/clean-minimal/tokens';

/** Шаг 4: форма слева, DDL справа (макет: `.q4`). */
export const SettingsRoot = styled('div')({
  height: '100%',
  minHeight: 0,
  display: 'flex',
  backgroundColor: tokens.surface,
  color: tokens.text,
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  '& button, & input': { fontFamily: 'inherit' },
});

/** Прокручиваемая форма (макет: `.q4f`). */
export const SettingsForm = styled('div')({
  width: 620,
  flex: 'none',
  minHeight: 0,
  overflowY: 'auto',
  borderRight: `1px solid ${tokens.divider}`,
  ...scrollbarStyles(),
});

export const SettingsFormInner = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 12px 24px 16px',
});

/** Группа настроек (макет: `.qs`). */
export const SettingsGroup = styled('section')({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

/** Серая плашка со строками (макет: `.qbox`). */
export const SettingsBox = styled('div')({
  padding: '0 14px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
  // first-child, а не first-of-type: у свёрнутого блока под кнопкой первым
  // div-ом может оказаться строка ошибки, и ей нужен разделитель.
  '& > :first-child': { borderTop: 'none' },
});

/** Строка «подпись — контрол» (макет: `.qr`). */
export const SettingRow = styled('div')({
  minHeight: 52,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  padding: '10px 0',
  borderTop: `1px solid ${tokens.boxDivider}`,
});

export const SettingLabel = styled('span')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  '& .setting-name': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: tokens.text,
  },
  '& .setting-error': {
    fontSize: 12,
    lineHeight: '16px',
    color: tokens.errorText,
  },
});

export const SettingControl = styled('span', {
  shouldForwardProp: prop => prop !== 'auto',
})<{ auto?: boolean }>(({ auto = false }) => ({
  width: auto ? 'auto' : 280,
  flex: 'none',
  minWidth: 0,
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
}));

/** Значок (i) с подсказкой (макет: `.qi2` / `.qtip`). */
export const InfoHintRoot = styled('span')({
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
  '&:focus-visible': { boxShadow: `0 0 0 2px ${tokens.accentRing}` },
  '& .hint-tip': {
    position: 'absolute',
    top: 22,
    left: -8,
    zIndex: 50,
    width: 'max-content',
    maxWidth: 260,
    padding: '7px 10px',
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
    transform: 'translateY(-2px)',
    transition: 'opacity .12s, transform .12s, visibility .12s',
    pointerEvents: 'none',
  },
  '&:hover .hint-tip, &:focus-visible .hint-tip': {
    opacity: 1,
    visibility: 'visible',
    transform: 'none',
  },
});

/** Поле ввода в строке настроек (макет: `.inp.qin2`). */
export const SettingInput = styled('label', {
  shouldForwardProp: prop =>
    prop !== 'invalid' && prop !== 'numeric' && prop !== 'fullWidth',
})<{ invalid?: boolean; numeric?: boolean; fullWidth?: boolean }>(
  ({ invalid = false, numeric = false, fullWidth = false }) => ({
    width: fullWidth ? '100%' : numeric ? 180 : 280,
    height: 32,
    // `flex: 1` делит ширину в строке, но в колонке (поля диалога) базис 0
    // сжимал поле по высоте до текста — держим высоту минимумом.
    minHeight: 32,
    flex: fullWidth ? 1 : 'none',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 10px',
    border: `1px solid ${invalid ? '#E5484D' : tokens.border}`,
    borderRadius: 8,
    backgroundColor: tokens.surface,
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
      fontFamily: MONO_FONT_FAMILY,
      fontSize: 12.5,
      fontVariantNumeric: 'tabular-nums',
      MozAppearance: 'textfield',
      '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
      '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
      },
    },
    '& .input-suffix': {
      flex: 'none',
      fontSize: 12,
      color: tokens.textSubtle,
    },
  })
);

/** Селект без рамки (макет: `.qsel`). */
export const GhostSelectButton = styled('button', {
  shouldForwardProp: prop => prop !== 'open' && prop !== 'invalid',
})<{ open?: boolean; invalid?: boolean }>(
  ({ open = false, invalid = false }) => ({
    maxWidth: 280,
    minWidth: 0,
    height: 32,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 6px 0 10px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: open ? '#ECEEF3' : 'transparent',
    color: tokens.text,
    cursor: 'pointer',
    '&:hover': { backgroundColor: '#ECEEF3' },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `inset 0 0 0 2px ${tokens.accentRing}`,
    },
    '&:disabled, &:disabled:hover': {
      backgroundColor: 'transparent',
      cursor: 'default',
    },
    '& .select-value': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontFamily: MONO_FONT_FAMILY,
      fontSize: 12.5,
    },
    '& .select-value[data-ui="true"]': {
      fontFamily: FONT_FAMILY,
      fontSize: 13,
    },
    '& .select-placeholder': {
      fontSize: 13,
      color: invalid ? tokens.errorText : tokens.textMuted,
      whiteSpace: 'nowrap',
    },
    '& .select-chevron': {
      display: 'flex',
      flex: 'none',
      color: tokens.textSubtle,
    },
    '&:disabled .select-chevron': { display: 'none' },
  })
);

/** Селект в рамке на всю ширину (макет: `.qsel.qfs`). */
export const FieldSelectButton = styled(SelectButton)({
  height: 32,
  '& .select-value': {
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 12.5,
    fontWeight: 400,
  },
  '& .select-placeholder': {
    fontSize: 13,
    fontWeight: 400,
    color: tokens.textMuted,
  },
});

/** Заголовок списка с кнопкой «+» (макет: `.qsub`). */
export const ListHeader = styled('div')({
  minHeight: 52,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  borderTop: `1px solid ${tokens.boxDivider}`,
  '& .list-title': {
    flex: 1,
    fontSize: 13,
    fontWeight: 500,
    color: tokens.text,
  },
});

/** Кнопка «+ Индекс» (макет: `.qadd`). */
export const AddButton = styled('button')({
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '0 8px',
  border: 'none',
  borderRadius: 6,
  backgroundColor: 'transparent',
  color: tokens.accentStrong,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: 'pointer',
  '&:hover': { backgroundColor: tokens.accentSoft },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accentRing}`,
  },
});

/** Строка индекса / внешнего ключа (макет: `.qli`). */
export const ListItem = styled('div')({
  minHeight: 56,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  borderTop: `1px solid ${tokens.boxDivider}`,
  '& .item-tag': { flex: 'none', fontSize: 12, color: tokens.textMuted },
});

export const ListItemButton = styled('button')({
  flex: 1,
  minWidth: 0,
  minHeight: 56,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 3,
  padding: '10px 0',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  '& .item-name, & .item-details': {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: MONO_FONT_FAMILY,
  },
  '& .item-name': { fontSize: 13, fontWeight: 500, color: tokens.text },
  '& .item-name[data-auto="true"]': { color: tokens.textSecondary },
  '& .item-details': {
    fontSize: 12,
    lineHeight: '17px',
    color: tokens.textMuted,
  },
  '&:hover .item-name': { color: tokens.accentStrong },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `inset 0 0 0 2px ${tokens.accentRing}`,
    borderRadius: 6,
  },
});

/** Раскрывашка «Параметры ClickHouse» (макет: `.qtgl`). */
export const CollapseButton = styled('button', {
  shouldForwardProp: prop => prop !== 'open',
})<{ open: boolean }>(({ open }) => ({
  width: 'calc(100% + 28px)',
  height: 52,
  margin: '0 -14px',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 14px',
  border: 'none',
  borderRadius: open ? '8px 8px 0 0' : 8,
  backgroundColor: 'transparent',
  color: tokens.text,
  fontSize: 13,
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { backgroundColor: '#EEF0F5' },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `inset 0 0 0 2px ${tokens.accentRing}`,
  },
  '& .collapse-chevron': {
    display: 'flex',
    color: tokens.textSubtle,
    transform: open ? 'rotate(90deg)' : 'none',
    transition: 'transform .15s',
  },
}));

/** Пара «ключ — значение» настройки ClickHouse (макет: `.qkv`). */
export const KeyValueRow = styled('div')({
  height: 52,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  borderTop: `1px solid ${tokens.boxDivider}`,
});

export const DeleteIconButton = styled('button')({
  width: 28,
  height: 28,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: tokens.textSubtle,
  cursor: 'pointer',
  '&:hover': { backgroundColor: '#ECEEF3', color: tokens.errorText },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accentRing}`,
  },
});

/** Ошибка группы последней строкой своего бокса (макет: `.qr.qem`). */
export const SettingsErrorRow = styled('div')({
  minHeight: 44,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  padding: '12px 0',
  borderTop: `1px solid ${tokens.boxDivider}`,
  fontSize: 12.5,
  lineHeight: '18px',
  color: tokens.errorText,
});

export const SettingsNote = styled('p')({
  margin: 0,
  padding: '14px 0',
  fontSize: 12.5,
  lineHeight: '18px',
  color: tokens.textMuted,
});

/** Правая колонка с DDL (макет: `.q4d`). */
export const DdlPane = styled('aside')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
});

export const DdlCodeWrap = styled('div', {
  shouldForwardProp: prop => prop !== 'stale',
})<{ stale?: boolean }>(({ stale = false }) => ({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  '& pre': { opacity: stale ? 0.5 : 1, transition: 'opacity .15s' },
}));

export const DdlActions = styled('div')({
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 2,
  display: 'flex',
  gap: 2,
  borderRadius: 8,
  backgroundColor: tokens.surface,
});

/** Пустое состояние DDL (макет: `.qdem`). */
export const DdlEmpty = styled('div')({
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 24px',
  fontSize: 13,
  color: tokens.textSubtle,
  textAlign: 'center',
});

export const DdlSkeleton = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '16px 16px',
});

/** Поля диалога индекса / внешнего ключа (макет: `.qdb` / `.qfl`). */
export const DialogField = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  '& .field-label': { fontSize: 13, color: tokens.text },
  '& .field-hint': { fontSize: 12, color: tokens.textSubtle },
  '& .field-hint[data-error="true"]': { color: tokens.errorText },
});

export const DialogFieldRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  '& .field-dot': { color: tokens.textSubtle },
});

export const DialogSwitchRow = styled('div')({
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 13,
});
