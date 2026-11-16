import { styled } from '@mui/material';

import { IconButtonBase, Spinner } from '@/shared/ui/clean-minimal/controls';
import {
  FONT_FAMILY,
  MONO_FONT_FAMILY,
  spin,
  tokens,
} from '@/shared/ui/clean-minimal/tokens';

const ERROR_ICON_COLOR = '#D92D20';
const SUCCESS_ICON_COLOR = '#1E9E57';
const SUCCESS_SPINNER_TRACK = '#D6EFDF';
const LOADING_SPINNER_TRACK = '#E3E5FB';
const ERROR_SCROLL_THUMB = '#D3D7E0';
const COPY_BUTTON_HOVER = '#E9EBF1';

/**
 * Экран результата занимает всё тело модалки (макет: `.lc`). Блоки по центру;
 * бокс ошибки — единственный сжимаемый элемент, поэтому длинный текст
 * прокручивается внутри бокса, а иконка, заголовок и ссылка остаются видны.
 */
export const ResultRoot = styled('div')({
  height: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 16px 48px',
  textAlign: 'center',
  fontFamily: FONT_FAMILY,
});

export const ResultIcon = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'error' | 'success' | 'loading' }>(({ tone }) => ({
  display: 'flex',
  color:
    tone === 'error'
      ? ERROR_ICON_COLOR
      : tone === 'success'
        ? SUCCESS_ICON_COLOR
        : tokens.accent,
}));

/** Кольцо 24px на месте иконки (макет: `.lspn`) — как у успеха/ошибки. */
export const LoadingRing = styled('span')({
  width: 24,
  height: 24,
  flex: 'none',
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: `2.5px solid ${LOADING_SPINNER_TRACK}`,
  borderTopColor: tokens.accent,
  animation: `${spin} .8s linear infinite`,
});

export const ResultTitle = styled('h2')({
  margin: '12px 0 0',
  fontSize: 15,
  lineHeight: '22px',
  fontWeight: 600,
  color: tokens.text,
});

export const ResultSubtitle = styled('p')({
  margin: '4px 0 0',
  fontSize: 13,
  lineHeight: '20px',
  color: tokens.textMuted,
});

export const ResultLink = styled('button')({
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  lineHeight: '20px',
  fontWeight: 500,
  color: tokens.accentStrong,
  cursor: 'pointer',
  textUnderlineOffset: 3,
  '&:hover, &:focus-visible': {
    outline: 'none',
    textDecoration: 'underline',
  },
});

export const ResultProgress = styled('p')({
  margin: '6px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  lineHeight: '20px',
  color: tokens.textSubtle,
});

export const SuccessSpinner = styled(Spinner)({
  borderColor: SUCCESS_SPINNER_TRACK,
  borderTopColor: SUCCESS_ICON_COLOR,
});

// Остальные блоки экрана не сжимаются ниже содержимого (min-height: auto),
// сжимается только бокс ошибки.
export const ErrorBoxWrap = styled('div')({
  flex: '0 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  width: 640,
  maxWidth: '100%',
  marginTop: 16,
});

/**
 * Ответ сервера как есть: моноширинный, переносы строк сохраняются. Справа
 * отступ под кнопку копирования, скроллбар — у самого края бокса.
 */
export const ErrorText = styled('pre')({
  flex: '0 1 auto',
  minHeight: 0,
  width: '100%',
  boxSizing: 'border-box',
  margin: 0,
  padding: '12px 52px 12px 14px',
  overflowY: 'auto',
  backgroundColor: tokens.surfaceMuted,
  borderRadius: 8,
  textAlign: 'left',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12.5,
  lineHeight: '20px',
  fontWeight: 400,
  color: tokens.textSecondary,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  '&::-webkit-scrollbar': { width: 10 },
  '&::-webkit-scrollbar-button': { display: 'none', height: 0 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    background: ERROR_SCROLL_THUMB,
    borderRadius: 5,
    border: `3px solid ${tokens.surfaceMuted}`,
  },
  '@supports not selector(::-webkit-scrollbar)': {
    scrollbarWidth: 'thin',
    scrollbarColor: `${ERROR_SCROLL_THUMB} transparent`,
  },
});

/** Левее скроллбара бокса, не перекрывает его. */
export const ErrorCopyButton = styled(IconButtonBase)({
  position: 'absolute',
  top: 6,
  right: 16,
  '&:hover': {
    backgroundColor: COPY_BUTTON_HOVER,
    color: tokens.text,
  },
});
