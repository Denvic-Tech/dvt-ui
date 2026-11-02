import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Typography,
} from '@mui/material';

export const SidebarContainer = styled(Box)(() => ({
  boxSizing: 'border-box',
  width: '100%',
  height: '100%',
  paddingBottom: 2,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

export const MenuSection = styled(Box)(() => ({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  padding: '16px 12px 10px',
}));

const MENU_FONT_FAMILY = 'Inter, sans-serif';
const MENU_FOREGROUND = '#0F1117';
const MENU_ICON_COLOR = '#7C8191';
const MENU_ACTIVE_FOREGROUND = '#5B5BD6';
const MENU_TRANSITION = '120ms ease';

export const MenuGroup = styled(Box)(() => ({
  '& + &': {
    marginTop: 10,
  },
}));

export const MenuGroupLabel = styled(Typography)(() => ({
  padding: '0 0 3px 4px',
  fontFamily: MENU_FONT_FAMILY,
  fontSize: 12.5,
  fontWeight: 400,
  lineHeight: '18px',
  color: '#6B7385',
}));

export const MenuItem = styled(ListItemButton)(() => ({
  padding: '5px 10px',
  borderRadius: 8,
  margin: '1px 0',
  alignItems: 'center',
  gap: 10,
  transition: `background-color ${MENU_TRANSITION}`,
  '&:hover': {
    backgroundColor: '#F4F5F7',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 18,
    color: MENU_ICON_COLOR,
    transition: `color ${MENU_TRANSITION}`,
  },
  '& .MuiListItemIcon-root svg': {
    width: 18,
    height: 18,
  },
  '& .MuiListItemText-root': {
    margin: 0,
  },
  '& .MuiListItemText-primary': {
    fontFamily: MENU_FONT_FAMILY,
    fontSize: 13,
    fontWeight: 400,
    lineHeight: '20px',
    color: MENU_FOREGROUND,
    transition: `color ${MENU_TRANSITION}`,
  },
  '&.Mui-selected, &.Mui-selected:hover': {
    backgroundColor: '#EEF0FD',
  },
  '&.Mui-selected .MuiListItemIcon-root, &.Mui-selected .MuiListItemText-primary':
    {
      color: MENU_ACTIVE_FOREGROUND,
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
