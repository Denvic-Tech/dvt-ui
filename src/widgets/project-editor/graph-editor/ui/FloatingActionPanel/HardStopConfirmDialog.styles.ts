import Dialog from '@mui/material/Dialog';
import { styled } from '@mui/material/styles';

export const StyledHardStopDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    width: 420,
    maxWidth: 'calc(100vw - 32px)',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    border: '1px solid #f3f4f6',
    overflow: 'hidden',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  },
}));

export const DialogContent = styled('div')(() => ({
  padding: '28px 28px 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

export const IconContainer = styled('div')(() => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: '#fef2f2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
}));

export const DialogTitle = styled('h3')(() => ({
  margin: 0,
  fontSize: 17,
  fontWeight: 600,
  color: '#111827',
  textAlign: 'center',
  lineHeight: 1.3,
}));

export const DialogDescription = styled('p')(() => ({
  margin: '10px 0 0',
  fontSize: 14,
  color: '#6b7280',
  textAlign: 'center',
  lineHeight: 1.55,
  '& strong': {
    color: '#374151',
    fontWeight: 600,
  },
}));

export const CheckboxArea = styled('div')(() => ({
  padding: '18px 28px 0',
  display: 'flex',
  justifyContent: 'center',
}));

export const CheckboxLabel = styled('label')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  fontSize: 13,
  color: '#6b7280',
  userSelect: 'none',
}));

export const CheckboxBox = styled('div', {
  shouldForwardProp: prop => prop !== 'checked',
})<{ checked?: boolean }>(({ checked = false }) => ({
  width: 18,
  height: 18,
  borderRadius: 5,
  border: `1.5px solid ${checked ? '#6366f1' : '#d1d5db'}`,
  backgroundColor: checked ? '#6366f1' : '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,
}));

export const DialogFooter = styled('div')(() => ({
  padding: '20px 28px 24px',
  display: 'flex',
  gap: 10,
  justifyContent: 'center',
}));

export const CancelButton = styled('button')(() => ({
  flex: 1,
  padding: '10px 20px',
  backgroundColor: 'transparent',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.16)',
  },
}));

export const StopButton = styled('button')(() => ({
  flex: 1,
  padding: '10px 20px',
  backgroundColor: '#ef4444',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#dc2626',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)',
  },
}));
