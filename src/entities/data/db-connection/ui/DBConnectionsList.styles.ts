import { keyframes, styled } from '@mui/material/styles';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const ListContainer = styled('div')(() => ({
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '2px 8px 8px',
}));

export const ConnectionGroupSection = styled('section')(() => ({
  display: 'grid',
  gap: 2,
}));

export const ConnectionTypeSection = styled('div')(() => ({
  display: 'grid',
  gap: 2,
}));

export const ConnectionGroupTitle = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '20px 8px 3px 2px',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#9ca3af',
}));

export const ConnectionGroupTitleIcon = styled('span')(() => ({
  width: 14,
  height: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: 'inherit',

  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const ConnectionItemWrapper = styled('div')(() => ({
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  marginBottom: 1,
}));

export const ConnectionHeader = styled('div', {
  shouldForwardProp: prop => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  display: 'flex',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  alignItems: 'center',
  gap: 10,
  minHeight: 48,
  padding: '6px 12px',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  backgroundColor: expanded ? '#f9fafb' : 'transparent',

  '&:hover': {
    backgroundColor: '#f3f4f6',
  },
}));

export const ConnectionIconWrapper = styled('div')(() => ({
  width: 32,
  height: 32,
  borderRadius: 9,
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,

  '& svg': {
    width: 18,
    height: 18,
  },

  '& img': {
    width: 18,
    height: 18,
    objectFit: 'contain',
  },
}));

export const ConnectionName = styled('span')(() => ({
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.1,
  color: '#374151',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const ConnectionNameRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
}));

export const ConnectionTextGroup = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  minHeight: 32,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 6,
  overflow: 'hidden',
}));

export const ConnectionSubtitle = styled('span')(() => ({
  display: 'block',
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  fontSize: 11.5,
  lineHeight: 1.05,
  color: '#6b7280',
  flex: '0 1 auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const ExpandIcon = styled('div', {
  shouldForwardProp: prop => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  width: 16,
  height: 16,
  color: '#9ca3af',
  transition: 'transform 200ms ease',
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& svg': {
    width: 16,
    height: 16,
  },
}));

export const ConnectionDetails = styled('div')(() => ({
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  margin: '8px 0 8px 0',
  padding: 12,
  backgroundColor: '#f9fafb',
  borderRadius: 10,
  border: '1px solid #f3f4f6',
  overflow: 'hidden',
}));

export const DetailRow = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(84px, auto) minmax(0, 1fr)',
  alignItems: 'center',
  padding: '4px 0',
  fontSize: 12,
  gap: 8,
  width: '100%',
  minWidth: 0,
}));

export const DetailLabel = styled('span')(() => ({
  color: '#6b7280',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const DetailValue = styled('span')(() => ({
  display: 'block',
  color: '#374151',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  textAlign: 'left',
  justifySelf: 'stretch',
  alignSelf: 'center',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const ConnectionIssues = styled('div')(() => ({
  marginTop: 10,
  padding: '10px 12px',
  borderRadius: 8,
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
}));

export const ConnectionIssuesTitle = styled('div')(() => ({
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#9a3412',
}));

export const ConnectionIssuesList = styled('ul')(() => ({
  display: 'grid',
  gap: 4,
  margin: 0,
  padding: '0 0 0 16px',
  color: '#7c2d12',
  fontSize: 12,
  lineHeight: 1.35,
}));

export const ConnectionIssueItem = styled('li')(() => ({
  overflowWrap: 'anywhere',
}));

export const ActionButtons = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 4,
  marginTop: 12,
  paddingTop: 12,
  borderTop: '1px solid #e5e7eb',
}));

export const ActionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'variant',
})<{ variant?: 'default' | 'edit' | 'delete' | 'storage' }>(
  ({ variant = 'default' }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    color: '#9ca3af',

    '&:hover': {
      ...(variant === 'default' && {
        backgroundColor: '#e5e7eb',
        color: '#4b5563',
      }),
      ...(variant === 'edit' && {
        backgroundColor: '#dbeafe',
        color: '#2563eb',
      }),
      ...(variant === 'storage' && {
        backgroundColor: '#e0f2fe',
        color: '#0284c7',
      }),
      ...(variant === 'delete' && {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
      }),
    },

    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },

    '& svg': {
      width: 16,
      height: 16,
    },
  })
);

export const EmptyState = styled('div')(() => ({
  padding: '32px 16px',
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 13,
}));

export const LoadingState = styled('div')(() => ({
  padding: '24px 16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

export const StatusRow = styled('div')(() => ({
  marginTop: 8,
}));

export const StatusBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'status',
})<{ status: 'idle' | 'testing' | 'success' | 'error' }>(({ status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 500,
  borderRadius: 20,
  transition: 'all 200ms ease',

  ...(status === 'idle' && {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  }),
  ...(status === 'testing' && {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  }),
  ...(status === 'success' && {
    backgroundColor: '#d1fae5',
    color: '#047857',
  }),
  ...(status === 'error' && {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  }),
}));

export const StatusDot = styled('span', {
  shouldForwardProp: prop => prop !== 'status',
})<{ status: 'idle' | 'success' | 'error' }>(({ status }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  flexShrink: 0,

  ...(status === 'idle' && {
    backgroundColor: '#9ca3af',
  }),
  ...(status === 'success' && {
    backgroundColor: '#10b981',
  }),
  ...(status === 'error' && {
    backgroundColor: '#ef4444',
  }),
}));

export const Spinner = styled('div')(() => ({
  width: 12,
  height: 12,
  border: '2px solid #93c5fd',
  borderTopColor: '#1d4ed8',
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
  flexShrink: 0,
}));
