import * as React from 'react';
import { Box, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAlert } from '@/app/notifications';

import { CreateProjectModal, useProjects } from '@/entities/project/projects';
import { useHomeSectionUsesPreference } from '@/entities/ui-preferences';
import { normalizeRole, useCurrentUser } from '@/entities/user';

import type { ProjectCreateSchema } from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';

import type { HomeProject } from '../model/types';
import { useFavoriteProjects } from '../model/useFavoriteProjects';
import { useHomeProjects } from '../model/useHomeProjects';
import { useScheduledProjects } from '../model/useScheduledProjects';

import { HomeHeader } from './components/HomeHeader';
import { HomeSectionsPanel } from './components/HomeSectionsPanel';
import { RecentProjectsPanel } from './components/RecentProjectsPanel';
import {
  getHomeSections,
  type HomeSection,
  rankHomeSections,
} from './config/sections';
import { HomeWidgetsSection } from './home-widgets/HomeWidgetsSection';
import { getUserDisplayName } from './lib/user';
import { getHomeCssVars, hc, homeSectionTitleSx } from './styles/tokens';

export const HomeDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const { createNewProject } = useProjects();
  const { sectionUses, registerSectionUse } = useHomeSectionUsesPreference();
  const {
    error: projectsError,
    loading: projectsLoading,
    projects,
    reload: reloadProjects,
  } = useHomeProjects();
  const favoriteProjects = useFavoriteProjects();
  const { toggleFavorite } = favoriteProjects;

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isCreatingProject, setIsCreatingProject] = React.useState(false);

  const role = normalizeRole(currentUser?.role);
  // The scheduler route is admin+; wait for the real role before asking.
  const scheduledProjects = useScheduledProjects(
    !userLoading && (role === 'admin' || role === 'superadmin')
  );
  const displayName = getUserDisplayName(
    currentUser?.user_name,
    currentUser?.email
  );

  const sections = React.useMemo(() => getHomeSections(role), [role]);
  const rankedSections = React.useMemo(
    () => rankHomeSections(sections, sectionUses),
    [sectionUses, sections]
  );

  const recentColumnRef = React.useRef<HTMLDivElement>(null);
  const recentExpandedRef = React.useRef(false);
  const [recentColumnHeight, setRecentColumnHeight] = React.useState<
    number | null
  >(null);

  // The sections card mirrors the collapsed projects card height, so
  // expanding the projects list does not stretch the sidebar.
  React.useLayoutEffect(() => {
    const element = recentColumnRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      if (!recentExpandedRef.current) {
        setRecentColumnHeight(element.offsetHeight);
      }
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

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

  const handlePickSection = React.useCallback(
    (section: HomeSection) => registerSectionUse(section.id),
    [registerSectionUse]
  );

  const handleToggleFavorite = React.useCallback(
    (project: HomeProject) => {
      toggleFavorite(project).catch((error: unknown) => {
        showAlert({
          message:
            (isApiError(error) ? error.payload.message : undefined) ??
            'Не удалось обновить избранное.',
          type: 'error',
        });
      });
    },
    [showAlert, toggleFavorite]
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

  return (
    <Box
      sx={{
        ...getHomeCssVars(theme.palette.mode),
        minHeight: '100%',
        backgroundColor: hc.bg,
        color: hc.ink,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          maxWidth: 1120,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          pt: '22px',
          pb: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
        }}
      >
        <HomeHeader
          displayName={displayName}
          onPickSection={handlePickSection}
          recentProjects={projects}
          sections={sections}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'minmax(0, 1fr) 248px',
            },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <Box ref={recentColumnRef} sx={{ alignSelf: 'start', minWidth: 0 }}>
            <Box component='h2' sx={{ ...homeSectionTitleSx, mb: 1.25 }}>
              Продолжить работу
            </Box>
            <RecentProjectsPanel
              favorites={favoriteProjects}
              error={Boolean(projectsError)}
              loading={projectsLoading}
              onCreateProject={handleOpenCreateModal}
              onExpandedChange={expanded => {
                recentExpandedRef.current = expanded;
              }}
              onRetry={reloadProjects}
              onToggleFavorite={handleToggleFavorite}
              projects={projects}
              scheduled={scheduledProjects}
            />
          </Box>

          <HomeSectionsPanel
            height={recentColumnHeight}
            onPick={handlePickSection}
            rankedSections={rankedSections}
            sections={sections}
          />
        </Box>

        <HomeWidgetsSection role={userLoading ? undefined : role} />
      </Box>

      <CreateProjectModal
        open={isCreateModalOpen}
        loading={isCreatingProject}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </Box>
  );
};
