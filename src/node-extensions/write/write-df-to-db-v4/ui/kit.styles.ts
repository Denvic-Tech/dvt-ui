import { Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  FONT_FAMILY,
  MONO_FONT_FAMILY,
  scrollbarStyles,
  spin,
  tokens,
} from '@/shared/ui/clean-minimal/tokens';

/**
 * Общие примитивы макета «Write DataFrame To DB V4» (Clean Minimal):
 * поля, серые блоки-строки, маленькие кнопки и диалог. Используются
 * всеми шагами расширения.
 */

export const v4Tokens = {
  ...tokens,
  /** Изменённое значение (макет: состояние changed). */
  changed: '#C2410C',
  changedSoft: '#FFF4EC',
  changedBorder: '#F5C9A8',
  success: '#15803D',
  successSoft: '#ECFDF3',
  danger: '#B42318',
  dangerSoft: '#FDECEC',
  warning: '#B54708',
  rowBorder: '#ECEEF2',
} as const;

export const StepRoot = styled('div')({
  height: '100%',
  minHeight: 0,
  display: 'flex',
  backgroundColor: tokens.surface,
  color: tokens.text,
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  '& button, & input, & textarea': { fontFamily: 'inherit' },
});

/** Поле ввода в рамке (макет: `.inp`). */
export const InputBox = styled('label', {
  shouldForwardProp: prop =>
    prop !== 'invalid' && prop !== 'mono' && prop !== 'width',
})<{ invalid?: boolean; mono?: boolean; width?: number | string }>(
  ({ invalid = false, mono = false, width }) => ({
    height: 32,
    width,
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
      fontFamily: mono ? MONO_FONT_FAMILY : 'inherit',
      fontSize: 13,
      fontVariantNumeric: 'tabular-nums',
      '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
    },
  })
);

/** Серый блок со строками «подпись — значение» (макет: `.wbox`). */
export const InfoBox = styled('div')({
  padding: '0 14px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

export const InfoRow = styled('div')({
  height: 48,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  columnGap: 16,
  borderTop: `1px solid ${tokens.boxDivider}`,
  '&:first-of-type': { borderTop: 'none' },
});

export const InfoLabel = styled('span')({
  fontSize: 13,
  color: tokens.text,
});

export const InfoValue = styled('span', {
  shouldForwardProp: prop => prop !== 'mono',
})<{ mono?: boolean }>(({ mono = false }) => ({
  maxWidth: 420,
  justifySelf: 'end',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: mono ? MONO_FONT_FAMILY : 'inherit',
  fontSize: mono ? 12.5 : 13,
  color: mono ? tokens.text : tokens.textMuted,
}));

export const ErrorText = styled('div')({
  padding: '0 2px',
  fontSize: 12.5,
  color: tokens.errorText,
});

export const NoteText = styled('div')({
  padding: '0 2px',
  fontSize: 12.5,
  color: tokens.textSubtle,
});

export const SmallButton = styled('button', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'primary' | 'secondary' }>(({ tone }) => ({
  height: 32,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 14px',
  border: tone === 'primary' ? 'none' : `1px solid ${tokens.border}`,
  borderRadius: 8,
  backgroundColor: tone === 'primary' ? tokens.accent : tokens.surface,
  color: tone === 'primary' ? '#FFFFFF' : tokens.text,
  fontSize: 13,
  fontWeight: tone === 'primary' ? 600 : 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: tone === 'primary' ? tokens.accentStrong : '#F5F6FA',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accentRing}`,
  },
  '&:disabled, &:disabled:hover': {
    backgroundColor: tone === 'primary' ? '#E9ECF2' : tokens.surface,
    color: tone === 'primary' ? '#A3A9B6' : tokens.textDisabled,
    cursor: 'default',
  },
}));

/** Спиннер на акцентной кнопке. */
export const ButtonSpinner = styled('span')({
  width: 12,
  height: 12,
  flex: 'none',
  boxSizing: 'border-box',
  marginRight: 2,
  borderRadius: '50%',
  border: '1.6px solid rgba(255, 255, 255, 0.45)',
  borderTopColor: '#FFFFFF',
  animation: `${spin} .7s linear infinite`,
  'button:disabled &': {
    borderColor: '#D3D7E0',
    borderTopColor: '#8C93A3',
  },
});

/** Маленький диалог внутри модалки (макет: `.dlg`). */
export const SmallDialog = styled(Dialog)({
  '& .MuiBackdrop-root': { backgroundColor: 'rgba(20, 24, 40, 0.18)' },
  '& .MuiDialog-paper': {
    width: 400,
    maxWidth: 'calc(100vw - 32px)',
    margin: 0,
    borderRadius: 10,
    backgroundColor: tokens.surface,
    boxShadow:
      '0 20px 48px -16px rgba(20, 24, 40, 0.35), 0 2px 6px rgba(20, 24, 40, 0.08)',
    color: tokens.text,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    '& button, & input': { fontFamily: 'inherit' },
  },
});

export const SmallDialogHeader = styled('div')({
  height: 44,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 8px 0 16px',
});

export const SmallDialogTitle = styled('h2')({
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
});

export const SmallDialogSubtitle = styled('span')({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12.5,
  color: tokens.textSubtle,
});

export const SmallDialogBody = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '4px 16px 16px',
});

export const SmallDialogFooter = styled('div')({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '12px 16px',
  borderTop: `1px solid ${tokens.divider}`,
});

export const IconCloseButton = styled('button')({
  width: 28,
  height: 28,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  color: tokens.textMuted,
  cursor: 'pointer',
  '&:hover': { backgroundColor: tokens.hoverStrong, color: tokens.text },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accent}`,
  },
});

export const ScrollArea = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  ...scrollbarStyles(),
});
