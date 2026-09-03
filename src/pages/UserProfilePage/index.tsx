import * as React from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { AdminOrganizationsPanel } from '@/widgets/profile/admin-organizations-panel';
import { AdminUsersPanel } from '@/widgets/profile/admin-users-panel';
import { ApiKeysPanel } from '@/widgets/profile/api-keys-panel';
import { ExtensionsPanel } from '@/widgets/profile/extensions-panel';
import { PreferencesPanel } from '@/widgets/profile/preferences-panel';
import { SchedulePanel } from '@/widgets/profile/schedule-panel';
import { ServicesStatusPanel } from '@/widgets/profile/services-status-panel';
import { SystemUpdatePanel } from '@/widgets/profile/system-update-panel';
import { ProfileSidebar } from '@/widgets/profile/user-pofile-sidebar';

import {
  canAccessProfilePath,
  PROFILE_SECTION_PATHS,
} from '@/features/profile/user-profile-navigation';

import {
  AppSettingsNamespacePanel,
  useAppSettings,
} from '@/entities/config/app-settings';
import { useCurrentUser } from '@/entities/user';

const ContentShell: React.FC<{
  children: React.ReactNode;
  disableOuterScroll?: boolean;
}> = ({ children, disableOuterScroll = false }) => (
  <Box
    component='main'
    sx={{
      minWidth: 0,
      minHeight: 0,
      height: '100%',
      overflow: disableOuterScroll ? 'hidden' : 'auto',
    }}
  >
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
      }}
    >
      {children}
    </Box>
  </Box>
);

const AdminOnlyRoute: React.FC<{
  allowed: boolean;
  loading: boolean;
  children: React.ReactNode;
}> = ({ allowed, loading, children }) => {
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!allowed) {
    return <Navigate to='/profile/preferences' replace />;
  }

  return <>{children}</>;
};

const AppSettingsRoute: React.FC = () => {
  const { namespaceId } = useParams();
  const { namespaces, definitionsStatus, definitionsError, loadDefinitions } =
    useAppSettings();

  React.useEffect(() => {
    if (!namespaceId && definitionsStatus === 'idle') {
      void loadDefinitions();
    }
  }, [definitionsStatus, loadDefinitions, namespaceId]);

  if (!namespaceId) {
    if (definitionsStatus === 'idle' || definitionsStatus === 'loading') {
      return (
        <Box
          sx={{
            minHeight: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (definitionsError) {
      return <Alert severity='error'>{definitionsError.message}</Alert>;
    }

    const firstNamespace = namespaces[0];

    if (firstNamespace) {
      return (
        <Navigate
          to={`/profile/app-settings/${encodeURIComponent(firstNamespace.id)}`}
          replace
        />
      );
    }
  }

  return <AppSettingsNamespacePanel namespaceId={namespaceId ?? null} />;
};

export default function ProfilePage() {
  const { user: currentUser, loading: currentUserLoading } = useCurrentUser();
  const canAccessAdminPanel = canAccessProfilePath(
    currentUser?.role,
    PROFILE_SECTION_PATHS.admin
  );
  const canAccessServicesPanel = canAccessProfilePath(
    currentUser?.role,
    PROFILE_SECTION_PATHS.services
  );
  const canAccessOrganizationsPanel = canAccessProfilePath(
    currentUser?.role,
    PROFILE_SECTION_PATHS.organizations
  );
  const canAccessAppSettingsPanel = canAccessProfilePath(
    currentUser?.role,
    PROFILE_SECTION_PATHS.appSettings
  );
  const canAccessUpdatePanel = canAccessProfilePath(
    currentUser?.role,
    PROFILE_SECTION_PATHS.update
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' },
        gridTemplateRows: 'minmax(0, 1fr)',
        gap: 2,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3, md: 0 },
        py: { xs: 2, sm: 3, md: 0 },
      }}
    >
      <Box
        component='aside'
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: 0,
          alignSelf: 'start',
          height: '100%',
          minHeight: 0,
          backgroundColor: 'transparent',
        }}
      >
        <ProfileSidebar user={currentUser} loading={currentUserLoading} />
      </Box>

      <ContentShell>
        <Routes>
          <Route index element={<Navigate to='preferences' replace />} />
          <Route path='schedule' element={<SchedulePanel />} />
          <Route path='preferences' element={<PreferencesPanel />} />
          <Route path='extensions' element={<ExtensionsPanel />} />
          <Route path='api-keys' element={<ApiKeysPanel />} />
          <Route
            path='admin'
            element={
              <AdminOnlyRoute
                allowed={canAccessAdminPanel}
                loading={currentUserLoading}
              >
                <AdminUsersPanel currentUser={currentUser} />
              </AdminOnlyRoute>
            }
          />
          <Route
            path='organizations'
            element={
              <AdminOnlyRoute
                allowed={canAccessOrganizationsPanel}
                loading={currentUserLoading}
              >
                <AdminOrganizationsPanel />
              </AdminOnlyRoute>
            }
          />
          <Route
            path='app-config'
            element={<Navigate to='/profile/app-settings' replace />}
          />
          <Route
            path='app-settings'
            element={
              <AdminOnlyRoute
                allowed={canAccessAppSettingsPanel}
                loading={currentUserLoading}
              >
                <AppSettingsRoute />
              </AdminOnlyRoute>
            }
          />
          <Route
            path='app-settings/:namespaceId'
            element={
              <AdminOnlyRoute
                allowed={canAccessAppSettingsPanel}
                loading={currentUserLoading}
              >
                <AppSettingsRoute />
              </AdminOnlyRoute>
            }
          />
          <Route
            path='services'
            element={
              <AdminOnlyRoute
                allowed={canAccessServicesPanel}
                loading={currentUserLoading}
              >
                <ServicesStatusPanel />
              </AdminOnlyRoute>
            }
          />
          <Route
            path='update'
            element={
              <AdminOnlyRoute
                allowed={canAccessUpdatePanel}
                loading={currentUserLoading}
              >
                <SystemUpdatePanel currentUser={currentUser} />
              </AdminOnlyRoute>
            }
          />
          <Route path='*' element={<Navigate to='preferences' replace />} />
        </Routes>
      </ContentShell>
    </Box>
  );
}
