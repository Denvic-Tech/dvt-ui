import * as React from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';

import { AdminOrganizationsPanel } from '@/widgets/profile/admin-organizations-panel';
import { AdminUsersPanel } from '@/widgets/profile/admin-users-panel';
import { ApiKeysPanel } from '@/widgets/profile/api-keys-panel';
import { ExtensionsPanel } from '@/widgets/profile/extensions-panel';
import { McpPanel } from '@/widgets/profile/mcp-panel';
import { PreferencesPanel } from '@/widgets/profile/preferences-panel';
import { SchedulePanel } from '@/widgets/profile/schedule-panel';
import { ServicesStatusPanel } from '@/widgets/profile/services-status-panel';
import { SystemUpdatePanel } from '@/widgets/profile/system-update-panel';
import { ProfileSidebar } from '@/widgets/profile/user-pofile-sidebar';

import {
  canAccessProfilePath,
  DEFAULT_PROFILE_SECTION_PATH,
  PROFILE_SECTION_PATHS,
  type ProfileNavigationRole,
  resolveProfileEntryPath,
} from '@/features/profile/user-profile-navigation';

import {
  AppSettingsNamespacePanel,
  useAppSettings,
} from '@/entities/config/app-settings';
import { useProfileLastSectionPreference } from '@/entities/ui-preferences';
import { useCurrentUser } from '@/entities/user';

import { PageLayout } from '@/shared/ui/page-layout';
import { getSurfaceShadow } from '@/shared/ui/surface-shadow';

const ContentShell: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <Box
    component='main'
    // The inset belongs to the content box only: the sidebar has its own offsets.
    sx={{
      boxSizing: 'border-box',
      minWidth: 0,
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
      pr: { md: 1.5 },
      py: { md: 1.5 },
    }}
  >
    {children}
  </Box>
);

const RouteLoadingState: React.FC = () => (
  <PageLayout width='fluid'>
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
  </PageLayout>
);

const AdminOnlyRoute: React.FC<{
  allowed: boolean;
  loading: boolean;
  children: React.ReactNode;
}> = ({ allowed, loading, children }) => {
  if (loading) {
    return <RouteLoadingState />;
  }

  if (!allowed) {
    return <Navigate to={DEFAULT_PROFILE_SECTION_PATH} replace />;
  }

  return <>{children}</>;
};

const ProfileEntryRoute: React.FC<{
  role: ProfileNavigationRole;
  loading: boolean;
}> = ({ role, loading }) => {
  const { lastSectionPath } = useProfileLastSectionPreference();

  // Access to the saved tab can only be decided once the role is known.
  if (loading) {
    return <RouteLoadingState />;
  }

  return (
    <Navigate to={resolveProfileEntryPath(role, lastSectionPath)} replace />
  );
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
      return <RouteLoadingState />;
    }

    if (definitionsError) {
      return (
        <PageLayout width='narrow'>
          <Alert severity='error'>{definitionsError.message}</Alert>
        </PageLayout>
      );
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
  const { pathname } = useLocation();
  const { setLastSectionPath } = useProfileLastSectionPreference();

  // Without a loaded user access is unknown, and the redirect to the default
  // tab must not replace the saved one.
  React.useEffect(() => {
    if (currentUser && canAccessProfilePath(currentUser.role, pathname)) {
      setLastSectionPath(pathname);
    }
  }, [currentUser, pathname, setLastSectionPath]);

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
      // The shadow goes separately: a media query key next to responsive values
      // would replace the styles they generate for the same breakpoint.
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '264px minmax(0, 1fr)' },
          gridTemplateRows: 'minmax(0, 1fr)',
          boxSizing: 'border-box',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          bgcolor: { xs: 'background.default', md: 'background.paper' },
          borderRadius: { md: '14px' },
          pl: { xs: 2, sm: 3, md: 0 },
          pr: { xs: 2, sm: 3, md: 0 },
          py: { xs: 2, sm: 3, md: 0 },
        },
        theme => ({
          [theme.breakpoints.up('md')]: { boxShadow: getSurfaceShadow(theme) },
        }),
      ]}
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
        <ProfileSidebar user={currentUser} />
      </Box>

      <ContentShell>
        <Routes>
          <Route
            index
            element={
              <ProfileEntryRoute
                role={currentUser?.role}
                loading={currentUserLoading}
              />
            }
          />
          <Route path='schedule' element={<SchedulePanel />} />
          <Route path='preferences' element={<PreferencesPanel />} />
          <Route path='extensions' element={<ExtensionsPanel />} />
          <Route path='api-keys' element={<ApiKeysPanel />} />
          <Route path='mcp' element={<McpPanel />} />
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
          <Route
            path='*'
            element={<Navigate to={DEFAULT_PROFILE_SECTION_PATH} replace />}
          />
        </Routes>
      </ContentShell>
    </Box>
  );
}
