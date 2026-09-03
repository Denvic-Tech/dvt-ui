import {
  Box,
  Checkbox,
  Dialog,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

const FOCUS_SHADOW = '0 0 0 3px rgba(99, 102, 241, 0.1)';
const ERROR_FOCUS_SHADOW = '0 0 0 3px rgba(239, 68, 68, 0.1)';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export type TestConnectionButtonStatus =
  | 'neutral'
  | 'loading'
  | 'success'
  | 'error';

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: 860,
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: '80vh',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    margin: 12,
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiDialog-paper': {
      width: 'calc(100vw - 16px)',
      maxHeight: '92vh',
      flexDirection: 'column',
      margin: 8,
    },
  },
}));

export const Sidebar = styled(Box)(({ theme }) => ({
  width: 208,
  backgroundColor: '#f9fafb',
  borderRight: '1px solid #f3f4f6',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  minHeight: 0,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    borderRight: 'none',
    borderBottom: '1px solid #f3f4f6',
    maxHeight: 240,
  },
}));

export const SidebarHeader = styled(Box)(() => ({
  padding: 16,
  borderBottom: '1px solid #f3f4f6',
}));

export const SidebarTitle = styled(Typography)(() => ({
  fontSize: 10,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}));

export const SidebarContent = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '8px 0',
  minHeight: 0,
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 2,
  },
}));

export const ConnectionGroup = styled(Box, {
  shouldForwardProp: prop => prop !== 'isFirst',
})<{ isFirst?: boolean }>(({ isFirst = false }) => ({
  marginTop: isFirst ? 0 : 16,
}));

export const GroupHeader = styled(Box)(() => ({
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const GroupIcon = styled(Box)(() => ({
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: 14,
  },
}));

export const GroupName = styled(Typography)(() => ({
  fontSize: 10,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}));

export const GroupItems = styled(Box)(() => ({
  padding: '0 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}));

export const ConnectionTypeItem = styled('button', {
  shouldForwardProp: prop => prop !== 'isSelected' && prop !== 'isDisabled',
})<{ isSelected?: boolean; isDisabled?: boolean }>(
  ({ isSelected = false, isDisabled = false }) => ({
    width: '100%',
    padding: '8px 12px',
    borderRadius: 12,
    border: 'none',
    backgroundColor: isSelected ? '#e0e7ff' : 'transparent',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    transition: 'all 150ms ease',
    textAlign: 'left',
    fontFamily: 'inherit',
    opacity: isDisabled ? 0.5 : 1,
    '&:hover': {
      backgroundColor: isSelected ? '#e0e7ff' : '#f3f4f6',
    },
  })
);

export const ConnectionTypeIcon = styled(Box)(() => ({
  width: 18,
  height: 18,
  borderRadius: 6,
  overflow: 'hidden',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

export const ConnectionTypeFallback = styled(Box)(() => ({
  width: '100%',
  height: '100%',
  borderRadius: 6,
  backgroundColor: '#e5e7eb',
  color: '#6b7280',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const ConnectionTypeName = styled(Typography, {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected = false }) => ({
  fontSize: 14,
  fontWeight: 500,
  color: isSelected ? '#4338ca' : '#4b5563',
}));

export const MainContent = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  backgroundColor: '#ffffff',
}));

export const ContentHeader = styled(Box)(() => ({
  padding: '16px 24px',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
}));

export const HeaderLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}));

export const HeaderIconContainer = styled(Box)(() => ({
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: '#e0e7ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#4338ca',
  flexShrink: 0,
  '& img': {
    width: 24,
    height: 24,
    objectFit: 'cover',
    borderRadius: 8,
  },
}));

export const HeaderTitle = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.2,
}));

export const HeaderSubtitle = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#6b7280',
  marginTop: 2,
}));

export const CloseButton = styled(IconButton)(() => ({
  padding: 8,
  borderRadius: 8,
  color: '#9ca3af',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 20,
  },
}));

export const FormContainer = styled(Box)(() => ({
  flex: 1,
  padding: 24,
  overflowY: 'auto',
  minHeight: 0,
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 3,
  },
}));

export const Footer = styled(Box)(() => ({
  padding: '16px 24px',
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexShrink: 0,
}));

export const FooterLeft = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  minWidth: 0,
}));

export const FooterRight = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}));

export const FormSection = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  '& + &': {
    marginTop: 24,
  },
}));

export const FormRow = styled(Box)(() => ({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media (max-width: 680px)': {
    gridTemplateColumns: '1fr',
  },
}));

export const FormField = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

export const FieldLabel = styled('label')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  width: 'fit-content',
  maxWidth: '100%',
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
}));

export const RequiredMark = styled('span')(() => ({
  color: '#ef4444',
  marginLeft: 2,
}));

export const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    transition: 'all 150ms ease',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e5e7eb',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d1d5db',
    },
    '&.Mui-focused': {
      boxShadow: FOCUS_SHADOW,
      backgroundColor: '#ffffff',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#6366f1',
      borderWidth: 1,
    },
    '&.Mui-error': {
      backgroundColor: '#fef2f2',
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: '#fca5a5',
    },
    '&.Mui-error:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#f87171',
    },
    '&.Mui-error.Mui-focused': {
      boxShadow: ERROR_FOCUS_SHADOW,
      backgroundColor: '#ffffff',
    },
    '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ef4444',
      borderWidth: 1,
    },
    '&.Mui-disabled': {
      backgroundColor: '#f3f4f6',
    },
  },
  '& .MuiOutlinedInput-root.MuiInputBase-multiline': {
    padding: 0,
  },
  '& .MuiInputBase-input': {
    fontSize: 14,
    color: '#111827',
    padding: '10px 16px',
  },
  '& .MuiOutlinedInput-inputMultiline': {
    padding: '10px 16px !important',
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#9ca3af',
    opacity: 1,
  },
  '& .MuiFormHelperText-root': {
    marginTop: 2,
    marginLeft: 0,
  },
  '& .MuiFormHelperText-root.Mui-error': {
    color: 'inherit',
  },
}));

export const StyledSelectField = styled(StyledTextField)(() => ({
  '& .MuiSelect-select': {
    padding: '10px 40px 10px 16px',
    fontSize: 14,
    color: '#111827',
  },
  '& .MuiSelect-icon': {
    color: '#9ca3af',
    right: 10,
  },
}));

export const MonoTextField = styled(StyledTextField)(() => ({
  '& .MuiInputBase-input, & textarea': {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: 12,
  },
}));

export const CheckboxContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}));

export const StyledCheckbox = styled(Checkbox)(() => ({
  marginTop: 2,
  padding: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 18,
    color: '#d1d5db',
  },
  '&.Mui-checked .MuiSvgIcon-root': {
    color: '#6366f1',
  },
}));

export const CheckboxLabel = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
}));

export const CheckboxText = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 400,
  color: '#374151',
}));

export const CheckboxDescription = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#6b7280',
}));

export const TestConnectionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'status',
})<{ status: TestConnectionButtonStatus }>(({ status }) => {
  const styles: Record<TestConnectionButtonStatus, Record<string, unknown>> = {
    neutral: {
      backgroundColor: 'transparent',
      borderColor: '#c7d2fe',
      color: '#6366f1',
      '&:hover': {
        backgroundColor: '#eef2ff',
        borderColor: '#a5b4fc',
      },
    },
    loading: {
      backgroundColor: '#eef2ff',
      borderColor: '#c7d2fe',
      color: '#6366f1',
      cursor: 'wait',
      '&:hover': {
        backgroundColor: '#eef2ff',
        borderColor: '#c7d2fe',
      },
    },
    success: {
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#059669',
        borderColor: '#059669',
      },
    },
    error: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
      },
    },
  };

  return {
    padding: '10px 16px',
    border: '1px solid',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 200ms ease',
    ...styles[status],
    '&:disabled': {
      opacity: 0.7,
      cursor: status === 'loading' ? 'wait' : 'not-allowed',
    },
    '& .spinner': {
      width: 16,
      height: 16,
      animation: `${spin} 1s linear infinite`,
      flexShrink: 0,
    },
    '& .icon': {
      width: 16,
      height: 16,
      flexShrink: 0,
    },
  };
});

export const TestConnectionErrorModal = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    width: 400,
    maxWidth: '90vw',
    borderRadius: 16,
    overflow: 'hidden',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  },
}));

export const TestConnectionErrorModalContent = styled(Box)(() => ({
  padding: 24,
}));

export const TestConnectionErrorModalHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}));

export const TestConnectionErrorModalIconContainer = styled(Box)(() => ({
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: '#fee2e2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 20,
    color: '#dc2626',
  },
}));

export const TestConnectionErrorModalHeaderText = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const TestConnectionErrorModalTitle = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 600,
  color: '#111827',
}));

export const TestConnectionErrorModalException = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 500,
  color: '#6b7280',
  marginTop: 2,
}));

export const TestConnectionErrorModalCloseButton = styled('button')(() => ({
  padding: 4,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,
  '&:hover': {
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

export const TestConnectionErrorModalMessageContainer = styled(Box)(() => ({
  marginTop: 16,
  padding: 12,
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  maxHeight: 150,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 2,
  },
}));

export const TestConnectionErrorModalMessageText = styled(Typography)(() => ({
  fontSize: 13,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontWeight: 400,
  color: '#374151',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}));

export const TestConnectionErrorModalFooter = styled(Box)(() => ({
  marginTop: 20,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}));

export const TestConnectionErrorModalCopyButton = styled('button')(() => ({
  padding: '8px 16px',
  backgroundColor: 'transparent',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#4b5563',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 14,
  },
}));

export const TestConnectionErrorModalCloseAction = styled('button')(() => ({
  padding: '8px 16px',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
}));

export const TestConnectionErrorModalCopiedText = styled('span')(() => ({
  color: '#10b981',
}));

export const CancelButton = styled('button')(() => ({
  padding: '10px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#4b5563',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    color: '#374151',
    backgroundColor: '#f3f4f6',
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
}));

export const SubmitButton = styled('button')(() => ({
  padding: '10px 20px',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.65,
    transform: 'none',
  },
}));
