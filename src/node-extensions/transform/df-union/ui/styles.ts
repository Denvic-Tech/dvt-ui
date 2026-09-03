import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const EditorRoot = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
}));

export const PanelsSection = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
  minHeight: 0,
}));

export const EmptyMessage = styled(Typography)(() => ({
  color: '#6b7280',
}));

export const PanelsGrid = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 240px',
  gap: 12,
  minHeight: 0,
  alignItems: 'stretch',
  width: '100%',
  flex: 1,
}));

export const MapperContainer = styled('div')(() => ({
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  height: '100%',
}));

export const MapperHeader = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 16px 1fr',
  gap: 10,
  padding: '8px 12px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.3,
  alignItems: 'center',
}));

export const MapperHeaderLabel = styled('span')(() => ({
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.3,
}));

export const MapperScrollArea = styled('div')(() => ({
  overflowY: 'auto' as const,
  flex: 1,
  minHeight: 0,
}));

export const MapperRow = styled('div', {
  shouldForwardProp: prop => prop !== 'isMapped',
})<{ isMapped?: boolean }>(({ isMapped }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 16px 1fr',
  gap: 10,
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid #f3f4f6',
  backgroundColor: isMapped ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
  transition: 'background 100ms ease',
  '&:last-child': {
    borderBottom: 'none',
  },
}));

export const LeftCell = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
}));

export const RightCellContent = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  minWidth: 0,
  flex: 1,
}));

export const TypeIconLabel = styled('span')(() => ({
  fontSize: 11,
  fontWeight: 700,
  color: '#9ca3af',
  width: 22,
  textAlign: 'center' as const,
  flexShrink: 0,
}));

export const ColumnName = styled('span')(() => ({
  fontSize: 12,
  fontWeight: 500,
  color: '#1f2937',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
}));

export const TypeBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'dataType',
})<{ dataType: string }>(({ dataType }) => {
  const map: Record<string, { color: string; bg: string }> = {
    STRING: { color: '#6366f1', bg: '#eef2ff' },
    STR: { color: '#6366f1', bg: '#eef2ff' },
    TEXT: { color: '#6366f1', bg: '#eef2ff' },
    INT: { color: '#8b5cf6', bg: '#f5f3ff' },
    INTEGER: { color: '#8b5cf6', bg: '#f5f3ff' },
    BIGINT: { color: '#8b5cf6', bg: '#f5f3ff' },
    FLOAT: { color: '#f59e0b', bg: '#fffbeb' },
    DOUBLE: { color: '#f59e0b', bg: '#fffbeb' },
    DECIMAL: { color: '#f59e0b', bg: '#fffbeb' },
    BOOLEAN: { color: '#10b981', bg: '#ecfdf5' },
    BOOL: { color: '#10b981', bg: '#ecfdf5' },
    DATE: { color: '#ec4899', bg: '#fdf2f8' },
    DATETIME: { color: '#ec4899', bg: '#fdf2f8' },
    TIMESTAMP: { color: '#ec4899', bg: '#fdf2f8' },
  };
  const normalizedType = dataType?.toUpperCase?.() ?? '';
  const colorPreset = map[normalizedType] ?? {
    color: '#6b7280',
    bg: '#f3f4f6',
  };

  return {
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.3,
    color: colorPreset.color,
    backgroundColor: colorPreset.bg,
    border: 'none',
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
  };
});

export const DropZone = styled('div', {
  shouldForwardProp: prop => prop !== 'isMapped' && prop !== 'isDragOver',
})<{ isMapped?: boolean; isDragOver?: boolean }>(
  ({ isMapped, isDragOver }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 8px',
    borderRadius: 7,
    minHeight: 30,
    fontSize: 12,
    transition: 'all 150ms ease',
    minWidth: 0,
    ...(isMapped
      ? {
          backgroundColor: '#ecfdf5',
          border: '1px solid #10b981',
          color: '#1f2937',
          cursor: 'grab',
        }
      : isDragOver
        ? {
            backgroundColor: '#eef2ff',
            border: '1.5px solid #6366f1',
            color: '#6366f1',
          }
        : {
            backgroundColor: 'transparent',
            border: '1.5px dashed #d1d5db',
            color: '#9ca3af',
          }),
    '&:active': isMapped
      ? {
          cursor: 'grabbing',
        }
      : undefined,
  })
);

export const DropZoneLabel = styled('span')(() => ({
  fontSize: 12,
  color: 'inherit',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
}));

export const UnmapButton = styled('svg')(() => ({
  cursor: 'pointer',
  flexShrink: 0,
  opacity: 0.5,
  transition: 'opacity 150ms ease',
  '&:hover': {
    opacity: 1,
  },
}));

export const RightPanel = styled('div')(() => ({
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  height: '100%',
}));

export const RightPanelHeader = styled('div')(() => ({
  padding: '10px 10px 8px',
  borderBottom: '1px solid #f3f4f6',
}));

export const RightPanelTitle = styled('div')(() => ({
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.3,
  marginBottom: 6,
}));

export const RightPanelList = styled('div')(() => ({
  flex: 1,
  overflowY: 'auto' as const,
  padding: 6,
  minHeight: 0,
}));

export const DraggableItem = styled('div', {
  shouldForwardProp: prop => prop !== 'isDragging',
})<{ isDragging?: boolean }>(({ isDragging }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 8px',
  borderRadius: 7,
  cursor: 'grab',
  marginBottom: 2,
  transition: 'all 100ms ease',
  border: '1px solid transparent',
  backgroundColor: isDragging ? '#eef2ff' : 'transparent',
  borderColor: isDragging ? '#6366f1' : 'transparent',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  '&:active': {
    cursor: 'grabbing',
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
}));

export const DragHandle = styled('svg')(() => ({
  flexShrink: 0,
  opacity: 0.4,
}));

export const SearchContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 10px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  flex: 1,
  minWidth: 0,
}));

export const SearchIcon = styled('svg')(() => ({
  flexShrink: 0,
}));

export const SearchField = styled('input')(() => ({
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontSize: 12,
  color: '#1f2937',
  width: '100%',
  minWidth: 0,
  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const Toolbar = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  flexWrap: 'wrap' as const,
  paddingBottom: 6,
}));

export const StatsRow = styled('div')(() => ({
  display: 'flex',
  gap: 12,
  fontSize: 12,
  color: '#6b7280',
  flexWrap: 'wrap' as const,
}));

export const StatValue = styled('strong', {
  shouldForwardProp: prop => prop !== '$variant',
})<{ $variant: 'mapped' | 'unmapped' | 'total' }>(({ $variant }) => ({
  color:
    $variant === 'mapped'
      ? '#10b981'
      : $variant === 'unmapped'
        ? '#f59e0b'
        : '#374151',
}));

export const ActionButtons = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap' as const,
}));

export const AutomapButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
}));

export const ResetButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
    color: '#374151',
  },
  '&:disabled': {
    cursor: 'default',
    color: '#9ca3af',
    backgroundColor: '#f9fafb',
  },
}));

export const EmptyState = styled('div')(() => ({
  padding: 16,
  fontSize: 12,
  color: '#9ca3af',
  textAlign: 'center' as const,
}));
