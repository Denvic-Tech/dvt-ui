import { keyframes, styled } from '@mui/material/styles';

import {
  Button,
  IconButton,
  Input,
  Select,
  Textarea,
} from '@/shared/ui/primitives';

export const COL_TEMPLATE_WIDE =
  '14px 50px minmax(0, 1.1fr) minmax(0, 1.6fr) 24px';
export const COL_TEMPLATE_NARROW =
  '14px 46px minmax(0, 1fr) minmax(0, 1.3fr) 24px';

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const ProjectVariablesRoot = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  height: '100%',
  backgroundColor: '#ffffff',
}));

export const HeaderWrap = styled('div')(() => ({
  padding: '14px 16px 10px',
  borderBottom: '1px solid #f3f4f6',
  flexShrink: 0,
}));

export const HeaderTopRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 0,
}));

export const HeaderTitle = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
}));

export const HeaderActions = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'flex-end',
  flexShrink: 0,
}));

export const StatusWrap = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '10px 12px 0',
  flexShrink: 0,
}));

export const ToolbarButton = styled(Button)(() => ({
  minWidth: 'auto',
  whiteSpace: 'nowrap',
  '&&.MuiButton-root.Mui-disabled': {
    background: '#e5e7eb',
    backgroundColor: '#e5e7eb',
    backgroundImage: 'none',
    boxShadow: 'none',
    color: '#9ca3af',
    borderColor: '#e5e7eb',
    opacity: 1,
  },
}));

export const TableWrap = styled('div')(() => ({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
}));

export const VariableListWrap = styled('div')(() => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
}));

export const ColumnHeader = styled('div')<{ isNarrow: boolean }>(
  ({ isNarrow }) => ({
    display: 'grid',
    gridTemplateColumns: isNarrow ? COL_TEMPLATE_NARROW : COL_TEMPLATE_WIDE,
    gap: 8,
    padding: '7px 12px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fafbfc',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    overflow: 'visible',
  })
);

export const ColumnHeaderCell = styled('span')(() => ({
  fontSize: 9,
  fontWeight: 700,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}));

export const RowWrap = styled('div')<{
  expanded: boolean;
  isDraft?: boolean;
  isSaving?: boolean;
}>(({ expanded, isDraft = false, isSaving = false }) => ({
  borderBottom: isDraft ? '1px dashed #fde68a' : '1px solid #f3f4f6',
  borderLeft: isDraft ? '3px solid #f59e0b' : 'none',
  backgroundColor: isDraft ? '#fefce8' : expanded ? '#fafbfc' : '#ffffff',
  opacity: isSaving ? 0.68 : 1,
  transition: 'all 150ms ease',
  '&:hover': isDraft
    ? undefined
    : {
        backgroundColor: '#fafbfc',
      },
  '&:hover .project-variables-delete-button': {
    color: '#9ca3af',
  },
}));

export const RowButton = styled('button')<{ isNarrow: boolean }>(
  ({ isNarrow }) => ({
    width: '100%',
    height: 36,
    padding: '7px 12px',
    background: 'none',
    border: 'none',
    display: 'grid',
    gridTemplateColumns: isNarrow ? COL_TEMPLATE_NARROW : COL_TEMPLATE_WIDE,
    gap: 8,
    alignItems: 'center',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'inherit',
    fontFamily: 'inherit',
  })
);

export const ChevronSlot = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  flexShrink: 0,
}));

export const NameCell = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  minWidth: 0,
}));

export const ListIndicator = styled('span')(() => ({
  color: '#4f46e5',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
}));

export const NameText = styled('span')<{ hasName: boolean }>(({ hasName }) => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  fontWeight: 600,
  color: hasName ? '#111827' : '#ef4444',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

export const WarningIndicator = styled('span')(() => ({
  color: '#ef4444',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
}));

export const ValueCell = styled('div')(() => ({
  minWidth: 0,
  overflow: 'hidden',
}));

export const PreviewText = styled('span')(() => ({
  display: 'block',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  color: '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const PreviewEmpty = styled('span')(() => ({
  fontSize: 11,
  color: '#d1d5db',
  fontStyle: 'italic',
}));

export const NullBadge = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 5px',
  minHeight: 16,
  borderRadius: 3,
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: 9,
  fontWeight: 700,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  letterSpacing: 0.4,
}));

export const BooleanChip = styled('span')<{ value: boolean }>(({ value }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 6px',
  minHeight: 18,
  borderRadius: 3,
  backgroundColor: value ? '#d1fae5' : '#fee2e2',
  color: value ? '#059669' : '#dc2626',
  fontSize: 10,
  fontWeight: 600,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
}));

export const DeleteButton = styled(IconButton)<{ visible: boolean }>(
  ({ visible }) => ({
    minWidth: 22,
    minHeight: 22,
    width: 22,
    height: 22,
    padding: 0,
    borderRadius: 5,
    color: visible ? '#9ca3af' : 'transparent',
    transition: 'all 150ms ease',
    '&:hover': {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
    },
    '&.Mui-disabled': {
      color: visible ? '#d1d5db' : 'transparent',
    },
  })
);

export const ExpandedWrap = styled('div')(() => ({
  animation: `${slideDown} 200ms ease`,
}));

export const MiniHeader = styled('div')<{ isDraft?: boolean }>(
  ({ isDraft = false }) => ({
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: isDraft ? '#fef3c7' : '#eef2ff',
    borderBottom: `1px solid ${isDraft ? '#fde68a' : '#c7d2fe'}`,
    color: isDraft ? '#92400e' : '#4f46e5',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  })
);

export const MiniHeaderName = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'none',
  letterSpacing: 0,
}));

export const EditorBody = styled('div')<{ isDraft?: boolean }>(
  ({ isDraft = false }) => ({
    padding: '10px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    backgroundColor: isDraft ? '#fefce8' : '#fafbfc',
  })
);

export const EditorTopRow = styled('div')<{ isNarrow: boolean }>(
  ({ isNarrow }) => ({
    display: 'grid',
    gridTemplateColumns: isNarrow
      ? 'minmax(0, 1fr) minmax(0, 1fr)'
      : 'minmax(0, 1fr) 100px 90px',
    gap: 6,
    alignItems: 'center',
  })
);

export const NameFieldWrap = styled('div')<{ isNarrow: boolean }>(
  ({ isNarrow }) =>
    isNarrow
      ? {
          gridColumn: '1 / 3',
        }
      : {}
);

export const NameInput = styled(Input)(() => ({
  '&& .MuiOutlinedInput-root': {
    minHeight: 32,
    height: 32,
    borderRadius: '5px !important',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  '&& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '5px !important',
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    boxShadow: 'none',
  },
  '& .MuiInputBase-input': {
    height: '32px',
    boxSizing: 'border-box',
    fontSize: 12,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontWeight: 600,
    padding: '0 10px',
  },
  '& .MuiOutlinedInput-root.Mui-disabled': {
    backgroundColor: '#f9fafb',
  },
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: '#9ca3af',
    color: '#9ca3af',
    opacity: 1,
  },
}));

export const TypeSelect = styled(Select, {
  shouldForwardProp: prop => prop !== 'typeColor',
})<{ typeColor: string }>(({ typeColor }) => ({
  '&&': {
    minHeight: '32px !important',
    height: '32px !important',
    borderRadius: '5px !important',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  '&& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '5px !important',
  },
  '&&.Mui-focused': {
    boxShadow: 'none',
  },
  '&&.Mui-disabled': {
    backgroundColor: '#f9fafb',
  },
  '&& .MuiSelect-select': {
    height: '100%',
    minHeight: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 10,
    paddingRight: '32px !important',
    fontSize: 11,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontWeight: 600,
    color: typeColor,
  },
  '&& .MuiSelect-select.Mui-disabled': {
    WebkitTextFillColor: '#9ca3af',
    color: '#9ca3af',
    opacity: 1,
  },
  '&& .MuiSvgIcon-root': {
    color: '#6b7280',
  },
  '&&.Mui-disabled .MuiSvgIcon-root': {
    color: '#9ca3af',
  },
}));

export const ListToggleButton = styled('button')<{
  active: boolean;
  disabled?: boolean;
}>(({ active, disabled = false }) => ({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  minHeight: 32,
  height: 32,
  padding: '6px 9px',
  backgroundColor: active ? '#eef2ff' : '#ffffff',
  border: `1px solid ${active ? '#c7d2fe' : '#e5e7eb'}`,
  borderRadius: 7,
  fontSize: 11,
  color: active ? '#4f46e5' : '#6b7280',
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  opacity: disabled ? 0.6 : 1,
}));

export const ValueSection = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}));

export const ValueLabelRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
}));

export const ValueLabel = styled('span')(() => ({
  fontSize: 10,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}));

export const ValueActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const TextActionButton = styled('button')<{
  accent?: boolean;
  active?: boolean;
  disabled?: boolean;
}>(({ accent = false, active = false, disabled = false }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  padding: 0,
  background: 'none',
  border: 'none',
  fontSize: 10,
  color: active ? '#4f46e5' : accent ? '#6366f1' : '#9ca3af',
  fontWeight: active || accent ? 600 : 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'color 150ms ease',
  fontFamily: 'inherit',
  opacity: disabled ? 0.6 : 1,
  '&:hover': disabled
    ? undefined
    : {
        color: active ? '#4338ca' : '#6366f1',
      },
}));

export const NullPlaceholder = styled('div')(() => ({
  padding: '7px 10px',
  backgroundColor: '#f9fafb',
  border: '1px dashed #e5e7eb',
  borderRadius: 7,
  color: '#9ca3af',
  fontSize: 11,
  fontStyle: 'italic',
}));

export const ValueInput = styled(Input)(() => ({
  '&& .MuiOutlinedInput-root': {
    minHeight: 32,
    height: 32,
    borderRadius: '5px !important',
    backgroundColor: '#fafbfc',
    boxSizing: 'border-box',
  },
  '&& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '5px !important',
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    backgroundColor: '#ffffff',
    boxShadow: 'none',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#6366f1',
  },
  '& .MuiInputBase-input': {
    height: '32px',
    boxSizing: 'border-box',
    fontSize: 12,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    color: '#374151',
    padding: '0 10px',
  },
  '& .MuiOutlinedInput-root.Mui-disabled': {
    backgroundColor: '#f3f4f6',
  },
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: '#6b7280',
    opacity: 1,
  },
}));

export const JsonTextarea = styled(Textarea)(() => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 7,
    backgroundColor: '#fafbfc',
    alignItems: 'flex-start',
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    backgroundColor: '#ffffff',
    boxShadow: 'none',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#6366f1',
  },
  '& .MuiInputBase-input': {
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    color: '#374151',
  },
}));

export const BooleanGroup = styled('div')(() => ({
  display: 'flex',
  gap: 6,
}));

export const BooleanButton = styled('button')<{
  active: boolean;
  booleanValue: boolean;
  disabled?: boolean;
}>(({ active, booleanValue, disabled = false }) => ({
  flex: 1,
  minHeight: 32,
  padding: '7px 10px',
  borderRadius: 7,
  backgroundColor: active ? (booleanValue ? '#d1fae5' : '#fee2e2') : '#ffffff',
  color: active ? (booleanValue ? '#059669' : '#dc2626') : '#6b7280',
  border: `1px solid ${
    active ? (booleanValue ? '#a7f3d0' : '#fecaca') : '#e5e7eb'
  }`,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 150ms ease',
  opacity: disabled ? 0.6 : 1,
}));

export const ListItemsWrap = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}));

export const ListItemCard = styled('div')(() => ({
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  backgroundColor: '#ffffff',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}));

export const ListItemHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
}));

export const ListItemTitle = styled('span')(() => ({
  fontSize: 11,
  color: '#6b7280',
  fontWeight: 600,
}));

export const EmptyListState = styled('div')(() => ({
  padding: '14px 12px',
  color: '#9ca3af',
  fontSize: 11,
  textAlign: 'center',
}));

export const InlineErrorBlock = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 7,
  backgroundColor: '#fee2e2',
  border: '1px solid #fecaca',
  color: '#dc2626',
  fontSize: 11,
  lineHeight: 1.5,
}));

export const EditorFooter = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  paddingTop: 8,
  borderTop: '1px solid #f3f4f6',
}));

export const FooterStatus = styled('div')<{
  state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'invalid';
}>(({ state }) => {
  const colors = {
    idle: '#9ca3af',
    dirty: '#f59e0b',
    saving: '#6b7280',
    saved: '#059669',
    error: '#dc2626',
    invalid: '#92400e',
  };

  return {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    flex: 1,
    fontSize: 10,
    fontWeight: state === 'idle' ? 400 : 500,
    color: colors[state],
    '& .MuiSvgIcon-root': {
      flexShrink: 0,
    },
  };
});

export const EditorFooterActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
}));
