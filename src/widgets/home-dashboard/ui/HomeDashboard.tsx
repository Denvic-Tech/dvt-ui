import * as React from 'react';
import { Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAlert } from '@/app/notifications';

import { CreateProjectModal, useProjects } from '@/entities/project/projects';
import { normalizeRole, useCurrentUser } from '@/entities/user';

import type {
  ProjectCreateSchema,
  ProjectReadSchema,
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { Page } from '@/shared/ui/primitives';

import { HomeBackground } from './components/HomeBackground.tsx';
import { HomeConnectionsSection } from './components/HomeConnectionsSection.tsx';
import { HomeHero } from './components/HomeHero.tsx';
import { HomeLoadErrorAlert } from './components/HomeLoadErrorAlert.tsx';
import { HomeSectionsGrid } from './components/HomeSectionsGrid.tsx';
import { RecentProjectsSection } from './components/RecentProjectsSection.tsx';
import { buildHomeSections } from './config/homeSections.tsx';
import { loadRecentProjects } from './lib/recent-projects.ts';
import { getProjectsRoute } from './lib/routes.ts';
import { getUserDisplayName } from './lib/user.ts';
import { appearSx } from './styles/animations.ts';

export const HomeDashboard = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const { createNewProject } = useProjects();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isCreatingProject, setIsCreatingProject] = React.useState(false);
  const [recentProjects, setRecentProjects] = React.useState<
    ProjectReadSchema[]
  >([]);
  const [recentProjectsError, setRecentProjectsError] =
    React.useState<unknown>(null);
  const [recentProjectsLoading, setRecentProjectsLoading] =
    React.useState(true);

  const currentUserRole = normalizeRole(currentUser?.role);
  const isSuperadmin = currentUserRole === 'superadmin';
  const isAdmin = currentUserRole === 'admin' || isSuperadmin;
  const canCreateProject = true;

  React.useEffect(() => {
    let cancelled = false;

    setRecentProjectsLoading(true);
    setRecentProjectsError(null);

    loadRecentProjects()
      .then(projects => {
        if (!cancelled) {
          setRecentProjects(projects);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setRecentProjectsError(error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRecentProjectsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!recentProjectsError) {
      return;
    }

    showAlert({
      message:
        (isApiError(recentProjectsError)
          ? recentProjectsError.payload.message
          : recentProjectsError instanceof Error
            ? recentProjectsError.message
            : undefined) ?? 'Не удалось загрузить последние проекты.',
      type: 'error',
    });
  }, [recentProjectsError, showAlert]);

  React.useEffect(() => {
    document.documentElement.dataset['route'] = 'home';
    document.body.dataset['route'] = 'home';

    return () => {
      if (document.documentElement.dataset['route'] === 'home') {
        delete document.documentElement.dataset['route'];
      }
      if (document.body.dataset['route'] === 'home') {
        delete document.body.dataset['route'];
      }
    };
  }, []);

  const greetingDate = React.useMemo(() => new Date(), []);
  const targetProjectsUrl = React.useMemo(
    () => getProjectsRoute(isSuperadmin, null),
    [isSuperadmin]
  );
  const displayName = getUserDisplayName(
    currentUser?.user_name,
    currentUser?.email
  );

  const handleOpenCreateModal = React.useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateProject = React.useCallback(
    async (projectData: ProjectCreateSchema) => {
      setIsCreatingProject(true);

      try {
        const createdProject = await createNewProject(projectData).unwrap();
        setIsCreateModalOpen(false);
        navigate(`/project-editor/${createdProject.id}`);
      } catch (error) {
        showAlert({
          message:
            (isApiError(error) ? error.payload.message : undefined) ??
            'Не удалось создать проект.',
          type: 'error',
        });
      } finally {
        setIsCreatingProject(false);
      }
    },
    [createNewProject, navigate, showAlert]
  );

  const sections = React.useMemo(
    () =>
      buildHomeSections({
        canCreateProject,
        isAdmin,
        isSuperadmin,
        onCreateProject: handleOpenCreateModal,
        recentProjects,
        targetProjectsUrl,
      }),
    [
      canCreateProject,
      handleOpenCreateModal,
      isAdmin,
      isSuperadmin,
      recentProjects,
      targetProjectsUrl,
    ]
  );

  return (
    <>
      <HomeBackground />
      <Page
        size='narrow'
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '900px',
          mx: 'auto',
          px: { xs: 2, md: 4 },
          pb: 6,
          pt: { xs: 2.5, md: 3 },
        }}
      >
        <Stack spacing={1}>
          <Stack spacing={2} sx={appearSx(0)}>
            <HomeHero
              displayName={displayName}
              greetingDate={greetingDate}
              userLoading={userLoading}
            />
          </Stack>

          <Stack spacing={0} sx={{ ...appearSx(60), pt: 1.5, pb: 3.25 }}>
            <RecentProjectsSection
              canCreateProject={canCreateProject}
              onCreateProject={handleOpenCreateModal}
              recentProjects={recentProjects}
              recentProjectsLoading={recentProjectsLoading}
              targetProjectsUrl={targetProjectsUrl}
            />
          </Stack>

          <Stack spacing={0} sx={{ ...appearSx(80), pb: 3.25 }}>
            <HomeConnectionsSection />
          </Stack>

          <Box sx={appearSx(100)}>
            <HomeLoadErrorAlert
              visible={Boolean(recentProjectsError) && !recentProjectsLoading}
            />
          </Box>

          <Stack spacing={1.5} sx={appearSx(140)}>
            <HomeSectionsGrid sections={sections} />
          </Stack>
        </Stack>
      </Page>

      <CreateProjectModal
        open={isCreateModalOpen}
        loading={isCreatingProject}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </>
  );
};
