import {
  ButtonBase,
  IconButton,
  InputBase,
  MenuItem,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export const TOKEN_ROW_HEIGHT = 48;

// Fixed, so the box does not jump with the number of tokens.
const TOKEN_LIST_BOX_MIN_HEIGHT = 619;

// The box keeps its height with any number of tokens, and grows with a list
// that does not fit; the container may still shrink it, then the rows scroll.
export const getTokenListBoxHeight = (rowCount: number) =>
  Math.max(TOKEN_LIST_BOX_MIN_HEIGHT, rowCount * TOKEN_ROW_HEIGHT + 2);

const ROW_DIVIDER = '1px solid #EEF0F4';

// The bordered box around a token list.
export const TokenListBox = styled('section')({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
  backgroundColor: '#fff',
  border: ROW_DIVIDER,
  borderRadius: 12,
});

export const TokenListScroll = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#D3D8E2 transparent',
});

// Search in the page header above a list; fits its 30px row.
export const TokenListSearch = styled(InputBase)({
  width: 220,
  height: 30,
  gap: 8,
  padding: '0 10px',
  borderRadius: 8,
  backgroundColor: '#F5F6FA',
  color: '#1B1F2A',
  fontSize: 12.5,
  transition: 'background-color 150ms ease, box-shadow 150ms ease',
  '& svg': { flexShrink: 0, color: '#9AA0AD' },
  '& input': { padding: 0, height: '100%' },
  '& input::placeholder': { color: '#9AA0AD', opacity: 1 },
  '&.Mui-focused': {
    backgroundColor: '#fff',
    boxShadow: 'inset 0 0 0 1px #5B5BEF, 0 0 0 3px #EEF0FF',
  },
});

// Soft indigo action in the page header above a list; fits its 30px row.
export const TokenListCreateButton = styled(ButtonBase)({
  height: 30,
  gap: 6,
  padding: '0 12px 0 10px',
  borderRadius: 8,
  backgroundColor: '#EEF2FF',
  color: '#6366F1',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background-color 140ms ease, opacity 150ms ease',
  '&:hover': { backgroundColor: '#E0E7FF' },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 2px #A5B4FC' },
  '&.Mui-disabled': { opacity: 0.5 },
});

export const TokenListMessage = styled(Typography)({
  padding: 16,
  color: '#9AA0AD',
  fontSize: 13,
});

export const RowRoot = styled('div', {
  shouldForwardProp: prop => prop !== 'dimmed',
})<{ dimmed: boolean }>(({ dimmed }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  boxSizing: 'border-box',
  height: TOKEN_ROW_HEIGHT,
  flexShrink: 0,
  paddingLeft: 12,
  paddingRight: 8,
  borderBottom: ROW_DIVIDER,
  backgroundColor: '#fff',
  opacity: dimmed ? 0.6 : 1,
  '&:last-of-type': { borderBottom: 'none' },
}));

// A row of a list in the box laid out by columns: 48px, no hover background.
export const TokenListGridRow = styled('div', {
  shouldForwardProp: prop => prop !== 'columns',
})<{ columns: string }>(({ columns }) => ({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: columns,
  alignItems: 'center',
  columnGap: 16,
  boxSizing: 'border-box',
  height: TOKEN_ROW_HEIGHT,
  flexShrink: 0,
  padding: '0 8px 0 12px',
  borderBottom: ROW_DIVIDER,
  backgroundColor: '#fff',
  '&:last-of-type': { borderBottom: 'none' },
}));

// The first cell of a grid row: a tile and the name.
export const TokenListRowCell = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
});

// 28px rounded tile with a letter or an icon.
export const TokenListRowTile = styled('div')({
  width: 28,
  height: 28,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
});

export const TokenListCellText = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#4A5161',
  fontSize: 13,
});

export const RowAvatar = styled('div')({
  width: 24,
  height: 24,
  flex: '0 0 24px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
});

export const RowMain = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
});

export const RowName = styled(Typography, {
  shouldForwardProp: prop => prop !== 'columnWidth' && prop !== 'dimmed',
})<{ columnWidth?: number | undefined; dimmed: boolean }>(
  ({ columnWidth, dimmed }) => ({
    flex: columnWidth ? `0 0 ${columnWidth}px` : '0 1 auto',
    minWidth: 0,
    color: dimmed ? '#6B7385' : '#1B1F2A',
    fontSize: 13,
    fontWeight: 500,
  })
);

export const RowDetails = styled(Typography)({
  minWidth: 0,
  color: '#6B7385',
  fontSize: 13,
});

export const RowExpiry = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

export const RowExpiryDot = styled('span')({
  width: 6,
  height: 6,
  borderRadius: '50%',
});

export const RowExpiryLabel = styled(Typography)({
  fontSize: 13,
});

export const RowActionsButton = styled(IconButton)({
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: 8,
  color: '#6B7385',
  '&:hover': { backgroundColor: '#F1F3F8', color: '#1B1F2A' },
});

export const rowMenuPaperSx = {
  minWidth: 176,
  mt: 0.5,
  p: 0.5,
  border: '1px solid #E3E7EF',
  borderRadius: '10px',
  boxShadow: '0 10px 28px rgba(20, 24, 40, 0.12)',
} as const;

export const RowMenuItem = styled(MenuItem, {
  shouldForwardProp: prop => prop !== 'danger' && prop !== 'success',
})<{ danger?: boolean | undefined; success?: boolean | undefined }>(
  ({ danger, success }) => ({
    minHeight: 34,
    borderRadius: 7,
    fontSize: 14,
    ...(danger ? { color: '#B42318' } : {}),
    ...(success ? { color: '#1E7A5A' } : {}),
    // An item with an open submenu.
    '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  })
);

export const RowMenuSeparator = styled('div')({
  height: 1,
  margin: 4,
  backgroundColor: '#EEF0F4',
});

export const RowSubmenuArrow = styled('span')({
  display: 'flex',
  marginLeft: 'auto',
  paddingLeft: 12,
  color: '#9AA0AD',
});

export const rowSubmenuPaperSx = {
  ...rowMenuPaperSx,
  mt: 0,
  overflow: 'hidden',
} as const;

// Fixed height: a long list scrolls instead of growing the menu.
export const RowSubmenuScroll = styled('div')({
  maxHeight: 240,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#D3D8E2 transparent',
});

export const RowSubmenuItem = styled(MenuItem)({
  gap: 16,
  minHeight: 34,
  borderRadius: 7,
  fontSize: 14,
  fontVariantNumeric: 'tabular-nums',
  // The current value: shown muted, but readable.
  '&.Mui-disabled': { opacity: 1, color: '#9AA0AD' },
});

export const RowSubmenuNote = styled('span')({
  marginLeft: 'auto',
  fontSize: 12.5,
  color: '#9AA0AD',
});
