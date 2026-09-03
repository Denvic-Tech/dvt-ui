import { Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';

export type PreviewSortDirection = 'asc' | 'desc' | null;

export const PREVIEW_MIN_COLUMN_WIDTH = 120;
export const PREVIEW_MAX_COLUMN_WIDTH = 420;
export const PREVIEW_ROW_INDEX_WIDTH = 44;

export const PreviewContainer = styled('div')(() => ({
  height: '100%',
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  backgroundColor: '#ffffff',
}));

export const TableScroll = styled('div')({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
});

export const StyledTable = styled('table')({
  width: 'max-content',
  minWidth: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  fontSize: 12,
});

export const TableHeader = styled('thead')(() => ({
  backgroundColor: '#f9fafb',
  '& th': {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    padding: '8px 10px',
    overflow: 'hidden',
    borderRight: '1px solid #f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#4b5563',
    fontSize: 11,
    fontWeight: 650,
    textAlign: 'left',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
    '&:last-child': {
      borderRight: 0,
    },
  },
}));

export const RowIndexHeader = styled('th')(() => ({
  width: PREVIEW_ROW_INDEX_WIDTH,
  minWidth: PREVIEW_ROW_INDEX_WIDTH,
  maxWidth: PREVIEW_ROW_INDEX_WIDTH,
  left: 0,
  zIndex: 4,
  color: '#9ca3af',
  fontSize: 10,
  textAlign: 'right',
  cursor: 'default',
  backgroundColor: '#f3f4f6',
  boxShadow: '1px 0 0 #e5e7eb',
  '&&': {
    zIndex: 4,
    cursor: 'default',
  },
}));

export const HeaderContent = styled('span')({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  overflow: 'hidden',
});

export const HeaderLabel = styled('span')({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  overflow: 'hidden',
});

export const HeaderText = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const SortIndicator = styled('span', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  opacity: active ? 1 : 0.28,
  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const TableBody = styled('tbody')(() => ({
  '& tr:hover': {
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
  },
  '& td': {
    maxWidth: 280,
    padding: '7px 10px',
    overflow: 'hidden',
    borderRight: '1px solid #f9fafb',
    borderBottom: '1px solid #f3f4f6',
    color: '#4b5563',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: 11,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:last-child': {
      borderRight: 0,
    },
  },
}));

export const RowIndexCell = styled('td')(() => ({
  width: PREVIEW_ROW_INDEX_WIDTH,
  minWidth: PREVIEW_ROW_INDEX_WIDTH,
  maxWidth: PREVIEW_ROW_INDEX_WIDTH,
  position: 'sticky',
  left: 0,
  zIndex: 1,
  backgroundColor: '#f8fafc',
  color: '#9ca3af',
  fontSize: 10,
  textAlign: 'right',
  boxShadow: '1px 0 0 #e5e7eb',
}));

export const NullValue = styled('span')(() => ({
  color: '#d1d5db',
}));

export const ColumnResizer = styled('span')(() => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  width: 4,
  backgroundColor: 'transparent',
  cursor: 'col-resize',
  '&:hover, &.resizing': {
    backgroundColor: '#3b82f6',
  },
}));

export const TypeIcon = styled('span', {
  shouldForwardProp: prop => prop !== 'scale',
})<{ scale?: number }>(({ scale = 1 }) => ({
  width: 17,
  height: 17,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#9ca3af',
  lineHeight: 0,
  transform: `scale(${scale})`,
  '& svg': {
    width: '100%',
    height: '100%',
  },
}));

export const SortMenu = styled(Menu)(() => ({
  '& .MuiPaper-root': {
    minWidth: 180,
    padding: 4,
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
  '& .MuiList-root': {
    padding: 0,
  },
}));

export const SortMenuItem = styled(MenuItem)(() => ({
  minHeight: 32,
  padding: '6px 10px',
  borderRadius: 8,
  color: '#4b5563',
  fontSize: 12,
  fontWeight: 500,
  '&:hover': {
    backgroundColor: '#f3f4f6',
  },
}));
