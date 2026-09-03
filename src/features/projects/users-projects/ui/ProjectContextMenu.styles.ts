import { Box, Popover, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const shouldForwardToneProp = (prop: PropertyKey) => String(prop) !== 'tone';

export const StyledPopover = styled(Popover)(() => ({
  '& .MuiPopover-paper': {
    borderRadius: 14,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e5e7eb',
    marginTop: 8,
    overflow: 'visible',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -6,
      right: 10,
      width: 12,
      height: 12,
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderBottom: 'none',
      borderRight: 'none',
      transform: 'rotate(45deg)',
      zIndex: 1,
    },
  },
}));

export const MenuContainer = styled(Box)(() => ({
  padding: 8,
  minWidth: 220,
  backgroundColor: '#ffffff',
  borderRadius: 14,
  position: 'relative',
  zIndex: 2,
}));

export const MenuActionButton = styled('button', {
  shouldForwardProp: shouldForwardToneProp,
})<{ tone?: 'default' | 'danger' }>(({ tone = 'default' }) => ({
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background-color 150ms ease',
  '&:hover': {
    backgroundColor: tone === 'danger' ? '#fef2f2' : '#f9fafb',
  },
  '&:hover .menu-icon-container': {
    backgroundColor: tone === 'danger' ? '#fee2e2' : '#eef2ff',
  },
  '&:hover .menu-icon': {
    color: tone === 'danger' ? '#ef4444' : '#6366f1',
  },
}));

export const MenuIconContainer = styled(Box, {
  shouldForwardProp: shouldForwardToneProp,
})<{ tone?: 'default' | 'danger' }>(({ tone = 'default' }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: tone === 'danger' ? '#fef2f2' : '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background-color 150ms ease',
  '& svg': {
    width: 16,
    height: 16,
    color: tone === 'danger' ? '#ef4444' : '#6b7280',
    transition: 'color 150ms ease',
  },
}));

export const MenuItemContent = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const MenuItemTitle = styled(Typography, {
  shouldForwardProp: shouldForwardToneProp,
})<{ tone?: 'default' | 'danger' }>(({ tone = 'default' }) => ({
  fontSize: 14,
  fontWeight: 500,
  color: tone === 'danger' ? '#dc2626' : '#111827',
  lineHeight: 1.3,
}));

export const MenuItemDescription = styled(Typography, {
  shouldForwardProp: shouldForwardToneProp,
})<{ tone?: 'default' | 'danger' }>(({ tone = 'default' }) => ({
  fontSize: 12,
  color: tone === 'danger' ? '#f87171' : '#6b7280',
  lineHeight: 1.3,
  marginTop: 2,
}));

export const MenuDivider = styled(Box)(() => ({
  height: 1,
  backgroundColor: '#f3f4f6',
  margin: '8px 4px',
}));
