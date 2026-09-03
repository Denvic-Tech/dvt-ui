import {
  Box,
  Dialog,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    border: '1px solid #f3f4f6',
    maxWidth: 420,
    width: '100%',
    margin: 16,
    overflow: 'hidden',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  },
}));

export const ModalHeader = styled(Box)(() => ({
  padding: '20px 24px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 16,
}));

export const HeaderIcon = styled(Box)(() => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: '#eef2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& svg': {
    width: 24,
    height: 24,
    color: '#6366f1',
  },
}));

export const HeaderContent = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const HeaderTitle = styled(Typography)(() => ({
  fontSize: 18,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 4,
}));

export const HeaderDescription = styled(Typography)(() => ({
  fontSize: 14,
  color: '#6b7280',
  lineHeight: 1.5,
}));

export const ModalContent = styled(Box)(() => ({
  padding: '0 24px 20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}));

export const InputField = styled('input')(() => ({
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#111827',
  outline: 'none',
  transition: 'all 150ms ease',
  boxSizing: 'border-box',
  '&::placeholder': {
    color: '#9ca3af',
  },
  '&:hover': {
    borderColor: '#d1d5db',
  },
  '&:focus': {
    backgroundColor: '#ffffff',
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  '&:disabled': {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
}));

export const ModalFooter = styled(Box)(() => ({
  padding: '16px 24px',
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #f3f4f6',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
}));

export const CancelButton = styled('button')(() => ({
  padding: '10px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#6b7280',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  '&:disabled': {
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
}));

export const CreateButton = styled('button')(() => ({
  padding: '10px 20px',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
  '&:disabled': {
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}));
