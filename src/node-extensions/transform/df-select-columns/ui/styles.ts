import { alpha, styled } from '@mui/material/styles';

export const Root = styled('section')(({ theme }) => ({
  height: '100%',
  minHeight: '100%',
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

export const Content = styled('div')(() => ({
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
}));

export const ActionsRow = styled('div')(() => ({
  display: 'flex',
  gap: 8,
  marginBottom: 16,
  flexWrap: 'wrap',
}));

export const ActionButton = styled('button')(() => ({
  padding: '8px 14px',
  backgroundColor: '#f1f5f9',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: '#64748b',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  '&:disabled': {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
}));

export const Panels = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 16,
  flex: 1,
  minHeight: 0,
  alignItems: 'stretch',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
}));

export const Panel = styled('div')(() => ({
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
}));

export const PanelHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  gap: 8,
}));

export const PanelLabel = styled('div')<{
  variant?: 'available' | 'selected';
}>(({ variant }) => ({
  fontSize: 11,
  fontWeight: 600,
  color: variant === 'selected' ? '#16a34a' : '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}));

export const CountBadge = styled('span')<{
  variant?: 'available' | 'selected';
}>(({ variant }) => ({
  padding: '2px 8px',
  backgroundColor: variant === 'selected' ? '#dcfce7' : '#f1f5f9',
  color: variant === 'selected' ? '#16a34a' : '#64748b',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 10,
}));

export const PanelList = styled('div')<{
  variant?: 'available' | 'selected';
}>(({ variant }) => ({
  backgroundColor: variant === 'selected' ? '#f0fdf4' : '#f8fafc',
  borderRadius: 12,
  border: `1px solid ${variant === 'selected' ? '#bbf7d0' : '#e2e8f0'}`,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
}));

export const EmptyState = styled('div')(() => ({
  padding: '40px 20px',
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: 13,
}));

export const ColumnItem = styled('button')<{
  variant?: 'available' | 'selected';
}>(({ variant }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  border: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  '&:not(:last-child)': {
    borderBottom: `1px solid ${variant === 'selected' ? '#dcfce7' : '#f1f5f9'}`,
  },
  '&:hover': {
    backgroundColor: variant === 'selected' ? '#dcfce7' : '#f1f5f9',
  },
}));

export const ColumnInfo = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}));

export const TypeIcon = styled('span')<{
  variant?: 'available' | 'selected';
}>(({ variant }) => ({
  width: 28,
  height: 28,
  borderRadius: 6,
  backgroundColor: '#ffffff',
  border: `1px solid ${variant === 'selected' ? '#bbf7d0' : '#e2e8f0'}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 600,
  color: variant === 'selected' ? '#64748b' : '#94a3b8',
  flexShrink: 0,
}));

export const ColumnName = styled('span')<{
  variant?: 'available' | 'selected';
}>(({ variant }) => ({
  fontSize: 14,
  color: variant === 'selected' ? '#1e293b' : '#64748b',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ItemAction = styled('span')({
  width: 24,
  height: 24,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,
});

export const AddButton = styled(ItemAction)({
  backgroundColor: '#e0e7ff',
  color: '#6366f1',
  'button:hover &': {
    backgroundColor: '#6366f1',
    color: '#ffffff',
  },
});

export const RemoveButton = styled(ItemAction)({
  backgroundColor: 'transparent',
  color: '#94a3b8',
  'button:hover &': {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
  },
});

export const ValidationHint = styled('div')(({ theme }) => ({
  marginTop: 16,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #fecaca',
  backgroundColor: alpha(theme.palette.error.main, 0.06),
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 500,
}));
