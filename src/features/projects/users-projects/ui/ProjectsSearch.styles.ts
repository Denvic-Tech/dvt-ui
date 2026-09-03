import { styled } from '@mui/material/styles';

const shouldForwardSearchProp = (prop: PropertyKey) =>
  !['isActive', 'isDropdownOpen', 'isFocused', 'isGlobal'].includes(
    String(prop)
  );

export const SearchContainer = styled('div')(() => ({
  position: 'relative',
  flex: 1,
  maxWidth: 420,
  minWidth: 220,
}));

export const SearchInputWrap = styled('div', {
  shouldForwardProp: shouldForwardSearchProp,
})<{
  isFocused: boolean;
  isGlobal: boolean;
  isDropdownOpen: boolean;
}>(({ isFocused, isGlobal, isDropdownOpen }) => {
  const isActive = isFocused || isGlobal;
  return {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: isActive ? '1px solid #d1d5db' : '1px solid #e5e7eb',
    borderRadius: isDropdownOpen ? '10px 10px 0 0' : 10,
    boxShadow: 'none',
    transition: 'all 150ms ease',
  };
});

export const SearchIconWrap = styled('span', {
  shouldForwardProp: shouldForwardSearchProp,
})<{ isActive: boolean }>(({ isActive }) => ({
  paddingLeft: 12,
  color: isActive ? '#6366f1' : '#9ca3af',
  display: 'flex',
  transition: 'color 150ms ease',
}));

export const SearchInputField = styled('input')(() => ({
  flex: 1,
  minWidth: 0,
  padding: '9px 8px',
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: 13,
  color: '#111827',
  fontFamily: 'inherit',
  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const GlobalModeBadge = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '3px 8px',
  backgroundColor: '#eef2ff',
  color: '#6366f1',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  marginRight: 6,
  flexShrink: 0,
  border: 'none',
}));

export const SearchClearBtn = styled('button')(() => ({
  width: 28,
  height: 28,
  marginRight: 4,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  color: '#9ca3af',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
}));

export const SearchDropdown = styled('div')(() => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderTop: '1px solid #f3f4f6',
  borderRadius: '0 0 10px 10px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
  zIndex: 30,
  padding: 6,
  overflow: 'hidden',
}));

export const SearchGlobalCta = styled('button')(() => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'background-color 100ms ease',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: '#eef2ff',
  },
}));

export const SearchCtaIconBox = styled('span')(() => ({
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

export const SearchCtaText = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  fontSize: 13,
  fontWeight: 600,
  color: '#4b5563',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '& > .query': {
    color: '#4f46e5',
    fontWeight: 700,
  },
}));

export const SearchCtaKbHint = styled('span')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '3px 7px',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  borderRadius: 5,
  fontSize: 10,
  fontWeight: 600,
  flexShrink: 0,
  border: 'none',
}));
