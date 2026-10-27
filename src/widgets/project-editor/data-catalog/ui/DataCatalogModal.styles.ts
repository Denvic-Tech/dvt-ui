import { alpha, styled, type Theme } from '@mui/material/styles';

const CATALOG_FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const tokens = (theme: Theme) => ({
  bg: theme.palette.background.paper,
  border: theme.palette.divider,
  borderStrong: alpha(theme.palette.text.primary, 0.16),
  surface: alpha(theme.palette.text.primary, 0.04),
  surfaceHover: alpha(theme.palette.text.primary, 0.06),
  text: theme.palette.text.primary,
  text2: theme.palette.text.secondary,
  text3: alpha(theme.palette.text.secondary, 0.78),
  accent: theme.palette.primary.main,
  accentSoft: alpha(theme.palette.primary.main, 0.08),
});

export const thinScrollbar = (theme: Theme) => ({
  scrollbarGutter: 'stable',
  '&::-webkit-scrollbar': { height: 8, width: 8 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    backgroundClip: 'padding-box',
    backgroundColor: tokens(theme).borderStrong,
    border: '2px solid transparent',
    borderRadius: 8,
  },
  '@supports not selector(::-webkit-scrollbar)': {
    scrollbarColor: `${tokens(theme).borderStrong} transparent`,
    scrollbarWidth: 'thin',
  },
});

export const withActive = (prop: PropertyKey) => prop !== 'active';

export const CatalogRoot = styled('div')(({ theme }) => ({
  backgroundColor: tokens(theme).bg,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: CATALOG_FONT,
  height: 'min(800px, calc(100vh - 48px))',
  minHeight: 0,
  // Dialog оборачивает содержимое в grid: без minWidth длинный однострочный
  // текст внутри растягивает каталог шире окна.
  minWidth: 0,
  '& button, & input, & textarea, & .MuiTypography-root, & .MuiButtonBase-root':
    { fontFamily: 'inherit' },
}));

/** Шапка в две строки: заголовок с крестиком, под ним вкладки. */
export const CatalogHeader = styled('div')(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.mode === 'light' ? '#e5e6ea' : tokens(theme).border}`,
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: 12,
  padding: '18px 16px 0 24px',
}));

export const CatalogTitleRow = styled('div')({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  minHeight: 32,
});

export const CatalogTitle = styled('h2')(({ theme }) => ({
  color: tokens(theme).text,
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '-.01em',
  lineHeight: '22px',
  margin: 0,
}));

export const CatalogTabs = styled('nav')({
  display: 'flex',
  gap: 20,
  height: 38,
});

export const CatalogTab = styled('button', {
  shouldForwardProp: withActive,
})<{ active: boolean }>(({ theme, active }) => {
  const t = tokens(theme);
  const light = theme.palette.mode === 'light';
  const muted = light ? '#8d919a' : t.text3;
  return {
    alignItems: 'center',
    background: 'none',
    border: 0,
    color: active ? t.text : muted,
    cursor: 'pointer',
    display: 'flex',
    fontSize: 13,
    fontWeight: 500,
    gap: 6,
    padding: 0,
    position: 'relative',
    '& i': {
      color: active ? t.accent : light ? '#b8bbc2' : alpha(t.text, 0.32),
      fontStyle: 'normal',
      fontVariantNumeric: 'tabular-nums',
    },
    '&:hover': { color: t.text },
    '&::after': active
      ? {
          background: t.accent,
          bottom: -1,
          content: '""',
          height: 2,
          left: 0,
          position: 'absolute',
          right: 0,
        }
      : undefined,
    '&:focus-visible': {
      outline: `2px solid ${alpha(t.accent, 0.4)}`,
      outlineOffset: 2,
    },
  };
});

export const GhostIconButton = styled('button')(({ theme }) => {
  const t = tokens(theme);
  return {
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    borderRadius: 8,
    color: t.text3,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    height: 30,
    justifyContent: 'center',
    padding: 0,
    width: 30,
    '&:hover:not(:disabled)': {
      backgroundColor: t.surfaceHover,
      color: t.text,
    },
    '&:disabled': { cursor: 'default', opacity: 0.5 },
  };
});

export const CatalogBody = styled('div')({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

export const ListPane = styled('div')(({ theme }) => ({
  borderRight: `1px solid ${tokens(theme).border}`,
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  minHeight: 0,
  width: 300,
}));

export const SearchField = styled('label')(({ theme }) => {
  const t = tokens(theme);
  return {
    alignItems: 'center',
    backgroundColor: t.surface,
    borderRadius: 9,
    color: t.text3,
    display: 'flex',
    gap: 8,
    height: 34,
    margin: '12px 12px 8px',
    padding: '0 10px',
  };
});

export const SearchInput = styled('input')(({ theme }) => ({
  background: 'transparent',
  border: 0,
  color: tokens(theme).text,
  flex: 1,
  fontSize: 13,
  minWidth: 0,
  outline: 'none',
  '&::placeholder': { color: tokens(theme).text3 },
}));

export const ListScroll = styled('div')(({ theme }) => ({
  ...thinScrollbar(theme),
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 2,
  minHeight: 0,
  overflowY: 'auto',
  padding: '0 8px 12px 12px',
}));

export const ListRow = styled('button', { shouldForwardProp: withActive })<{
  active: boolean;
}>(({ theme, active }) => {
  const t = tokens(theme);
  return {
    alignItems: 'center',
    backgroundColor: active ? t.accentSoft : 'transparent',
    border: 0,
    borderRadius: 9,
    color: t.text,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    gap: 10,
    minHeight: 48,
    padding: '6px 10px',
    textAlign: 'left',
    width: '100%',
    '&:hover': { backgroundColor: active ? t.accentSoft : t.surfaceHover },
    '&:focus-visible': {
      outline: `2px solid ${alpha(t.accent, 0.4)}`,
      outlineOffset: -2,
    },
  };
});

export const RowIcon = styled('span')({
  alignItems: 'center',
  display: 'flex',
  flexShrink: 0,
  height: 28,
  justifyContent: 'center',
  width: 28,
  '& .MuiAvatar-root': { fontSize: 11, height: 28, width: 28 },
});

export const RowText = styled('span')({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
});

export const RowTitle = styled('span', { shouldForwardProp: withActive })<{
  active: boolean;
}>(({ theme, active }) => ({
  color: active ? tokens(theme).accent : tokens(theme).text,
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  lineHeight: '17px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const RowSubtitle = styled('span')(({ theme }) => ({
  color: tokens(theme).text3,
  fontSize: 11.5,
  lineHeight: '15px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const RowMeta = styled('span')(({ theme }) => ({
  color: tokens(theme).text3,
  flexShrink: 0,
  fontSize: 11.5,
}));

export const DetailPane = styled('div')({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
});

export const DetailHeader = styled('div')(({ theme }) => ({
  alignItems: 'center',
  borderBottom: `1px solid ${tokens(theme).border}`,
  display: 'flex',
  flexShrink: 0,
  gap: 12,
  padding: '14px 20px',
}));

export const DetailTitle = styled('div')(({ theme }) => ({
  color: tokens(theme).text,
  fontSize: 15,
  fontWeight: 650,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const DetailSubtitle = styled('div')(({ theme }) => ({
  color: tokens(theme).text3,
  fontSize: 12.5,
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const DetailScroll = styled('div')(({ theme }) => ({
  ...thinScrollbar(theme),
  display: 'grid',
  flex: 1,
  gap: 12,
  alignContent: 'start',
  minHeight: 0,
  overflowY: 'auto',
  padding: '16px 20px 20px',
}));

export const CenteredState = styled('div')(({ theme }) => {
  const t = tokens(theme);
  return {
    alignItems: 'center',
    color: t.text2,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    fontSize: 13,
    gap: 6,
    justifyContent: 'center',
    padding: 24,
    textAlign: 'center',
    '& strong': { color: t.text, fontSize: 14, fontWeight: 600 },
    '& p': { margin: 0, maxWidth: 360 },
  };
});

export const ListMessage = styled('div')(({ theme }) => ({
  color: tokens(theme).text3,
  fontSize: 12.5,
  padding: '16px 10px',
  textAlign: 'center',
}));
