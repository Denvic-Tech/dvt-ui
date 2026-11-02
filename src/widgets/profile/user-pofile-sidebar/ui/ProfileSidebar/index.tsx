import * as React from 'react';
import { Skeleton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { getAvailableProfileSectionGroups } from '@/features/profile/user-profile-navigation';

import { useAppSettings } from '@/entities/config/app-settings';
import { normalizeRole } from '@/entities/user';

import type { UserReadSchema } from '@/shared/gatewayClient';
import { getNamespaceIcon } from '@/shared/lib/getNamespaceIcon';

import {
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuItemIcon,
  MenuItemLabel,
  MenuSection,
  SidebarContainer,
} from './styles';

type ProfileSidebarProps = {
  user: UserReadSchema | null;
};

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    namespaces: appSettingsNamespaces,
    definitionsStatus,
    loadDefinitions,
  } = useAppSettings();
  const canAccessAppSettings = normalizeRole(user?.role) === 'superadmin';

  const isSelected = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

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
                  disableRipple
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
              const NamespaceIcon = getNamespaceIcon(namespace.id);

              return (
                <MenuItem
                  key={namespace.id}
                  disableRipple
                  selected={selected}
                  onClick={() => navigate(to)}
                >
                  <MenuItemIcon>
                    <NamespaceIcon />
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
    </SidebarContainer>
  );
};
