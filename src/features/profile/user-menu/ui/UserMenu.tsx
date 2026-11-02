import * as React from 'react';
import {
  Box,
  ButtonBase,
  Fade,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { IconChevronRight, IconLogout } from '@tabler/icons-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { getAvailableProfileSectionGroups } from '@/features/profile/user-profile-navigation';

import { useCurrentUser } from '@/entities/user';

import { useAuth } from '@/contexts/AuthContext.tsx';

const MENU_WIDTH = 248;
const MENU_GROUP_IDS = new Set(['general', 'admin']);
const ITEM_ICON_SIZE = 15;
const MENU_FONT_FAMILY = 'Inter, sans-serif';
const MENU_ENTER_MS = 160;
const MENU_EXIT_MS = 100;
const MENU_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

const menuEnter = keyframes`
  from {
    transform: translateY(-4px) scale(0.97);
  }
`;

const avatarSx = {
  width: 32,
  height: 32,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
  color: '#ffffff',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
} as const;

// Explicit height and pixel paddings: MenuItem and the theme reset `minHeight`
// and paddings on wider breakpoints.
const itemSx = {
  height: 32,
  minHeight: '32px !important',
  gap: '10px',
  padding: '0 10px',
  borderRadius: '7px',
  fontFamily: MENU_FONT_FAMILY,
  color: '#1B1F2A',
  fontSize: 13.5,
  '& svg': { flexShrink: 0, color: '#6B7385' },
  '&:hover, &.Mui-focusVisible': { bgcolor: '#F5F6FA' },
} as const;

const logoutItemSx = {
  ...itemSx,
  color: '#DC2626',
  '& svg': { flexShrink: 0, color: '#DC2626' },
  '&:hover, &.Mui-focusVisible': { bgcolor: '#FEF2F2' },
} as const;

const separatorSx = { height: '1px', margin: '6px 4px', bgcolor: '#EEF0F4' };

export const UserMenu: React.FC = () => {
  const { user } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  const displayName =
    user?.user_name?.trim() || user?.email?.split('@')[0]?.trim() || '';
  const initial = (displayName[0] ?? 'U').toUpperCase();
  const groups = React.useMemo(
    () =>
      getAvailableProfileSectionGroups(user?.role).filter(group =>
        MENU_GROUP_IDS.has(group.id)
      ),
    [user?.role]
  );

  const handleLogout = async () => {
    close();
    await logout();
    navigate('/sign_in');
  };

  return (
    <>
      <ButtonBase
        disableRipple
        aria-label='Профиль'
        aria-haspopup='menu'
        aria-expanded={anchor !== null}
        onClick={event => setAnchor(event.currentTarget)}
        sx={avatarSx}
      >
        {initial}
      </ButtonBase>

      <Menu
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        disableScrollLock
        disableAutoFocusItem
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        aria-label='Профиль'
        transitionDuration={{ enter: MENU_ENTER_MS, exit: MENU_EXIT_MS }}
        slots={{ transition: Fade }}
        slotProps={{
          transition: { easing: MENU_EASING },
          paper: {
            sx: {
              animation: `${menuEnter} ${MENU_ENTER_MS}ms ${MENU_EASING}`,
              width: MENU_WIDTH,
              mt: '4px',
              padding: '6px',
              border: '1px solid #E3E7EF',
              borderRadius: '12px',
              backgroundImage: 'none',
              boxShadow: '0 12px 32px rgba(20, 24, 40, 0.14)',
            },
          },
        }}
        MenuListProps={{ disablePadding: true }}
      >
        <MenuItem
          component={RouterLink}
          to='/profile'
          disableRipple
          onClick={close}
          title='Открыть профиль'
          sx={{
            gap: '10px',
            padding: '5px 8px 5px 10px',
            borderRadius: '8px',
            fontFamily: MENU_FONT_FAMILY,
            '&:hover, &.Mui-focusVisible': { bgcolor: '#F5F6FA' },
            '& .user-menu-chevron': {
              flexShrink: 0,
              color: '#9AA0AD',
            },
          }}
        >
          <Box
            component='span'
            sx={{ ...avatarSx, width: 28, height: 28, fontSize: 12 }}
          >
            {initial}
          </Box>
          <Box
            component='span'
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              component='span'
              noWrap
              sx={{
                color: '#1B1F2A',
                fontFamily: MENU_FONT_FAMILY,
                fontSize: 13.5,
                fontWeight: 600,
                lineHeight: '16px',
              }}
            >
              {displayName}
            </Typography>
            <Typography
              component='span'
              noWrap
              sx={{
                color: '#6B7385',
                fontFamily: MENU_FONT_FAMILY,
                fontSize: 12,
                lineHeight: '15px',
              }}
            >
              {user?.email ?? ''}
            </Typography>
          </Box>
          <IconChevronRight className='user-menu-chevron' size={14} />
        </MenuItem>

        {groups.flatMap(group => [
          <Box
            key={`${group.id}-separator`}
            role='separator'
            sx={separatorSx}
          />,
          ...group.items.map(item => {
            const Icon = item.icon;

            return (
              <MenuItem
                key={item.to}
                component={RouterLink}
                to={item.to}
                disableRipple
                onClick={close}
                sx={itemSx}
              >
                <Icon size={ITEM_ICON_SIZE} />
                {item.label}
              </MenuItem>
            );
          }),
        ])}

        <Box role='separator' sx={separatorSx} />
        <MenuItem
          disableRipple
          onClick={() => void handleLogout()}
          sx={logoutItemSx}
        >
          <IconLogout size={ITEM_ICON_SIZE} />
          Выйти
        </MenuItem>
      </Menu>
    </>
  );
};
