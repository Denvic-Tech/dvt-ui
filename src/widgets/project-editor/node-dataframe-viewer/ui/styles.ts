import { styled } from '@mui/material/styles';
import { Dialog, Menu, MenuItem, Tab, Tabs } from '@mui/material';

export type SortDirection = 'asc' | 'desc' | null;

export const MIN_COLUMN_WIDTH = 120;
export const MAX_COLUMN_WIDTH = 420;
export const ROW_INDEX_WIDTH = 52;

export const ViewerContainer = styled('div')(() => ({
  backgroundColor: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}));

export const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
    width: 'min(1600px, 98vw)',
    maxWidth: '98vw',
    height: 'min(92vh, 1200px)',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
  },
}));

export const ModalHeader = styled('div')(() => ({
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export const HeaderLeft = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}));

export const NodeIcon = styled('div')(() => ({
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,

  '& svg': {
    width: 18,
    height: 18,
    color: '#ffffff',
  },
}));

export const HeaderInfo = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}));

export const NodeName = styled('span')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.2,
}));

export const NodeId = styled('span')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
}));

export const CloseButton = styled('button')(() => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#9ca3af',
  transition: 'all 120ms ease',

  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },

  '& svg': {
    width: 20,
    height: 20,
  },
}));

export const ModalContent = styled('div')(() => ({
  padding: 0,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
}));

export const TabsContainer = styled('div')(() => ({
  padding: '0 16px',
  borderBottom: '1px solid #f3f4f6',
}));

export const TableContainer = styled('div')(() => ({
  padding: 16,
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
}));

export const StyledTabs = styled(Tabs)(() => ({
  minHeight: 40,

  '& .MuiTabs-indicator': {
    backgroundColor: '#3b82f6',
    height: 2,
  },
}));

export const StyledTab = styled(Tab)(() => ({
  minHeight: 40,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'none',
  color: '#6b7280',

  '&.Mui-selected': {
    color: '#111827',
  },
}));

export const SortMenu = styled(Menu)(() => ({
  '& .MuiPaper-root': {
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    backgroundColor: '#ffffff',
    padding: 4,
    minWidth: 180,
  },
  '& .MuiList-root': {
    padding: 0,
  },
}));

export const SortMenuItem = styled(MenuItem)(() => ({
  fontSize: 12,
  color: '#4b5563',
  borderRadius: 8,
  padding: '6px 10px',
  minHeight: 32,
  fontWeight: 500,
  '&:hover': {
    backgroundColor: '#f3f4f6',
  },
}));

export const Toolbar = styled('div')(() => ({
  padding: '8px 12px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  flexShrink: 0,
}));

export const ToolbarGroup = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const StatBadge = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  backgroundColor: '#ffffff',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  fontSize: 12,
  color: '#4b5563',

  '& .value': {
    fontWeight: 600,
    color: '#111827',
  },

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const ToolbarButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 12,
  color: '#4b5563',
  cursor: 'pointer',
  transition: 'all 120ms ease',
  fontFamily: 'inherit',

  '&:hover:not(:disabled)': {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },

  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const PaginationContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 12,
  color: '#6b7280',
}));

export const PaginationButton = styled('button')(() => ({
  padding: '4px 8px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 4,
  fontSize: 12,
  color: '#9ca3af',
  cursor: 'pointer',
  transition: 'all 100ms ease',
  fontFamily: 'inherit',

  '&:hover:not(:disabled)': {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },

  '&:disabled': {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
}));

export const TableScroll = styled('div')(() => ({
  overflow: 'auto',
  flex: 1,
  minHeight: 0,
}));

export const StyledTable = styled('table')(() => ({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
  tableLayout: 'fixed',
}));

export const TableHeader = styled('thead')(() => ({
  backgroundColor: '#f9fafb',

  '& th': {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11,
    color: '#4b5563',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #f3f4f6',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: '#f9fafb',
    userSelect: 'none',
    cursor: 'pointer',
    transition: 'background-color 100ms ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',

    '&:hover': {
      backgroundColor: '#f3f4f6',
    },

    '&:last-child': {
      borderRight: 'none',
    },
  },
}));

export const RowIndexHeader = styled('th')(() => ({
  width: ROW_INDEX_WIDTH,
  minWidth: ROW_INDEX_WIDTH,
  maxWidth: ROW_INDEX_WIDTH,
  textAlign: 'right',
  color: '#9ca3af',
  fontSize: 10,
  cursor: 'default',
  position: 'sticky',
  left: 0,
  top: 0,
  zIndex: 3,
  backgroundColor: '#f3f4f6',
  boxShadow: '1px 0 0 #e5e7eb',

  '&&': {
    zIndex: 3,
    cursor: 'default',
  },
}));

export const HeaderContent = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  overflow: 'hidden',
  minWidth: 0,
}));

export const HeaderLabel = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  overflow: 'hidden',
  minWidth: 0,
}));

export const HeaderText = styled('span')(() => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

export const SortIcon = styled('span')<{ direction?: SortDirection }>(
  ({ direction }) => ({
    marginLeft: 4,
    opacity: direction ? 1 : 0.3,
    fontSize: 10,
    flexShrink: 0,

    '&::after': {
      content:
        direction === 'asc'
          ? '"\\25B2"'
          : direction === 'desc'
            ? '"\\25BC"'
            : '"\\25B2"',
    },
  })
);

export const TableBody = styled('tbody')(() => ({
  '& tr': {
    transition: 'background-color 80ms ease',

    '&:hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.04)',
    },
  },

  '& td': {
    padding: '6px 12px',
    color: '#4b5563',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: 11,
    borderBottom: '1px solid #f3f4f6',
    borderRight: '1px solid #f9fafb',
    maxWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    '&:last-child': {
      borderRight: 'none',
    },
  },
}));

export const RowIndexCell = styled('td')(() => ({
  width: ROW_INDEX_WIDTH,
  minWidth: ROW_INDEX_WIDTH,
  maxWidth: ROW_INDEX_WIDTH,
  textAlign: 'right',
  color: '#9ca3af',
  fontSize: 10,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  position: 'sticky',
  left: 0,
  zIndex: 1,
  backgroundColor: '#f8fafc',
  borderRight: '1px solid #f9fafb',
}));

export const NullValue = styled('span')(() => ({
  color: '#d1d5db',
  fontStyle: 'normal',

  '&::before': {
    content: '"\\2205"',
  },
}));

export const ColumnResizer = styled('div')(() => ({
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: 4,
  cursor: 'col-resize',
  backgroundColor: 'transparent',
  transition: 'background-color 150ms ease',

  '&:hover, &.resizing': {
    backgroundColor: '#3b82f6',
  },
}));

export const TypeIcon = styled('span')<{ scale?: number }>(({ scale = 1 }) => ({
  width: 18,
  height: 18,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
  color: '#9ca3af',
  flexShrink: 0,
  transform: `scale(${scale})`,

  '& svg': {
    width: '100%',
    height: '100%',
    display: 'block',
  },
}));
