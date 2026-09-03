import { styled, keyframes } from '@mui/material/styles';
import { Typography } from '@mui/material';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

export const MenuContainer = styled('div', {
  shouldForwardProp: prop => prop !== 'embedded',
})<{ embedded?: boolean }>(({ embedded }) => ({
  position: embedded ? 'static' : 'fixed',
  zIndex: embedded ? 'auto' : 1000,
  width: embedded ? '100%' : 280,
  maxHeight: 380,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  borderRadius: embedded ? 0 : 12,
  boxShadow: embedded
    ? 'none'
    : '0 2px 8px rgba(15, 23, 42, 0.08)',
  border: embedded ? 'none' : '1px solid #e5e7eb', // gray-200
  overflow: 'hidden',
  animation: embedded ? 'none' : `${fadeIn} 0.15s ease-out`,
}));

export const SearchHeader = styled('div')({
  padding: '12px',
  borderBottom: '1px solid #f3f4f6', // gray-100
  backgroundColor: '#ffffff',
});

export const SearchInputWrapper = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  backgroundColor: '#f9fafb', // gray-50
  borderRadius: 8,
  border: '1px solid transparent',
  transition: 'all 150ms ease',
  '&:focus-within': {
    backgroundColor: '#ffffff',
    borderColor: '#6366f1', // indigo-500
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
});

export const StyledInput = styled('input')({
  border: 'none',
  background: 'transparent',
  outline: 'none',
  width: '100%',
  marginLeft: 8,
  fontSize: 14,
  color: '#374151', // gray-700
  '&::placeholder': {
    color: '#9ca3af', // gray-400
  },
});

export const ResultList = styled('div')({
  overflowY: 'auto',
  padding: '6px',
  flexGrow: 1,
  '&::-webkit-scrollbar': { width: 4 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: '#e5e7eb', borderRadius: 10 },
});

export const MenuItem = styled('div')<{ active?: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  backgroundColor: active ? '#f3f4f6' : 'transparent',
  '&:hover': {
    backgroundColor: '#f3f4f6', // gray-100
  },
}));

export const IconBox = styled('div')({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: '#e0e7ff', // indigo-100
  color: '#6366f1', // indigo-500
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 18,
  '& svg': { fontSize: 18 },
});

export const NodeLabel = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: '#1f2937', // gray-800
  lineHeight: 1.2,
});

export const CategoryLabel = styled(Typography)({
  fontSize: 11,
  color: '#9ca3af', // gray-400
  display: 'block',
});
