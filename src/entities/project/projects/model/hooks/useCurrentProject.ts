import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { useProjects } from './useProjects.ts';

// TODO: Maybe move to features

type ProjectAccessState = 'idle' | 'loading' | 'ready' | 'unavailable';

export const useCurrentProject = () => {
  const { projectID } = useParams<{ projectID: string }>();

  const {
    selectedProject,
    projects,
    loadProject,
    selectProject,
    updateProjectSettings,
    loading,
  } = useProjects();
  const requestedProjectIdRef = useRef<string | null>(null);
  const [accessState, setAccessState] = useState<ProjectAccessState>('idle');
  const [projectAccessError, setProjectAccessError] =
    useState<ApiErrorPayload | null>(null);

  const currentProject = useMemo(() => {
    if (!projectID) {
      return null;
    }

    if (selectedProject?.id === projectID) {
      return selectedProject;
    }

    if (projects && projects.length > 0) {
      return projects.find(p => p.id === projectID) || null;
    }

    return null;
  }, [projectID, projects, selectedProject]);

  useEffect(() => {
    if (!projectID) {
      requestedProjectIdRef.current = null;
      setAccessState('idle');
      setProjectAccessError(null);
      return;
    }

    if (currentProject) {
      requestedProjectIdRef.current = projectID;
      setAccessState('ready');
      setProjectAccessError(null);
      return;
    }

    if (loading) {
      setAccessState(previousState =>
        previousState === 'ready' ? previousState : 'loading'
      );
      return;
    }

    const alreadyRequested = requestedProjectIdRef.current === projectID;
    if (!currentProject && !alreadyRequested) {
      requestedProjectIdRef.current = projectID;
      setAccessState('loading');
      setProjectAccessError(null);

      void loadProject(projectID)
        .unwrap()
        .catch(error => {
          if (requestedProjectIdRef.current !== projectID) {
            return;
          }

          setProjectAccessError(
            ensureApiErrorPayload(error, 'Не удалось загрузить проект')
          );
          setAccessState('unavailable');
        });
    }
  }, [currentProject, loadProject, loading, projectID]);

  useEffect(() => {
    if (!currentProject) {
      return;
    }

    if (!selectedProject || selectedProject.id !== currentProject.id) {
      selectProject(currentProject);
    }
  }, [currentProject, selectProject, selectedProject]);

  return {
    currentProject,
    updateProjectSettings,
    isProjectLoading: accessState === 'loading',
    isProjectUnavailable: accessState === 'unavailable',
    projectAccessError,
  };
};
