import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';

export const ConsoleContainer = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#ffffff',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  border: '1px solid #f3f4f6',
  zIndex: theme.zIndex.drawer - 1,
  transition: 'left 0.2s ease-in-out',
}));

export const ResizeHandle = styled('div')(() => ({
  height: 6,
  cursor: 'row-resize',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 2,
  transition: 'background-color 150ms ease',
  '&:hover': {
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
  },
}));

export const ConsoleHeader = styled('div')(() => ({
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

export const ConsoleTitle = styled('span')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#1f2937',
}));

export const LogCounter = styled('span')(() => ({
  padding: '2px 8px',
  fontSize: 10,
  fontWeight: 500,
  color: '#6b7280',
  backgroundColor: '#f3f4f6',
  borderRadius: 10,
}));

export const HeaderActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}));

export const ActionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'variant',
})<{ variant?: 'default' | 'danger' }>(({ variant = 'default' }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  color: '#9ca3af',
  transition: 'all 150ms ease',

  '&:hover': {
    backgroundColor: variant === 'danger' ? '#fef2f2' : '#f3f4f6',
    color: variant === 'danger' ? '#ef4444' : '#4b5563',
  },

  '&:disabled': {
    cursor: 'not-allowed',
    color: '#d1d5db',
  },

  '&:disabled:hover': {
    backgroundColor: 'transparent',
    color: '#d1d5db',
  },

  '& svg': {
    width: 16,
    height: 16,
  },
}));

export const ActionDivider = styled('div')(() => ({
  width: 1,
  height: 20,
  backgroundColor: '#e5e7eb',
  margin: '0 4px',
}));

export const FilterBar = styled('div')(() => ({
  padding: '8px 16px',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
}));

export const FilterTabs = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: 4,
  backgroundColor: '#f3f4f6',
  borderRadius: 8,
  flexWrap: 'wrap',
}));

export const FilterTab = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 500,
  color: active ? '#374151' : '#6b7280',
  backgroundColor: active ? '#ffffff' : 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  boxShadow: active ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',

  '&:hover': {
    backgroundColor: active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
  },
}));

export const FilterDot = styled('span', {
  shouldForwardProp: prop => prop !== 'level',
})<{ level: string }>(({ level }) => {
  const colors: Record<string, string> = {
    DEBUG: '#9ca3af',
    INFO: '#3b82f6',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
  };
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: colors[level] || '#9ca3af',
  };
});

export const FilterCount = styled('span', {
  shouldForwardProp: prop => prop !== 'level' && prop !== 'active',
})<{ level: string; active?: boolean }>(({ level, active }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    DEBUG: { bg: '#f3f4f6', text: '#6b7280' },
    INFO: { bg: '#dbeafe', text: '#1d4ed8' },
    WARNING: { bg: '#fef3c7', text: '#b45309' },
    ERROR: { bg: '#fee2e2', text: '#dc2626' },
  };
  const color = colors[level] || colors['DEBUG'];

  return {
    padding: '1px 6px',
    fontSize: 10,
    fontWeight: 500,
    borderRadius: 4,
    backgroundColor: active ? color.bg : 'transparent',
    color: color.text,
  };
});

export const SearchWrapper = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  border: '1px solid #f3f4f6',
  transition: 'all 150ms ease',

  '&:focus-within': {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
}));

export const SearchAdornmentIcon = styled(SearchIcon)(() => ({
  width: 16,
  height: 16,
  color: '#9ca3af',
}));

export const SearchInput = styled('input')(() => ({
  width: 160,
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: 12,
  color: '#374151',

  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const SearchClear = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#9ca3af',

  '&:hover': {
    color: '#6b7280',
  },

  '& svg': {
    width: 12,
    height: 12,
  },
}));

export const ConsoleBody = styled('div', {
  shouldForwardProp: prop => prop !== 'height',
})<{ height: number }>(({ height }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  height,
}));

export const LogsWrapper = styled('div')(() => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
}));

export const LogsContainer = styled('div')(() => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',

  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 3,
  },
}));

export const FloatingScrollButton = styled('button')(() => ({
  position: 'absolute',
  right: 12,
  bottom: 12,
  width: 38,
  height: 38,
  borderRadius: 4,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  transition: 'all 150ms ease',
  zIndex: 2,

  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },

  '& svg': {
    width: 18,
    height: 18,
  },
}));

export const LogRow = styled('div', {
  shouldForwardProp: prop => prop !== 'expanded' && prop !== 'selected',
})<{ expanded?: boolean; selected?: boolean }>(({ expanded, selected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 16px 10px 13px',
  cursor: 'pointer',
  transition: 'background-color 100ms ease',
  backgroundColor: selected
    ? 'rgba(59, 130, 246, 0.06)'
    : expanded
      ? '#f9fafb'
      : 'transparent',
  borderBottom: '1px solid #f9fafb',
  borderLeft: `3px solid ${selected ? '#3b82f6' : 'transparent'}`,

  '&:hover': {
    backgroundColor: selected
      ? 'rgba(59, 130, 246, 0.1)'
      : expanded
        ? '#f9fafb'
        : 'rgba(249, 250, 251, 0.5)',
  },

  '&:hover .log-row-copy-btn': {
    opacity: 1,
  },
}));

export const RowCopyButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#9ca3af',
  opacity: 0,
  transition: 'opacity 150ms ease, color 150ms ease, background-color 150ms ease',
  flexShrink: 0,

  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const ExpandIcon = styled('div', {
  shouldForwardProp: prop => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  width: 12,
  height: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  transition: 'transform 200ms ease',
  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
  flexShrink: 0,

  '& svg': {
    width: 12,
    height: 12,
  },
}));

export const LogTime = styled('span')(() => ({
  fontSize: 11,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  color: '#9ca3af',
  width: 72,
  flexShrink: 0,
}));

export const LogLevel = styled('span', {
  shouldForwardProp: prop => prop !== 'level',
})<{ level: string }>(({ level }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    DEBUG: { bg: '#f3f4f6', text: '#6b7280' },
    INFO: { bg: '#dbeafe', text: '#1d4ed8' },
    WARNING: { bg: '#fef3c7', text: '#b45309' },
    ERROR: { bg: '#fee2e2', text: '#dc2626' },
  };
  const color = colors[level] || colors['DEBUG'];

  return {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 4,
    backgroundColor: color.bg,
    color: color.text,
    width: 64,
    textAlign: 'center',
    flexShrink: 0,
  };
});

export const LogMessage = styled('span')(() => ({
  flex: 1,
  fontSize: 13,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  color: '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const LogDetails = styled('div')(() => ({
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #f3f4f6',
}));

export const DetailsGrid = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '8px 24px',
  marginBottom: 12,
}));

export const DetailItem = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}));

export const DetailLabel = styled('span')(() => ({
  color: '#9ca3af',
  width: 72,
  flexShrink: 0,
}));

export const DetailValue = styled('span', {
  shouldForwardProp: prop => prop !== 'variant',
})<{ variant?: 'default' | 'code' }>(({ variant = 'default' }) => ({
  color: variant === 'code' ? '#059669' : '#374151',
  fontFamily:
    variant === 'code' ? '"JetBrains Mono", "Fira Code", monospace' : 'inherit',
}));

export const FilePathLink = styled('span')(() => ({
  color: '#2563eb',
  textDecoration: 'underline',
  textDecorationColor: '#93b4f8',
  textUnderlineOffset: 2,
  cursor: 'default',
}));

export const MessageBox = styled('div')(() => ({
  padding: 12,
  backgroundColor: '#ffffff',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
}));

export const MessageText = styled('p', {
  shouldForwardProp: prop => prop !== 'level',
})<{ level?: string }>(({ level }) => {
  const colors: Record<string, string> = {
    DEBUG: '#6b7280',
    INFO: '#1d4ed8',
    WARNING: '#b45309',
    ERROR: '#dc2626',
  };
  return {
    margin: 0,
    fontSize: 13,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    color: (level && colors[level]) || '#374151',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  };
});

export const DetailsActions = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 12,
}));

export const DetailButton = styled('button')(() => ({
  padding: '4px 8px',
  fontSize: 11,
  fontWeight: 500,
  color: '#6b7280',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  transition: 'all 150ms ease',

  '&:hover': {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
}));

export const EmptyState = styled('div')(() => ({
  padding: '48px 16px',
  textAlign: 'center',
}));

export const EmptyIcon = styled('div')(() => ({
  width: 48,
  height: 48,
  margin: '0 auto 12px',
  color: '#d1d5db',

  '& svg': {
    width: '100%',
    height: '100%',
  },
}));

export const EmptyTitle = styled('p')(() => ({
  margin: 0,
  fontSize: 14,
  color: '#9ca3af',
}));

export const EmptySubtitle = styled('p')(() => ({
  margin: '4px 0 0',
  fontSize: 12,
  color: '#d1d5db',
}));

export const ConsoleFooter = styled('div')(() => ({
  padding: '8px 16px',
  borderTop: '1px solid #f3f4f6',
  backgroundColor: 'rgba(249, 250, 251, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 11,
  color: '#9ca3af',
}));

export const SelectionActionBarContainer = styled('div')(() => ({
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  backgroundColor: '#ffffff',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  border: '1px solid #e5e7eb',
  zIndex: 3,
  fontSize: 12,
  whiteSpace: 'nowrap',
}));
