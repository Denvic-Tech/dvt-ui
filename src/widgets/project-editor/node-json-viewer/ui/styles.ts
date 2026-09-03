import { Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: 'min(1200px, calc(100% - 32px))',
    height: 'min(78vh, 860px)',
    maxWidth: 'none',
    borderRadius: 12,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
}));

