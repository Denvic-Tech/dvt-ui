import {
  Avatar,
  Box,
  ButtonBase,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Typography,
} from '@mui/material';

export const SidebarContainer = styled(Box)(() => ({
  width: '100%',
  maxWidth: 280,
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

export const UserSection = styled(Box)(() => ({
  padding: 16,
  borderBottom: '1px solid #f3f4f6',
}));

export const UserInfo = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}));

export const UserAvatar = styled(Avatar)(() => ({
  width: 40,
  height: 40,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 600,
  flexShrink: 0,
}));

export const UserDetails = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const UserEmail = styled(Typography)(() => ({
  fontSize: 13.5,
  fontWeight: 600,
  lineHeight: 1.4,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const UserRole = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  marginTop: 1,
}));

export const RoleIndicator = styled('span')(() => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#10b981',
  flexShrink: 0,
}));

export const RoleText = styled(Typography)(() => ({
  fontSize: 12,
  lineHeight: 1.4,
  color: '#6b7280',
}));

export const MenuSection = styled(Box)(() => ({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  padding: 10,
}));

export const MenuGroup = styled(Box)(() => ({
  marginBottom: 10,
  '&:last-child': {
    marginBottom: 0,
  },
}));

export const MenuGroupLabel = styled(Typography)(() => ({
  padding: '5px 10px',
  fontSize: 10,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}));

export const MenuItem = styled(ListItemButton)(() => ({
  minHeight: 34,
  padding: '7px 10px',
  borderRadius: 10,
  marginBottom: 1,
  alignItems: 'center',
  gap: 9,
  transition: 'background-color 150ms ease, color 150ms ease',
  '&:last-child': {
    marginBottom: 0,
  },
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 17,
    color: '#9ca3af',
    transition: 'color 150ms ease',
  },
  '& .MuiListItemIcon-root svg': {
    width: 17,
    height: 17,
  },
  '& .MuiListItemText-root': {
    margin: 0,
  },
  '& .MuiListItemText-primary': {
    fontSize: 13.5,
    fontWeight: 500,
    color: '#4b5563',
    transition: 'color 150ms ease',
  },
  '&.Mui-selected': {
    backgroundColor: '#eef2ff',
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#eef2ff',
  },
  '&.Mui-selected .MuiListItemIcon-root': {
    color: '#6366f1',
  },
  '&.Mui-selected .MuiListItemText-primary': {
    color: '#4338ca',
  },
}));

export const MenuItemIcon = styled(ListItemIcon)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const MenuItemLabel = styled(ListItemText)(() => ({
  minWidth: 0,
}));

export const LogoutSection = styled(Box)(() => ({
  padding: 10,
  borderTop: '1px solid #f3f4f6',
}));

export const LogoutButton = styled(ButtonBase)(() => ({
  width: '100%',
  padding: '9px 14px',
  backgroundColor: 'var(--dvt-danger-surface)',
  border: '1px solid var(--dvt-danger-border)',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  color: 'var(--dvt-danger-foreground)',
  transition: 'background-color 150ms ease, color 150ms ease',
  '&:hover': {
    backgroundColor: 'var(--dvt-danger-surface-hover)',
  },
  '& svg': {
    width: 15,
    height: 15,
  },
}));

export const LogoutLabel = styled(Typography)(() => ({
  fontSize: 13.5,
  fontWeight: 500,
  color: 'inherit',
}));
