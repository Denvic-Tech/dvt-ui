import { alpha, keyframes, styled, type Theme } from '@mui/material/styles';

export const VIEWER_FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/** Токены макета «Колонки ноды — lineage», выраженные через палитру темы. */
export const viewerTokens = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';
  return {
    bg: theme.palette.background.paper,
    surface: alpha(theme.palette.text.primary, 0.04),
    surfaceHover: alpha(theme.palette.text.primary, 0.06),
    border: theme.palette.divider,
    borderStrong: alpha(theme.palette.text.primary, 0.16),
    text: theme.palette.text.primary,
    text2: theme.palette.text.secondary,
    text3: alpha(theme.palette.text.secondary, 0.78),
    text4: alpha(theme.palette.text.secondary, 0.45),
    accent: theme.palette.primary.main,
    accentSoft: alpha(theme.palette.primary.main, 0.08),
    warning: theme.palette.warning.main,
    highlight: alpha(theme.palette.warning.main, 0.22),
    /** Имена колонок в списке: изменённые — контрастнее, остальные — тише. */
    changedName: isLight ? '#1c1c22' : theme.palette.text.primary,
    sameName: isLight ? '#55555f' : theme.palette.text.secondary,
  };
};

/**
 * Фон и цвет иконки ноды по цвету её категории. Шаги без изменений
 * нейтральные: серый фон и серая иконка чуть темнее фона.
 */
export const categoryTileColors = (
  color: string,
  dim: boolean,
  muted: { background: string; icon: string }
) =>
  dim
    ? { backgroundColor: muted.background, color: muted.icon }
    : { backgroundColor: alpha(color, 0.11), color };

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/**
 * Тонкий скроллбар в стиле окна: без стрелок, прозрачная дорожка,
 * скруглённый ползунок. Стандартные `scrollbar-*` только для браузеров без
 * `::-webkit-scrollbar` (Firefox): в Chromium они отключают webkit-стили.
 */
const thinScrollbar = (theme: Theme) => {
  const t = viewerTokens(theme);
  return {
    // Место под скроллбар резервируется заранее, чтобы контент не сдвигался.
    scrollbarGutter: 'stable',
    '&::-webkit-scrollbar': { height: 8, width: 8 },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-button': { display: 'none', height: 0, width: 0 },
    '&::-webkit-scrollbar-corner': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'padding-box',
      backgroundColor: t.borderStrong,
      border: '2px solid transparent',
      borderRadius: 8,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: alpha(theme.palette.text.primary, 0.28),
    },
    '@supports not selector(::-webkit-scrollbar)': {
      scrollbarColor: `${t.borderStrong} transparent`,
      scrollbarWidth: 'thin',
    },
  } as const;
};

const withActive = (prop: PropertyKey) =>
  !['active', 'changed', 'dim', 'branch', 'tint'].includes(String(prop));

/** Иконка, которая крутится, пока идёт фоновый перезапрос. */
export const SpinIcon = styled('span', { shouldForwardProp: withActive })<{
  active: boolean;
}>(({ active }) => ({
  animation: active ? `${spin} .6s linear infinite` : 'none',
  display: 'flex',
}));

export const ViewerRoot = styled('div')(({ theme }) => ({
  backgroundColor: viewerTokens(theme).bg,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: VIEWER_FONT,
  height: 640,
  // Кнопки, поля и примитивы MUI берут шрифт темы — приводим всё к Inter.
  '& button, & input, & .MuiTypography-root, & .MuiButtonBase-root': {
    fontFamily: 'inherit',
  },
  maxHeight: 'calc(100vh - 64px)',
  minHeight: 0,
  // Dialog оборачивает содержимое в grid: без minWidth однострочный текст
  // с многоточием растягивает панель шире окна вместо обрезки.
  minWidth: 0,
}));

export const ViewerHeader = styled('div')(({ theme }) => ({
  alignItems: 'center',
  borderBottom: `1px solid ${viewerTokens(theme).border}`,
  display: 'flex',
  flexShrink: 0,
  gap: 12,
  padding: '16px 20px 14px 24px',
}));

export const HeaderTitle = styled('h2')(({ theme }) => ({
  color: viewerTokens(theme).text,
  fontSize: 16,
  fontWeight: 650,
  letterSpacing: '-0.015em',
  lineHeight: 1.3,
  margin: 0,
}));

export const HeaderSubtitle = styled('div')(({ theme }) => ({
  color: viewerTokens(theme).text3,
  fontSize: 12.5,
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const GhostIconButton = styled('button')(({ theme }) => {
  const t = viewerTokens(theme);
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
    transition: 'color .12s, background-color .12s',
    width: 30,
    '&:hover:not(:disabled)': {
      backgroundColor: t.surfaceHover,
      color: t.text,
    },
    '&:disabled': { cursor: 'default', opacity: 0.5 },
    '&:focus-visible': {
      outline: `2px solid ${alpha(t.accent, 0.4)}`,
      outlineOffset: 1,
    },
  };
});

export const ViewerBody = styled('div')({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

export const ListPane = styled('div')(({ theme }) => ({
  borderRight: `1px solid ${viewerTokens(theme).border}`,
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  width: 300,
}));

export const SearchField = styled('label')(({ theme }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'center',
    backgroundColor: t.surface,
    borderRadius: 9,
    color: t.text3,
    display: 'flex',
    gap: 8,
    height: 34,
    margin: '16px 12px 8px',
    padding: '0 10px',
    '&:focus-within': {
      boxShadow: `inset 0 0 0 1px ${alpha(t.accent, 0.4)}`,
    },
  };
});

export const SearchInput = styled('input')(({ theme }) => {
  const t = viewerTokens(theme);
  return {
    background: 'transparent',
    border: 0,
    color: t.text,
    flex: 1,
    font: 'inherit',
    fontSize: 13,
    minWidth: 0,
    outline: 'none',
    padding: 0,
    '&::placeholder': { color: t.text4, opacity: 1 },
  };
});

export const ListScroll = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  padding: '0 8px 8px',
  position: 'relative',
  ...thinScrollbar(theme),
}));

export const GroupBlock = styled('div')(({ theme }) => ({
  '& + &': {
    borderTop: `1px solid ${viewerTokens(theme).border}`,
    marginTop: 8,
    paddingTop: 4,
  },
}));

export const GroupHeader = styled('div')(({ theme }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'baseline',
    backgroundColor: t.bg,
    color: t.text3,
    display: 'flex',
    fontSize: 11.5,
    fontWeight: 500,
    gap: 6,
    padding: '10px 10px 6px',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    '& > span': { color: t.text4 },
  };
});

/**
 * Колонка строк группы. Зазор задаём через `gap`: у выбранной и обычной
 * строки разные классы, поэтому `& + &` между ними не срабатывает.
 */
export const RowsStack = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const ColumnRowButton = styled('button', {
  shouldForwardProp: withActive,
})<{ active: boolean }>(({ theme, active }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'center',
    backgroundColor: active ? t.accentSoft : 'transparent',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    font: 'inherit',
    gap: 8,
    height: 34,
    padding: '0 10px 0 8px',
    textAlign: 'left',
    transition: 'background-color .08s',
    width: '100%',
    '&:hover': { backgroundColor: active ? t.accentSoft : t.surface },
    '&:focus-visible': {
      outline: `2px solid ${alpha(t.accent, 0.4)}`,
      outlineOffset: -2,
    },
  };
});

export const RowDot = styled('span', { shouldForwardProp: withActive })<{
  changed: boolean;
}>(({ theme, changed }) => {
  const t = viewerTokens(theme);
  return {
    backgroundColor: changed ? t.accent : t.borderStrong,
    borderRadius: '50%',
    flexShrink: 0,
    height: 6,
    width: 6,
  };
});

export const RowName = styled('span', { shouldForwardProp: withActive })<{
  active: boolean;
  changed: boolean;
}>(({ theme, active, changed }) => {
  const t = viewerTokens(theme);
  return {
    color: active ? t.accent : changed ? t.changedName : t.sameName,
    flex: 1,
    fontSize: 13,
    fontWeight: 500,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
});

export const RowMeta = styled('span', { shouldForwardProp: withActive })<{
  dim: boolean;
}>(({ theme, dim }) => {
  const t = viewerTokens(theme);
  return {
    color: dim ? t.text4 : t.text3,
    flexShrink: 0,
    fontSize: 12,
  };
});

export const Highlight = styled('mark')(({ theme }) => ({
  backgroundColor: viewerTokens(theme).highlight,
  borderRadius: 2,
  color: 'inherit',
}));

export const ListMessage = styled('div')(({ theme }) => ({
  color: viewerTokens(theme).text3,
  fontSize: 12.5,
  padding: '18px 10px',
}));

export const DetailPane = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  padding: '0 24px 24px',
  // Появление скроллбара после загрузки пути не должно сдвигать шапку.
  ...thinScrollbar(theme),
}));

/** Плавное появление загруженного пути; шапка панели не анимируется. */
export const PathFade = styled('div')({
  animation: `${fadeIn} .18s ease-out`,
});

export const DetailSticky = styled('div')(({ theme }) => ({
  backgroundColor: viewerTokens(theme).bg,
  paddingTop: 12,
  position: 'sticky',
  top: 0,
  zIndex: 2,
}));

export const Segmented = styled('div')(({ theme }) => ({
  backgroundColor: viewerTokens(theme).surface,
  borderRadius: 9,
  display: 'flex',
  gap: 2,
  height: 34,
  padding: 3,
}));

export const SegmentButton = styled('button', {
  shouldForwardProp: withActive,
})<{ active: boolean }>(({ theme, active }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'center',
    backgroundColor: active ? t.bg : 'transparent',
    border: 0,
    borderRadius: 6,
    boxShadow: active ? '0 1px 2px rgba(22, 24, 46, 0.1)' : 'none',
    color: active ? t.text : t.text2,
    cursor: 'pointer',
    display: 'flex',
    flex: 1,
    font: 'inherit',
    fontSize: 12.5,
    fontWeight: 500,
    gap: 5,
    justifyContent: 'center',
    padding: '0 9px',
    transition: 'background-color .12s, color .12s',
    whiteSpace: 'nowrap',
    '& > i': {
      color: t.text3,
      fontSize: 11.5,
      fontStyle: 'normal',
      fontVariantNumeric: 'tabular-nums',
      // Место под счётчик резервируем заранее, чтобы подпись не сдвигалась.
      minWidth: '2ch',
      textAlign: 'left',
    },
    '&:disabled': { color: t.text4, cursor: 'default' },
    '&:focus-visible': {
      outline: `2px solid ${alpha(t.accent, 0.4)}`,
      outlineOffset: 1,
    },
  };
});

export const Tile = styled('span', { shouldForwardProp: withActive })<{
  dim?: boolean;
  /** Цвет категории ноды; без него плитка нейтральная. */
  tint?: string | null;
}>(({ theme, dim = false, tint = null }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'center',
    backgroundColor: dim ? t.bg : t.surface,
    borderRadius: 9,
    boxShadow: dim && !tint ? `inset 0 0 0 1px ${t.border}` : 'none',
    color: dim ? t.text4 : t.text2,
    ...(tint
      ? categoryTileColors(tint, dim, { background: t.surface, icon: t.text4 })
      : null),
    display: 'flex',
    flexShrink: 0,
    height: 34,
    justifyContent: 'center',
    position: 'relative',
    width: 34,
    zIndex: 1,
  };
});

/** Плитка ноды в пути: при наведении подсвечивается под тултип с типом ноды. */
export const NodeTile = styled(Tile)(({ theme, dim = false, tint = null }) => {
  const t = viewerTokens(theme);
  const ring = dim || !tint ? t.borderStrong : alpha(tint, 0.32);
  return {
    cursor: 'default',
    transition: 'box-shadow .12s, background-color .12s',
    '&:hover': {
      backgroundColor: dim || !tint ? t.surfaceHover : alpha(tint, 0.17),
      boxShadow: `inset 0 0 0 1px ${ring}`,
    },
  };
});

/** Кнопка «Показать цепочку на холсте» в шапке колонки. */
export const ChainButton = styled('button')(({ theme }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'center',
    alignSelf: 'flex-start',
    background: 'transparent',
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.text2,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    font: 'inherit',
    fontSize: 12.5,
    fontWeight: 500,
    gap: 6,
    height: 30,
    padding: '0 10px',
    transition: 'background-color .12s, border-color .12s, color .12s',
    whiteSpace: 'nowrap',
    '&:hover:not(:disabled)': {
      backgroundColor: t.accentSoft,
      borderColor: alpha(t.accent, 0.4),
      color: t.accent,
    },
    '&:disabled': { color: t.text4, cursor: 'default' },
    '&:focus-visible': {
      outline: `2px solid ${alpha(t.accent, 0.4)}`,
      outlineOffset: 1,
    },
  };
});

export const AccentTile = styled(Tile)(({ theme }) => {
  const t = viewerTokens(theme);
  return { backgroundColor: t.accentSoft, color: t.accent };
});

export const StepLine = styled('div', { shouldForwardProp: withActive })<{
  branch?: number;
}>(({ branch = 0 }) => ({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  marginLeft: branch * 22,
  '& .step-action': { opacity: 0, transition: 'opacity .12s' },
  '&:hover .step-action, & .step-action:focus-visible': { opacity: 1 },
}));

export const LineTitle = styled('div')({
  alignItems: 'baseline',
  display: 'flex',
  gap: 8,
  minHeight: 17,
  minWidth: 0,
});

export const LineName = styled('span', { shouldForwardProp: withActive })<{
  dim?: boolean;
}>(({ theme, dim = false }) => {
  const t = viewerTokens(theme);
  return {
    color: dim ? t.text3 : t.text,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '17px',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
});

export const LineNote = styled('span')(({ theme }) => ({
  color: viewerTokens(theme).text3,
  flexShrink: 0,
  fontSize: 12,
}));

export const LineColumnNote = styled(LineNote)({
  fontWeight: 500,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const LineText = styled('div')(({ theme }) => ({
  color: viewerTokens(theme).text2,
  fontSize: 12.5,
  lineHeight: '17px',
  wordBreak: 'break-word',
}));

export const MutedText = styled('span')(({ theme }) => ({
  color: viewerTokens(theme).text4,
}));

export const Code = styled('span')(({ theme }) => ({
  color: viewerTokens(theme).text,
  fontWeight: 500,
}));

export const InlineLink = styled('button')(({ theme }) => {
  const t = viewerTokens(theme);
  return {
    background: 'none',
    border: 0,
    color: t.accent,
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 12.5,
    fontWeight: 500,
    padding: 0,
    '&:hover': { textDecoration: 'underline' },
  };
});

export const DetailFootnote = styled('div')(({ theme }) => ({
  alignItems: 'center',
  color: viewerTokens(theme).text3,
  display: 'flex',
  fontSize: 12,
  gap: 6,
  marginTop: 16,
}));

export const CenteredState = styled('div')(({ theme }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'center',
    color: t.text3,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    fontSize: 13,
    gap: 6,
    justifyContent: 'center',
    padding: 24,
    textAlign: 'center',
    '& > strong': { color: t.text, fontSize: 14, fontWeight: 600 },
    '& > p': { margin: 0, maxWidth: 420 },
  };
});

/** Текст шага/описания в одну строку; полный текст — в тултипе. */
export const LineTextSingle = styled(LineText)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  wordBreak: 'normal',
});

/** Полный текст в тёмном тултипе: имена колонок не должны темнеть. */
export const TooltipFullText = styled('span')({
  display: 'block',
  maxWidth: 420,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  '& *': { color: 'inherit !important' },
  '& + &': { marginTop: 4, opacity: 0.8 },
});
