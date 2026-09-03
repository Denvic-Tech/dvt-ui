import { styled } from '@mui/material/styles';

const shouldForwardStateProp = (prop: PropertyKey) =>
  !['isActive', 'isExpanded', 'isOpen', 'toneIndex'].includes(String(prop));

const variableCardTones = [
  {
    backgroundColor: '#fcfcff',
    borderColor: '#e6e8ff',
  },
  {
    backgroundColor: '#fbfefc',
    borderColor: '#dcefe5',
  },
  {
    backgroundColor: '#fffdf9',
    borderColor: '#f1e6d8',
  },
  {
    backgroundColor: '#fffafb',
    borderColor: '#f0e0e6',
  },
] as const;

export const EditorRoot = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

export const NoticesStack = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}));

export const NoticeBlock = styled('div', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive?: boolean; variant?: 'neutral' | 'error' | 'success' }>(({
  variant = 'neutral',
}) => {
  if (variant === 'error') {
    return {
      padding: '12px 14px',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: 14,
      color: '#991b1b',
    };
  }

  if (variant === 'success') {
    return {
      padding: '12px 14px',
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: 14,
      color: '#065f46',
    };
  }

  return {
    padding: '12px 14px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    color: '#374151',
  };
});

export const NoticeTitle = styled('div')(() => ({
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
}));

export const NoticeList = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
  lineHeight: 1.45,
}));

export const ModeRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}));

export const ModeToggleContainer = styled('div')(() => ({
  display: 'inline-flex',
  padding: 3,
  backgroundColor: '#f3f4f6',
  borderRadius: 10,
  gap: 3,
}));

export const ModeToggleButton = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive: boolean }>(({ isActive }) => ({
  minWidth: 72,
  padding: '7px 16px',
  backgroundColor: isActive ? '#ffffff' : 'transparent',
  color: isActive ? '#111827' : '#6b7280',
  border: 'none',
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  boxShadow: isActive
    ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
    : 'none',
  textTransform: 'uppercase',
  letterSpacing: 0.32,
  lineHeight: 1.1,
  fontFamily: 'inherit',
  '&:focus-visible': {
    outline: 'none',
    boxShadow:
      '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04), 0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const SectionStack = styled('section')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}));

export const SectionLabel = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  '& > .label': {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
  },
}));

export const SectionCount = styled('span')(() => ({
  padding: '2px 8px',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 8,
  border: 'none',
}));

export const FieldLabel = styled('div')(() => ({
  fontSize: 12,
  fontWeight: 500,
  color: '#6b7280',
  marginBottom: 6,
}));

export const FieldHint = styled('div')(() => ({
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 1.45,
}));

export const MutedInlineText = styled('span')(() => ({
  fontSize: 12,
  color: '#9ca3af',
  lineHeight: 1.4,
}));

export const VariableList = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}));

export const VariableCard = styled('div', {
  shouldForwardProp: shouldForwardStateProp,
})<{ toneIndex?: number }>(({ toneIndex = 0 }) => {
  const tone =
    variableCardTones[Math.abs(toneIndex) % variableCardTones.length] ??
    variableCardTones[0];

  return {
    backgroundColor: tone.backgroundColor,
    border: `1px solid ${tone.borderColor}`,
    borderRadius: 14,
    overflow: 'visible',
    transition: 'all 150ms ease',
  };
});

export const VariableCardBody = styled('div')(() => ({
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}));

export const VariableHeaderRow = styled('div')(() => ({
  display: 'flex',
  gap: 8,
  alignItems: 'flex-start',
}));

export const VariableFieldsRow = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 140px',
  gap: 8,
  '@media (max-width: 720px)': {
    gridTemplateColumns: '1fr',
  },
}));

export const VariableFieldsColumn = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}));

export const TextInput = styled('input')(() => ({
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  color: '#111827',
  outline: 'none',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  '&:focus': {
    backgroundColor: '#ffffff',
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const MonoInput = styled(TextInput)(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  backgroundColor: '#ffffff',
}));

export const IconButton = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ variant?: 'default' | 'danger' }>(({ variant }) => ({
  width: 36,
  height: 36,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  color: '#9ca3af',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,
  fontFamily: 'inherit',
  '&:hover':
    variant === 'danger'
      ? {
          backgroundColor: '#fef2f2',
          color: '#ef4444',
        }
      : {
          backgroundColor: '#f3f4f6',
          color: '#6b7280',
        },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const SelectFieldShell = styled('div')(() => ({
  position: 'relative',
}));

export const SelectButton = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isOpen?: boolean }>(({ isOpen }) => ({
  width: '100%',
  padding: '10px 14px',
  backgroundColor: isOpen ? '#ffffff' : '#f9fafb',
  border: isOpen ? '1px solid #6366f1' : '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  color: '#111827',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  transition: 'all 150ms ease',
  outline: 'none',
  fontWeight: 500,
  fontFamily: 'inherit',
  boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
}));

export const SelectButtonValue = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  flex: 1,
}));

export const SelectButtonText = styled('span')(() => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const SelectDropdown = styled('div')(() => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: 4,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
  zIndex: 30,
  overflow: 'hidden',
}));

export const SelectSearchWrapper = styled('div')(() => ({
  padding: 8,
  borderBottom: '1px solid #f3f4f6',
}));

export const SelectSearchInput = styled('input')(() => ({
  width: '100%',
  padding: '9px 12px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  color: '#111827',
  outline: 'none',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  '&:focus': {
    backgroundColor: '#ffffff',
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const SelectOptionList = styled('div')(() => ({
  maxHeight: 240,
  overflowY: 'auto',
  padding: 4,
}));

export const SelectOption = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  width: '100%',
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 500,
  color: '#111827',
  cursor: 'pointer',
  backgroundColor: isSelected ? '#eef2ff' : 'transparent',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  transition: 'background-color 100ms ease',
  border: 'none',
  fontFamily: 'inherit',
  textAlign: 'left',
  '&:hover': {
    backgroundColor: isSelected ? '#eef2ff' : '#f9fafb',
  },
}));

export const SelectOptionMeta = styled('span')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  flexShrink: 0,
}));

export const SelectEmptyState = styled('div')(() => ({
  padding: '10px 12px',
  fontSize: 12,
  color: '#9ca3af',
}));

export const NullPolicyTriggerBtn = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isExpanded: boolean }>(({ isExpanded }) => ({
  width: '100%',
  padding: '10px 14px',
  backgroundColor: isExpanded ? '#fafafa' : 'transparent',
  border: 'none',
  borderTop: '1px solid #f3f4f6',
  fontSize: 12,
  fontWeight: 500,
  color: '#6b7280',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  transition: 'background-color 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#fafafa',
  },
}));

export const NullPolicyTitle = styled('span', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive: boolean }>(({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontWeight: 600,
  color: isActive ? '#6366f1' : '#6b7280',
}));

export const NullPolicySummary = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 6,
  minWidth: 0,
  flexWrap: 'wrap',
}));

export const NullPolicyExpandedBlock = styled('div')(() => ({
  padding: 16,
  backgroundColor: '#fafafa',
  borderTop: '1px solid #f3f4f6',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}));

export const NullableBadge = styled('span')(() => ({
  padding: '2px 8px',
  backgroundColor: '#eef2ff',
  color: '#6366f1',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 600,
  border: 'none',
}));

export const DefaultBadge = styled('span')(() => ({
  padding: '2px 8px',
  backgroundColor: '#f0fdf4',
  color: '#059669',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 600,
  border: 'none',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  maxWidth: 120,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const DtypeBadge = styled('span')(() => ({
  padding: '4px 10px',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 8,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  flexShrink: 0,
  border: 'none',
}));

export const CheckboxLabel = styled('label')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  cursor: 'pointer',
}));

export const CheckboxInput = styled('input')(() => ({
  position: 'absolute',
  opacity: 0,
  pointerEvents: 'none',
}));

export const CheckboxBox = styled('span', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isChecked: boolean }>(({ isChecked }) => ({
  width: 18,
  height: 18,
  borderRadius: 5,
  border: isChecked ? '1px solid #6366f1' : '1.5px solid #d1d5db',
  backgroundColor: isChecked ? '#6366f1' : '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,
  marginTop: 1,
  color: '#ffffff',
}));

export const CheckboxLabelText = styled('span')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  '& > .main': {
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
  },
  '& > .hint': {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 1.4,
  },
}));

export const AddVariableButton = styled('button')(() => ({
  width: '100%',
  marginTop: 12,
  padding: '12px 16px',
  backgroundColor: 'transparent',
  border: '1.5px dashed #d1d5db',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  color: '#6366f1',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#6366f1',
    borderStyle: 'solid',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const StatusSuccessBlock = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 12,
  '& > .icon': {
    color: '#059669',
    flexShrink: 0,
    display: 'flex',
  },
  '& > .text': {
    fontSize: 13,
    fontWeight: 500,
    color: '#065f46',
  },
}));

export const StatusInfoBlock = styled('div')(() => ({
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  fontSize: 13,
  color: '#6b7280',
}));

export const StatusErrorBlock = styled('div')(() => ({
  padding: '12px 16px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 12,
  fontSize: 13,
  color: '#991b1b',
  lineHeight: 1.45,
}));

export const SqlColumnHeader = styled('div')(() => ({
  padding: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  justifyContent: 'space-between',
}));

export const SqlColumnHeaderMain = styled('div')(() => ({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flex: 1,
}));

export const SqlColumnIconBox = styled('span')(() => ({
  width: 28,
  height: 28,
  backgroundColor: '#eef2ff',
  color: '#6366f1',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const SqlColumnName = styled('span')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const MonacoEditorWrapper = styled('div')(() => ({
  overflow: 'visible',
  backgroundColor: 'transparent',
  minHeight: 200,
  '& .monaco-scrollable-element > .scrollbar > .slider': {
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
}));

export const MonacoHint = styled('div')(() => ({
  fontSize: 12,
  color: '#6b7280',
  marginTop: 8,
}));
