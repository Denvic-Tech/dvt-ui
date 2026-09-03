import { styled } from '@mui/material/styles';

export const CleanCard = styled('div')(() => ({
  border: '1px solid #f3f4f6',
  borderRadius: 12,
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

export const SearchContainer = styled('div')(() => ({
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
}));

export const SearchInputWrapper = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  border: '1px solid #f3f4f6',
  transition: 'all 150ms ease',

  '&:focus-within': {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const SearchInput = styled('input')(() => ({
  flex: 1,
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: 13,
  color: '#374151',
  fontFamily: 'inherit',

  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const SearchIcon = styled('div')(() => ({
  width: 16,
  height: 16,
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const TableScrollContainer = styled('div')(() => ({
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

export const ErrorBanner = styled('div')(() => ({
  marginTop: 10,
  padding: '8px 12px',
  borderRadius: 10,
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  fontSize: 12,
  fontWeight: 500,
}));

export const ErrorLink = styled('button')(() => ({
  marginLeft: 6,
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontSize: 12,
  fontWeight: 600,
  color: '#b91c1c',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontFamily: 'inherit',
}));

export const StyledTable = styled('table')(() => ({
  width: '100%',
  borderCollapse: 'collapse',
}));

export const TableHeader = styled('thead')(() => ({
  position: 'sticky',
  top: 0,
  backgroundColor: 'rgba(249, 250, 251, 0.95)',
  backdropFilter: 'blur(8px)',
  zIndex: 1,
}));

export const TableHeaderCell = styled('th')(() => ({
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #f3f4f6',
}));

export const TableBody = styled('tbody')(() => ({
  '& tr': {
    transition: 'background-color 100ms ease',

    '&:hover': {
      backgroundColor: 'rgba(249, 250, 251, 0.5)',
    },
  },
}));

export const TableCell = styled('td')(() => ({
  padding: '10px 16px',
  borderBottom: '1px solid #f9fafb',
  verticalAlign: 'middle',
}));

export const ColumnName = styled('span')(() => ({
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
}));

export const IndexBadge = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 6px',
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 6,
  backgroundColor: '#f3f4f6',
  color: '#6b7280',

  '& svg': {
    fontSize: 12,
  },
}));

export const TypeBadge = styled('span')<{ dataType: string }>(
  ({ dataType }) => {
    const colors: Record<string, { bg: string; text: string }> = {
      STRING: { bg: '#dbeafe', text: '#1d4ed8' },
      DATETIME: { bg: '#fae8ff', text: '#a21caf' },
      FLOAT: { bg: '#d1fae5', text: '#047857' },
      INTEGER: { bg: '#fed7aa', text: '#c2410c' },
      BOOLEAN: { bg: '#e0e7ff', text: '#4338ca' },
      DOUBLE: { bg: '#d1fae5', text: '#047857' },
      LONG: { bg: '#fed7aa', text: '#c2410c' },
    };

    const color = colors[dataType] || { bg: '#f3f4f6', text: '#4b5563' };

    return {
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 6,
      backgroundColor: color.bg,
      color: color.text,
    };
  }
);

export const RenameInput = styled('input', {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ hasError }) => ({
  width: '100%',
  padding: '6px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#374151',
  backgroundColor: '#ffffff',
  border: `1px solid ${hasError ? '#fca5a5' : '#e5e7eb'}`,
  borderRadius: 8,
  outline: 'none',
  transition: 'all 150ms ease',

  '&:hover': {
    borderColor: hasError ? '#f87171' : '#d1d5db',
  },

  '&:focus': {
    borderColor: hasError ? '#f87171' : '#a5b4fc',
    boxShadow: hasError
      ? '0 0 0 3px rgba(248, 113, 113, 0.15)'
      : '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const EmptyState = styled('div')(() => ({
  padding: '32px 16px',
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 13,
}));
