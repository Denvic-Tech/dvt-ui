import { styled } from '@mui/material/styles';

import {
  FONT_FAMILY,
  MONO_FONT_FAMILY,
  scrollbarStyles,
  tokens,
} from '@/shared/ui/clean-minimal/tokens';

/** Шаг 3 целиком: список режимов слева и описание справа (макет: `.s3l`). */
export const WriteModeRoot = styled('div')({
  height: '100%',
  minHeight: 0,
  display: 'flex',
  backgroundColor: tokens.surface,
  color: tokens.text,
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  '& button': { fontFamily: 'inherit' },
});

/** Список режимов (макет: `.zside`). */
export const ModeList = styled('div')({
  width: 240,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: 8,
  borderRight: `1px solid ${tokens.divider}`,
  overflowY: 'auto',
});

/** Пункт режима (макет: `.zm2`). */
export const ModeButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ active = false }) => ({
  width: '100%',
  height: 32,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 8px',
  border: 'none',
  borderRadius: 8,
  backgroundColor: active ? tokens.accentSoft : 'transparent',
  color: active ? tokens.accentStrong : tokens.text,
  fontSize: 13,
  fontWeight: active ? 500 : 400,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: active ? tokens.accentSoft : tokens.hover,
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `inset 0 0 0 2px ${tokens.accentRing}`,
  },
  '&:disabled': {
    backgroundColor: 'transparent',
    color: tokens.textDisabled,
    cursor: 'default',
  },
  '& .mode-icon': {
    width: 16,
    height: 16,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: active ? tokens.accentStrong : tokens.textMuted,
  },
  '&:disabled .mode-icon': { color: tokens.textDisabled },
  '& .mode-name': {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

/** Правая часть (макет: `.zmain`). */
export const ModeMain = styled('div')({
  flex: 1,
  minWidth: 0,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '14px 20px 16px',
  overflowY: 'auto',
  ...scrollbarStyles(),
});

export const ModeHead = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const ModeTitle = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  minWidth: 0,
  '& .mode-title': {
    fontSize: 15,
    fontWeight: 600,
    color: tokens.text,
    whiteSpace: 'nowrap',
  },
  '& .mode-code': {
    flex: 'none',
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 12,
    color: tokens.textDisabled,
  },
});

export const ModeDescription = styled('p')({
  margin: 0,
  fontSize: 13,
  lineHeight: '19px',
  color: tokens.textMuted,
});

export const ModeEmpty = styled('div')({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  color: tokens.textSubtle,
  textAlign: 'center',
});

/** Блок параметров режима (макет: `.zbox`). */
export const ModeBox = styled('div')({
  flex: 'none',
  padding: '0 14px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

/** Строка «Ключ сопоставления» (макет: `.zrow.zrk`). */
export const ModeKeyRow = styled('div')({
  minHeight: 48,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '8px 0',
  '& .key-label': {
    flex: 1,
    fontSize: 13,
    fontWeight: 500,
    color: tokens.text,
  },
});

export const ModeKeyHint = styled('div')({
  padding: '10px 0 12px',
  borderTop: `1px solid ${tokens.boxDivider}`,
  fontSize: 12.5,
  lineHeight: '18px',
  color: tokens.textMuted,
});

/** Селект ключа без рамки (макет: `.zsel`). */
export const KeySelectButton = styled('button', {
  shouldForwardProp: prop => prop !== 'open',
})<{ open?: boolean }>(({ open = false }) => ({
  height: 32,
  maxWidth: 420,
  minWidth: 0,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 6px 0 10px',
  border: 'none',
  borderRadius: 8,
  backgroundColor: open ? '#ECEEF3' : 'transparent',
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
  '& .key-value': {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 12.5,
    color: tokens.text,
  },
  '& .key-placeholder': {
    fontSize: 13,
    color: tokens.textMuted,
    whiteSpace: 'nowrap',
  },
  '&:disabled .key-placeholder': { color: tokens.textDisabled },
  '& .key-chevron': {
    display: 'flex',
    flex: 'none',
    color: tokens.textSubtle,
    transform: open ? 'rotate(180deg)' : 'none',
  },
}));

/** Пример: три таблицы со знаками между ними (макет: `.zg`). */
export const ExampleGrid = styled('div')({
  marginTop: 8,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 24px minmax(0, 1fr) 24px minmax(0, 1fr)',
  alignItems: 'start',
});

export const ExampleOperator = styled('span')({
  marginTop: 96,
  textAlign: 'center',
  fontSize: 14,
  color: tokens.textDisabled,
});

export const ExampleColumn = styled('div')({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
});

/** Подпись таблицы со счётчиками (макет: `.ztl`). */
export const ExampleLabel = styled('div')({
  height: 18,
  marginBottom: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 12.5,
  fontWeight: 500,
  color: tokens.text,
});

const COUNT_COLORS = {
  added: '#1E7A43',
  removed: '#B42318',
  updated: '#A15C00',
} as const;

export const ExampleCount = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: keyof typeof COUNT_COLORS }>(({ tone }) => ({
  fontSize: 12,
  fontWeight: 500,
  color: COUNT_COLORS[tone],
}));

/** Рамка таблицы примера (макет: `.ztb`). */
export const ExampleTable = styled('div')({
  overflow: 'hidden',
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  backgroundColor: tokens.surface,
});

export type ExampleRowTone = 'keep' | 'added' | 'removed' | 'updated';

const ROW_TONES: Record<ExampleRowTone, { color: string; background: string }> =
  {
    keep: { color: tokens.text, background: 'transparent' },
    added: { color: '#1E7A43', background: '#EEF8F1' },
    removed: { color: '#C2453F', background: '#FDF0EF' },
    updated: { color: tokens.text, background: '#FFF7E3' },
  };

/** Строка таблицы примера (макет: `.ztr`). */
export const ExampleRow = styled('div', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone?: ExampleRowTone }>(({ tone = 'keep' }) => ({
  height: 34,
  boxSizing: 'border-box',
  display: 'grid',
  gridTemplateColumns: '44px 44px minmax(0, 1fr)',
  columnGap: 10,
  alignItems: 'center',
  padding: '0 10px',
  borderTop: `1px solid ${tokens.divider}`,
  backgroundColor: ROW_TONES[tone].background,
  color: ROW_TONES[tone].color,
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12.5,
  whiteSpace: 'nowrap',
  ...(tone === 'removed'
    ? {
        textDecoration: 'line-through',
        textDecorationColor: 'rgba(194, 69, 63, 0.55)',
      }
    : {}),
  '&[data-first-row="true"]': { borderTopColor: 'transparent' },
  '& .example-amount': {
    overflow: 'hidden',
    textAlign: 'right',
    textOverflow: 'ellipsis',
  },
  '& .example-new-value': {
    color: tone === 'updated' ? '#A15C00' : 'inherit',
  },
  '& .example-old-value': {
    marginRight: 8,
    color: tokens.textDisabled,
    textDecoration: 'line-through',
  },
}));

/** Заголовок таблицы примера (макет: `.ztb .ztr.zhd`). */
export const ExampleHeadRow = styled(ExampleRow)({
  height: 26,
  borderTop: 'none',
  borderBottom: `1px solid ${tokens.divider}`,
  backgroundColor: '#FAFBFC',
  color: tokens.textMuted,
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  fontWeight: 500,
});
