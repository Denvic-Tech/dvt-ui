import { styled } from '@mui/material/styles';

export const ManagerContainer = styled('div')(() => ({
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
  borderRadius: 0,
  boxShadow: 'none',
}));

export const ManagerHeader = styled('div')(() => ({
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: 16,
  borderBottom: '1px solid #f3f4f6',
}));

export const HeaderTitle = styled('h2')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#1f2937',
  margin: '0 0 12px',
}));

export const HeaderActions = styled('div')(() => ({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}));

export const RefreshButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 500,
  color: '#4b5563',
  backgroundColor: '#f3f4f6',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',

  '&:hover': {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },

  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const AddButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 500,
  color: '#ffffff',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',

  '&:hover': {
    backgroundColor: '#4f46e5',
  },

  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  '& svg': {
    width: 14,
    height: 14,
  },
}));
