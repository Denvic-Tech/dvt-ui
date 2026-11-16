import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

import { TokenListCellText } from '@/shared/ui/token-list';

export const AlertSection = styled(Box)(() => ({
  paddingBottom: 16,
}));

const ROW_DIVIDER = '1px solid #EEF0F4';

export const UserNameLine = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
});

export const UserEmail = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#1B1F2A',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 13,
  fontWeight: 500,
});

export const YouBadge = styled('span')({
  flex: 'none',
  padding: '1px 6px',
  borderRadius: 5,
  backgroundColor: '#EEF0FF',
  color: '#4343D6',
  fontSize: 11,
  fontWeight: 600,
  lineHeight: '16px',
});

// Red for a blocked user, yellow for an unconfirmed email.
export const UserStatusText = styled(TokenListCellText, {
  shouldForwardProp: prop => prop !== 'status',
})<{ status: 'blocked' | 'unverified' }>(({ status }) => ({
  color: status === 'blocked' ? '#B42318' : '#A16207',
  fontWeight: 500,
}));

export const UsersFooter = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  flexShrink: 0,
  boxSizing: 'border-box',
  height: 44,
  padding: '0 8px 0 16px',
  borderTop: ROW_DIVIDER,
});

export const UsersFooterRange = styled('span')({
  flex: 1,
  color: '#6B7385',
  fontSize: 12.5,
});

export const UsersPageButton = styled(IconButton)({
  width: 28,
  height: 28,
  borderRadius: 8,
  color: '#6B7385',
  '&:hover': { backgroundColor: '#F1F3F8', color: '#1B1F2A' },
  '&.Mui-disabled': { color: '#C3C8D2' },
});
