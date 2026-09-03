import * as React from 'react';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Skeleton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { getAvailableProfileSectionGroups } from '@/features/profile/user-profile-navigation';

import { useAppSettings } from '@/entities/config/app-settings';
import { getRoleLabel, normalizeRole } from '@/entities/user';

import type { UserReadSchema } from '@/shared/gatewayClient';

import { useAuth } from '@/contexts/AuthContext.tsx';

import {
  LogoutButton,
  LogoutLabel,
  LogoutSection,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuItemIcon,
  MenuItemLabel,
  MenuSection,
  RoleIndicator,
  RoleText,
  SidebarContainer,
  UserAvatar,
  UserDetails,
  UserEmail,
  UserInfo,
  UserRole,
  UserSection,
} from './styles';

type ProfileSidebarProps = {
  user: UserReadSchema | null;
  loading?: boolean;
};

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  user,
  loading = false,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showSkeleton = loading && user == null;
  const {
    namespaces: appSettingsNamespaces,
    definitionsStatus,
    loadDefinitions,
  } = useAppSettings();
  const canAccessAppSettings = normalizeRole(user?.role) === 'superadmin';

  const isSelected = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  const handleLogout = async () => {
    await logout();
    navigate('/sign_in');
  };

  const initial = (
    user?.user_name?.trim()?.[0] ??
    user?.email?.trim()?.[0] ??
    'U'
  ).toUpperCase();

  const roleLabel = React.useMemo(() => getRoleLabel(user?.role), [user?.role]);
  const groups = React.useMemo(
    () => getAvailableProfileSectionGroups(user?.role),
    [user?.role]
  );

  React.useEffect(() => {
    if (canAccessAppSettings && definitionsStatus === 'idle') {
      void loadDefinitions();
    }
  }, [canAccessAppSettings, definitionsStatus, loadDefinitions]);

  return (
    <SidebarContainer>
      <UserSection>
        <UserInfo>
          {showSkeleton ? (
            <Skeleton
              variant='rounded'
              width={40}
              height={40}
              sx={{ borderRadius: '10px', flexShrink: 0 }}
            />
          ) : (
            <UserAvatar>{initial}</UserAvatar>
          )}

          <UserDetails>
            {showSkeleton ? (
              <React.Fragment>
                <Skeleton variant='text' width={160} height={20} />
                <Skeleton variant='text' width={88} height={16} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <UserEmail>{user?.email ?? ''}</UserEmail>
                <UserRole>
                  <RoleIndicator />
                  <RoleText>{roleLabel}</RoleText>
                </UserRole>
              </React.Fragment>
            )}
          </UserDetails>
        </UserInfo>
      </UserSection>

      <MenuSection>
        {groups.map(group => (
          <MenuGroup key={group.id}>
            <MenuGroupLabel>{group.label}</MenuGroupLabel>
            {group.items.map(item => {
              const selected = isSelected(item.to);
              const Icon = item.icon;

              return (
                <MenuItem
                  key={item.to}
                  selected={selected}
                  onClick={() => navigate(item.to)}
                >
                  <MenuItemIcon>
                    <Icon />
                  </MenuItemIcon>
                  <MenuItemLabel primary={item.label} />
                </MenuItem>
              );
            })}
          </MenuGroup>
        ))}

        {canAccessAppSettings ? (
          <MenuGroup>
            <MenuGroupLabel>Настройки</MenuGroupLabel>
            {definitionsStatus === 'loading' &&
            appSettingsNamespaces.length === 0 ? (
              <React.Fragment>
                <Skeleton
                  variant='rounded'
                  height={34}
                  sx={{ mb: 0.25, borderRadius: '10px' }}
                />
                <Skeleton
                  variant='rounded'
                  height={34}
                  sx={{ borderRadius: '10px' }}
                />
              </React.Fragment>
            ) : null}
            {appSettingsNamespaces.map(namespace => {
              const to = `/profile/app-settings/${encodeURIComponent(
                namespace.id
              )}`;
              const selected = isSelected(to);

              return (
                <MenuItem
                  key={namespace.id}
                  selected={selected}
                  onClick={() => navigate(to)}
                >
                  <MenuItemIcon>
                    <SettingsOutlinedIcon />
                  </MenuItemIcon>
                  <MenuItemLabel
                    primary={
                      namespace.label.toLocaleLowerCase() === 'dcc'
                        ? 'DCC'
                        : namespace.label
                    }
                  />
                </MenuItem>
              );
            })}
          </MenuGroup>
        ) : null}
      </MenuSection>

      <LogoutSection>
        <LogoutButton onClick={handleLogout}>
          <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='1.5'
              d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
            />
          </svg>
          <LogoutLabel>Выйти</LogoutLabel>
        </LogoutButton>
      </LogoutSection>
    </SidebarContainer>
  );
};
