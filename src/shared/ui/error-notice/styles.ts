import { ButtonBase, styled } from '@mui/material';

export const NoticeRoot = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 6px 10px 14px',
  borderRadius: 10,
  backgroundColor: '#FEF5F5',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

export const NoticeBody = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: 1,
  minWidth: 0,
});

export const NoticeTitle = styled('span')({
  fontSize: 13,
  lineHeight: '18px',
  fontWeight: 500,
  color: '#B42318',
});

export const NoticeText = styled('span')({
  fontSize: 12.5,
  lineHeight: '18px',
  color: '#9B4A43',
  wordBreak: 'break-word',
});

export const NoticeActions = styled('div')({
  display: 'flex',
  gap: 2,
  flexShrink: 0,
  marginTop: -3,
});

export const NoticeButton = styled(ButtonBase)({
  width: 24,
  height: 24,
  borderRadius: 6,
  color: '#C4746F',
  '&:hover': { backgroundColor: '#FBE3E3', color: '#B42318' },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 2px #FBE3E3' },
});
