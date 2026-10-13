import { keyframes, styled } from '@mui/material/styles';

const shouldForwardStateProp = (prop: PropertyKey) =>
  !['isActive', 'isFocused'].includes(String(prop));

export const SOURCE_SEARCH_COLORS = {
  ink: '#1c1f2a',
  sub: '#6b7180',
  mute: '#9aa0ad',
  line: '#eef0f5',
  border: '#e7e9f0',
  accent: '#6b51ff',
  accentText: '#5b4bff',
  accentBg: '#eef0ff',
  catalog: '#0e8f86',
  catalogBg: '#e6f5f3',
  catalogLine: '#bfe5df',
  selectedBg: '#eaf1fe',
  selectedLine: '#c9dbfb',
  hoverBg: '#fafbfd',
} as const;

const C = SOURCE_SEARCH_COLORS;

const skeletonShimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const DialogLayout = styled('div')(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  color: C.ink,
  minHeight: 0,
}));

export const DialogHeader = styled('div')(() => ({
  padding: '14px 14px 14px 20px',
  borderBottom: `1px solid ${C.line}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}));

export const DialogTitleRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const DialogTitleText = styled('span')(() => ({
  flex: 1,
  fontSize: 16,
  fontWeight: 600,
}));

export const IconButtonPlain = styled('button')(() => ({
  width: 32,
  height: 32,
  border: 0,
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: C.sub,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#f3f4f6',
  },
}));

export const SearchField = styled('div', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isFocused: boolean }>(({ isFocused }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 44,
  padding: '0 8px 0 14px',
  marginRight: 6,
  borderRadius: 10,
  border: `1px solid ${isFocused ? C.accent : C.border}`,
  boxShadow: isFocused ? '0 0 0 3px rgba(107,81,255,.12)' : 'none',
  backgroundColor: '#ffffff',
  color: C.mute,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}));

export const SearchFieldInput = styled('input')(() => ({
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: 0,
  fontSize: 15,
  fontFamily: 'inherit',
  color: C.ink,
  backgroundColor: 'transparent',
  '&::placeholder': {
    color: C.mute,
  },
}));

export const SearchStatus = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 12,
  color: C.mute,
  whiteSpace: 'nowrap',
}));

export const Spinner = styled('span')(() => ({
  width: 14,
  height: 14,
  borderRadius: 999,
  border: `2px solid ${C.border}`,
  borderTopColor: C.catalog,
  display: 'inline-block',
  animation: `${spin} 0.7s linear infinite`,
}));

export const SearchClearButton = styled('button')(() => ({
  border: 0,
  backgroundColor: 'transparent',
  color: C.mute,
  cursor: 'pointer',
  display: 'flex',
  padding: 6,
  borderRadius: 6,
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: C.sub,
  },
}));

export const ColumnsGrid = styled('div')(() => ({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  minHeight: 0,
}));

export const Column = styled('div')(() => ({
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  overflow: 'auto',
  minHeight: 0,
}));

export const LeftColumn = styled(Column)(() => ({
  borderRight: `1px solid ${C.line}`,
}));

export const RightColumn = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}));

export const ColumnLabel = styled('div')(() => ({
  flexShrink: 0,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 4px',
  marginBottom: 2,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.7,
  textTransform: 'uppercase',
  color: C.mute,
}));

export const CountPill = styled('span')(() => ({
  backgroundColor: '#eef0f5',
  color: C.sub,
  padding: '2px 7px',
  borderRadius: 999,
  letterSpacing: 0,
}));

export const SkeletonBlock = styled('div')(() => ({
  background: 'linear-gradient(90deg,#eef0f5 25%,#f6f7fa 50%,#eef0f5 75%)',
  backgroundSize: '200% 100%',
  animation: `${skeletonShimmer} 1.2s ease-in-out infinite`,
}));

const rowBase = {
  flexShrink: 0,
  minHeight: 56,
  padding: '0 12px',
  borderRadius: 10,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  textAlign: 'left',
  fontFamily: 'inherit',
  color: C.ink,
} as const;

export const SkeletonRow = styled('div')(() => ({
  ...rowBase,
  border: `1px solid ${C.line}`,
  backgroundColor: '#ffffff',
}));

export const DatasetRowButton = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive: boolean }>(({ isActive }) => ({
  ...rowBase,
  cursor: 'pointer',
  border: `1px solid ${isActive ? C.selectedLine : C.line}`,
  backgroundColor: isActive ? C.selectedBg : '#ffffff',
  transition: 'background-color 100ms ease, border-color 100ms ease',
  '&:hover': {
    backgroundColor: isActive ? C.selectedBg : C.hoverBg,
  },
  '&:focus-visible': {
    outline: `2px solid ${C.accent}`,
    outlineOffset: 1,
  },
}));

export const DatasetIconBox = styled('span', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive: boolean }>(({ isActive }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: isActive ? '#ffffff' : C.accentBg,
  color: C.accentText,
}));

export const RowContent = styled('span')(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}));

// Путь `database.schema.` + имя таблицы всегда в одну строку: при нехватке
// места сначала сжимается namespace, затем имя таблицы (оба с многоточием).
export const DatasetName = styled('span')(() => ({
  display: 'flex',
  alignItems: 'baseline',
  minWidth: 0,
  fontSize: 14,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
  '& .dataset-namespace, & .dataset-table': {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .dataset-namespace': {
    flex: '0 1000 auto',
    color: C.mute,
  },
  '& .dataset-table': {
    flex: '0 1 auto',
    fontWeight: 600,
  },
  '& mark': {
    backgroundColor: '#fff0b3',
    color: 'inherit',
    borderRadius: 3,
    padding: '0 1px',
  },
}));

export const RowMeta = styled('span')(() => ({
  fontSize: 12,
  color: C.mute,
  marginTop: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const ProjectRowButton = styled('button')(() => ({
  ...rowBase,
  cursor: 'pointer',
  border: `1px solid ${C.line}`,
  backgroundColor: '#ffffff',
  transition: 'background-color 100ms ease',
  '& .chevron': {
    color: '#c0c4cf',
    display: 'flex',
    transition: 'color 100ms ease',
  },
  '&:hover': {
    backgroundColor: C.hoverBg,
  },
  '&:hover .chevron': {
    color: C.accentText,
  },
  '&:focus-visible': {
    outline: `2px solid ${C.accent}`,
    outlineOffset: 1,
  },
}));

export const ProjectIconBox = styled('span')(() => ({
  width: 32,
  height: 32,
  borderRadius: 7,
  backgroundColor: C.accentBg,
  color: C.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const ProjectMeta = styled('span')(() => ({
  fontSize: 12,
  color: C.mute,
  marginTop: 2,
  whiteSpace: 'nowrap',
}));

export const ProjectTitle = styled('span')(() => ({
  fontSize: 14,
  fontWeight: 500,
  color: C.accentText,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const ListMessage = styled('div')(() => ({
  padding: 30,
  textAlign: 'center',
  color: C.mute,
  fontSize: 13,
  lineHeight: 1.45,
}));

export const LoadMoreButton = styled('button')(() => ({
  flexShrink: 0,
  height: 36,
  border: `1px dashed ${C.border}`,
  borderRadius: 10,
  backgroundColor: 'transparent',
  color: C.sub,
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  '&:hover:not(:disabled)': {
    backgroundColor: C.hoverBg,
    color: C.ink,
  },
  '&:disabled': {
    cursor: 'default',
  },
}));

export const EmptyState = styled('div')(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: 40,
  gap: 10,
}));

export const EmptyStateIconBox = styled('div')(() => ({
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: '#f1f2f6',
  color: C.mute,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const EmptyStateTitle = styled('div')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: C.ink,
}));

export const EmptyStateText = styled('div')(() => ({
  fontSize: 13,
  color: C.mute,
  maxWidth: 300,
  lineHeight: 1.45,
  textWrap: 'pretty',
}));
