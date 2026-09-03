import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { PageTitle } from '@/app/router/ui/PageTitle.tsx';

import { useGraphUnsavedChangesGuard } from '@/features/project-editor/sync-graph';

import { useCurrentProject } from '@/entities/project/projects';

import { ProjectEditorPage } from './ProjectEditorPage.tsx';

const resolveProjectAccessCopy = (status?: number) => {
  if (status === 403) {
    return {
      title: 'Нет доступа к проекту',
      description:
        'У вас нет доступа к этому проекту. Редактирование недоступно.',
    };
  }

  if (status === 404) {
    return {
      title: 'Проект не найден',
      description:
        'Проект не существует или был удалён. Редактирование недоступно.',
    };
  }

  return {
    title: 'Проект недоступен',
    description:
      'Не удалось открыть проект. Редактирование недоступно до устранения проблемы.',
  };
};

export const ProjectEditorRoute = () => {
  const navigate = useNavigate();
  useGraphUnsavedChangesGuard();
  const {
    currentProject,
    isProjectLoading,
    isProjectUnavailable,
    projectAccessError,
  } = useCurrentProject();

  const pageTitle = currentProject?.name ?? 'Project editor';
  const isResolvingProject = !currentProject && !isProjectUnavailable;

  if (isResolvingProject || (isProjectLoading && !currentProject)) {
    return (
      <PageTitle title={pageTitle}>
        <Box
          sx={{
            minHeight: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </PageTitle>
    );
  }

  if (isProjectUnavailable && !currentProject) {
    const copy = resolveProjectAccessCopy(projectAccessError?.status);

    return (
      <PageTitle title={pageTitle}>
        <Dialog
          open
          fullWidth
          maxWidth='xs'
          disableEscapeKeyDown
          aria-labelledby='project-access-dialog-title'
        >
          <DialogTitle id='project-access-dialog-title'>
            {copy.title}
          </DialogTitle>
          <DialogContent>
            <Typography>{copy.description}</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              variant='contained'
              onClick={() => navigate('/projects', { replace: true })}
            >
              К списку проектов
            </Button>
          </DialogActions>
        </Dialog>
      </PageTitle>
    );
  }

  return (
    <PageTitle title={pageTitle}>
      <ProjectEditorPage />
    </PageTitle>
  );
};
