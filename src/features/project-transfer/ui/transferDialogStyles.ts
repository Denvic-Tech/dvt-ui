import type { Theme } from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';

/**
 * Общие токены и элементы Clean Minimal для диалогов экспорта/импорта
 * (макеты «Экспорт проекта - dvtpkg» и «Импорт проекта - dvtpkg»).
 */
export const getTransferTokens = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';
  const accent = theme.palette.primary.main;
  return {
    bg: theme.palette.background.paper,
    surface: isLight ? '#f6f6f8' : alpha('#ffffff', 0.04),
    surfaceHover: isLight ? '#f1f1f4' : alpha('#ffffff', 0.08),
    border: isLight ? '#ececf0' : alpha('#ffffff', 0.08),
    borderStrong: isLight ? '#d9d9df' : alpha('#ffffff', 0.18),
    text: isLight ? '#1c1c22' : theme.palette.text.primary,
    text2: isLight ? '#55555f' : alpha(theme.palette.text.primary, 0.72),
    text3: isLight ? '#8f8f9b' : alpha(theme.palette.text.primary, 0.5),
    text4: isLight ? '#c4c4cc' : alpha(theme.palette.text.primary, 0.3),
    accent,
    accentHover: isLight ? '#5457e6' : theme.palette.primary.light,
    accentSoft: isLight ? '#f3f3fe' : alpha(accent, 0.16),
    /** Фон иконки-плашки (как у проектов в списке) */
    iconTint: isLight ? '#eef2ff' : alpha(accent, 0.18),
    amber: isLight ? '#9a5a0a' : '#f0b45a',
    danger: '#dc2626',
    dangerBorder: isLight ? '#f3c4c4' : alpha('#dc2626', 0.5),
    green: '#22a06b',
    popoverShadow: isLight
      ? '0 0 0 1px #ececf0, 0 12px 32px rgba(22,24,46,.14)'
      : `0 0 0 1px ${alpha('#ffffff', 0.08)}, 0 12px 32px rgba(0,0,0,.4)`,
  };
};

export type TransferTokens = ReturnType<typeof getTransferTokens>;

export const INTER_FONT = "'Inter', -apple-system, sans-serif";
export const MONO_FONT = "'JetBrains Mono', ui-monospace, monospace";

/** `slotProps` для MUI Dialog: подложка с blur и карточка нужной ширины. */
export const getTransferDialogSlotProps = ({
  width,
  height,
  backdrop = 'rgba(22,24,46,.3)',
  blur = true,
  interFont = false,
}: {
  width: number;
  height?: number;
  backdrop?: string;
  blur?: boolean;
  /** Весь текст диалога шрифтом Inter (кнопки наследуют шрифт) */
  interFont?: boolean;
}): NonNullable<DialogProps['slotProps']> => ({
  backdrop: {
    sx: {
      background: backdrop,
      ...(blur ? { backdropFilter: 'blur(2px)' } : {}),
    },
  },
  paper: {
    sx: theme => ({
      width,
      ...(height ? { height } : {}),
      maxWidth: 'calc(100% - 48px)',
      maxHeight: '92vh',
      m: '24px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: 0,
      borderRadius: '16px',
      background: getTransferTokens(theme).bg,
      backgroundImage: 'none',
      boxShadow: '0 24px 64px rgba(22,24,46,.22)',
      ...(interFont ? { fontFamily: INTER_FONT } : {}),
    }),
  },
});

export const iconButtonSx =
  (size: number, radius: number) => (theme: Theme) => {
    const t = getTransferTokens(theme);
    return {
      width: size,
      height: size,
      flexShrink: 0,
      p: 0,
      border: 0,
      borderRadius: `${radius}px`,
      background: 'transparent',
      color: t.text3,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color .12s, background .12s',
      '&:hover:not(:disabled)': { color: t.text, background: t.surfaceHover },
      '&:disabled': { cursor: 'default', opacity: 0.5 },
    };
  };

export const closeButtonSx = (theme: Theme) => ({
  ...iconButtonSx(30, 8)(theme),
  mr: '-6px',
});

const footerButtonBaseSx = {
  height: 36,
  p: '0 16px',
  borderRadius: '9px',
  border: 0,
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
  transition: 'background .12s',
} as const;

export const primaryButtonSx = (theme: Theme) => {
  const t = getTransferTokens(theme);
  return {
    ...footerButtonBaseSx,
    background: t.accent,
    color: '#fff',
    '&:hover:not(:disabled)': { background: t.accentHover },
    '&:disabled': {
      background: t.surfaceHover,
      color: t.text4,
      cursor: 'not-allowed',
    },
  };
};

export const ghostButtonSx = (theme: Theme) => {
  const t = getTransferTokens(theme);
  return {
    ...footerButtonBaseSx,
    background: 'transparent',
    color: t.text2,
    '&:hover:not(:disabled)': { background: t.surfaceHover },
    '&:disabled': { cursor: 'default', opacity: 0.6 },
  };
};

/** Тонкий скроллбар из макета для прокручиваемых областей диалогов. */
export const thinScrollbarSx = (theme: Theme) => {
  const t = getTransferTokens(theme);
  return {
    scrollbarWidth: 'thin',
    scrollbarColor: `${t.borderStrong} transparent`,
    '&::-webkit-scrollbar': { width: 8 },
    '&::-webkit-scrollbar-thumb': {
      background: t.borderStrong,
      borderRadius: 8,
      border: `2px solid ${t.bg}`,
    },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-button': { display: 'none' },
  } as const;
};
