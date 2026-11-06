import { ButtonBase, keyframes, styled } from '@mui/material';

import { ErrorNotice } from '@/shared/ui/error-notice';
import { TokenListBox } from '@/shared/ui/token-list';

const FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const ACCENT = '#5B5BEF';
const ACCENT_HOVER = '#4343D6';
const INNER_DIVIDER = '1px solid #F3F4F7';
const FOCUS_RING = '0 0 0 3px #EEF0FF';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
`;

// Header

export const SyncButton = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'syncState',
})<{ syncState: 'idle' | 'busy' | 'done' }>(({ syncState }) => ({
  height: 30,
  gap: 6,
  padding: '0 10px',
  borderRadius: 8,
  fontFamily: FONT_FAMILY,
  fontSize: 12.5,
  fontWeight: 500,
  color: '#4A5161',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background-color .12s, color .12s',
  '& svg': { color: '#8C93A3', flexShrink: 0 },
  '&:hover': { backgroundColor: '#F1F3F8', color: '#1B1F2A' },
  '&:hover svg': { color: '#4A5161' },
  '&.Mui-focusVisible': { boxShadow: FOCUS_RING },
  ...(syncState === 'busy'
    ? {
        '&.Mui-disabled': { color: '#6B7385' },
        '& svg, &:hover svg': {
          color: ACCENT,
          animation: `${spin} .8s linear infinite`,
        },
      }
    : null),
  ...(syncState === 'done'
    ? {
        '&, &:hover': { backgroundColor: 'transparent', color: '#1E7A5A' },
        '& svg, &:hover svg': { color: '#2BB673' },
      }
    : null),
}));

// Layout

export const ExtensionsLayout = styled('div')({
  display: 'grid',
  gridTemplateColumns: '300px minmax(0, 1fr)',
  gridTemplateRows: 'minmax(0, 1fr)',
  gap: 16,
  flex: '1 1 auto',
  minHeight: 0,
  fontFamily: FONT_FAMILY,
  color: '#1B1F2A',
});

const ColumnBox = styled(TokenListBox)({
  position: 'relative',
  alignSelf: 'start',
  maxHeight: '100%',
  boxSizing: 'border-box',
});

export const ListBox = ColumnBox;

export const CardBox = ColumnBox;

export const ProgressLine = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
  height: 2,
  overflow: 'hidden',
  borderRadius: '12px 12px 0 0',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    borderRadius: 2,
    backgroundColor: ACCENT,
    animation: `${slide} 1.1s cubic-bezier(.4, 0, .2, 1) infinite`,
  },
});

export const Spinner = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'onAccent' | 'accent' }>(({ tone }) => ({
  width: 12,
  height: 12,
  flexShrink: 0,
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: '1.6px solid',
  borderColor: tone === 'onAccent' ? 'rgba(255, 255, 255, .45)' : '#DCDDFB',
  borderTopColor: tone === 'onAccent' ? '#fff' : ACCENT,
  animation: `${spin} .7s linear infinite`,
}));

// List

export const Segment = styled('div')({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  flexShrink: 0,
  margin: 8,
  padding: 3,
  borderRadius: 10,
  backgroundColor: '#F5F6FA',
});

export const SegmentThumb = styled('span', {
  shouldForwardProp: prop =>
    prop !== 'second' && prop !== 'invisible' && prop !== 'animated',
})<{ second: boolean; invisible: boolean; animated: boolean }>(
  ({ second, invisible, animated }) => ({
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    width: 'calc(50% - 3px)',
    borderRadius: 7,
    backgroundColor: '#fff',
    boxShadow: 'inset 0 0 0 1px rgba(20, 24, 40, .06)',
    visibility: invisible ? 'hidden' : 'visible',
    transform: second ? 'translateX(100%)' : 'none',
    transition: animated
      ? 'transform 220ms cubic-bezier(.3, .7, .2, 1)'
      : 'none',
  })
);

export const SegmentButton = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  position: 'relative',
  zIndex: 1,
  height: 30,
  gap: 6,
  borderRadius: 7,
  fontFamily: FONT_FAMILY,
  fontSize: 12.5,
  fontWeight: 600,
  color: active ? '#1B1F2A' : '#6B7385',
  transition: 'color .2s',
  '&:hover': { color: '#1B1F2A' },
  '&.Mui-focusVisible': { boxShadow: FOCUS_RING },
  '&.Mui-disabled': { color: '#B5BAC4' },
  '&.Mui-disabled span': { color: 'inherit' },
}));

export const SegmentCount = styled('span')({
  fontWeight: 500,
  color: '#9AA0AD',
  fontVariantNumeric: 'tabular-nums',
});

// The catalog could not be refreshed: the list shows saved data.
export const ListNotice = styled('div')({
  flexShrink: 0,
  margin: '0 8px 8px',
  padding: '8px 10px',
  borderRadius: 8,
  backgroundColor: '#FEF7E6',
  fontSize: 12.5,
  lineHeight: '16px',
  color: '#B45309',
});

export const ListScroll = styled('div', {
  shouldForwardProp: prop => prop !== 'dimmed',
})<{ dimmed: boolean }>(({ dimmed }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minHeight: 0,
  overflowY: 'auto',
  padding: '0 8px 8px',
  scrollbarWidth: 'thin',
  scrollbarColor: '#D3D8E2 transparent',
  opacity: dimmed ? 0.45 : 1,
  pointerEvents: dimmed ? 'none' : 'auto',
  transition: 'opacity .2s',
}));

export const ListItem = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected: boolean }>(({ selected }) => ({
  justifyContent: 'flex-start',
  flexShrink: 0,
  gap: 10,
  width: '100%',
  height: 36,
  padding: '0 10px',
  borderRadius: 8,
  fontFamily: FONT_FAMILY,
  fontWeight: selected ? 600 : 500,
  color: selected ? ACCENT_HOVER : '#1B1F2A',
  backgroundColor: selected ? '#EEF0FF' : 'transparent',
  textAlign: 'left',
  '&:hover': { backgroundColor: selected ? '#EEF0FF' : '#F6F7FB' },
  '&.Mui-focusVisible': { boxShadow: FOCUS_RING },
}));

export const ListItemName = styled('span')({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13,
  lineHeight: '20px',
  fontWeight: 'inherit',
});

export const ListItemVersion = styled('span')({
  fontSize: 12.5,
  // The row is bolder when selected; the version keeps its weight.
  fontWeight: 500,
  color: '#9AA0AD',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const UpdateMark = styled('span')({
  display: 'flex',
  flexShrink: 0,
  color: ACCENT,
});

export const ListSkeletonItem = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 36,
  flexShrink: 0,
  padding: '0 10px',
});

// Card

export const CardTop = styled('div')({
  flexShrink: 0,
  padding: '16px 16px 0',
});

export const CardHead = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
});

export const CardTile = styled('span', {
  shouldForwardProp: prop => prop !== 'installed',
})<{ installed: boolean }>(({ installed }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 10,
  backgroundColor: installed ? '#EEF0FF' : '#F5F6FA',
  color: installed ? ACCENT : '#6B7385',
}));

export const CardTitleBlock = styled('div')({
  minWidth: 0,
});

export const CardName = styled('div')({
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '20px',
});

export const CardDescription = styled('div')({
  fontSize: 13,
  lineHeight: '16px',
  color: '#6B7385',
});

export const CardHint = styled('div')({
  marginTop: 6,
  fontSize: 12.5,
  lineHeight: '16px',
  color: '#B45309',
});

export const CardActions = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
  marginLeft: 'auto',
});

export const CardActionButton = styled(ButtonBase)({
  height: 32,
  gap: 8,
  padding: '0 14px',
  borderRadius: 9,
  backgroundColor: ACCENT,
  color: '#fff',
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'background-color .15s',
  '&:hover': { backgroundColor: ACCENT_HOVER },
  '&.Mui-focusVisible': { boxShadow: FOCUS_RING },
  '&.Mui-disabled': { backgroundColor: '#8C8EF4', color: '#fff' },
});

export const CardErrorNotice = styled(ErrorNotice)({
  marginTop: 14,
});

export const CardMeta = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px 28px',
  marginTop: 14,
  padding: '12px 0',
  borderTop: INNER_DIVIDER,
  borderBottom: INNER_DIVIDER,
});

export const CardMetaItem = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const CardMetaLabel = styled('span')({
  fontSize: 12,
  color: '#9AA0AD',
});

export const CardMetaValue = styled('span')({
  fontSize: 13,
  color: '#1B1F2A',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const NodesHeader = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  padding: '12px 0 4px',
  fontSize: 13,
  fontWeight: 600,
});

export const NodesCount = styled('span')({
  fontWeight: 500,
  color: '#9AA0AD',
});

export const NodesList = styled('div')({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  padding: '0 16px 6px',
  scrollbarWidth: 'thin',
  scrollbarColor: '#D3D8E2 transparent',
});

export const NodesEmpty = styled('div')({
  padding: '6px 0 10px',
  fontSize: 13,
  color: '#9AA0AD',
});

export const NodeRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 0',
  borderTop: INNER_DIVIDER,
  '&:first-of-type': { borderTop: 'none' },
});

export const NodeTile = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: 9,
  backgroundColor: '#F5F6FA',
  color: '#6B7385',
});

export const NodeText = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
});

export const NodeName = styled('div')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13.5,
  lineHeight: '16px',
  fontWeight: 500,
  color: '#1B1F2A',
});

export const NodeDescription = styled('div', {
  shouldForwardProp: prop => prop !== 'empty',
})<{ empty: boolean }>(({ empty }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12.5,
  lineHeight: '16px',
  color: empty ? '#B5BAC4' : '#6B7385',
}));
