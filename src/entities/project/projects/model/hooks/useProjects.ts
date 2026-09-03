import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';

import type {
  ProjectCreateSchema,
  ProjectFolderCreateSchema,
  ProjectFolderUpdateSchema,
  ProjectReadSchema,
  ProjectUpdateSchema,
  ProjectVariableBase,
  ProjectVariableCreate,
  ProjectVariableRead,
  ProjectVariableUpdate,
} from '@/shared/gatewayClient';

import { projectsApi } from '../../api/projectsApi';
import {
  copyProject,
  createProject,
  createProjectVariable,
  deleteProject,
  deleteProjectsBatch,
  deleteProjectVariable,
  fetchProjectById,
  fetchProjects,
  fetchProjectVariables,
  projectsActions,
  setProjectVariables,
  updateProject,
  updateProjectVariable,
} from '../slice';

export const useProjects = () => {
  const dispatch = useAppDispatch();

  const {
    projects,
    loading,
    error,
    selectedProject,
    projectVariablesByProjectId,
    projectVariablesErrorByProjectId,
    projectVariablesStatusByProjectId,
  } = useAppSelector(state => state.projects);

  const loadProjects = useCallback(() => {
    return dispatch(fetchProjects());
  }, [dispatch]);

  const loadProject = useCallback(
    (id: string) => {
      return dispatch(fetchProjectById(id));
    },
    [dispatch]
  );

  const createNewProject = useCallback(
    (data: ProjectCreateSchema) => {
      return dispatch(createProject(data));
    },
    [dispatch]
  );

  const removeProject = useCallback(
    (id: string) => {
      return dispatch(deleteProject(id));
    },
    [dispatch]
  );

  const removeProjects = useCallback(
    (ids: string[]) => {
      return dispatch(deleteProjectsBatch(ids));
    },
    [dispatch]
  );

  const duplicateProject = useCallback(
    (id: string, data: ProjectUpdateSchema = {}) => {
      return dispatch(copyProject({ id, data }));
    },
    [dispatch]
  );

  const updateProjectName = useCallback(
    (id: string, newName: string) => {
      return dispatch(updateProject({ id, data: { name: newName } }));
    },
    [dispatch]
  );

  const moveProjectToFolder = useCallback(
    (id: string, folderId: string | null) => {
      return dispatch(updateProject({ id, data: { folder_id: folderId } }));
    },
    [dispatch]
  );

  const createFolder = useCallback((data: ProjectFolderCreateSchema) => {
    return projectsApi.createFolder(data);
  }, []);

  const updateFolder = useCallback(
    (id: string, data: ProjectFolderUpdateSchema) => {
      return projectsApi.updateFolder(id, data);
    },
    []
  );

  const removeFolder = useCallback((id: string) => {
    return projectsApi.deleteFolder(id);
  }, []);

  const updateProjectSettings = useCallback(
    (
      id: string,
      name: string,
      store_enabled: boolean,
      ttl_time: number,
      workers_count: number
    ) => {
      return dispatch(
        updateProject({
          id,
          data: {
            name: name,
            store_enabled: store_enabled,
            ttl_time: ttl_time,
            workers_count: workers_count,
          },
        })
      );
    },
    [dispatch]
  );

  const loadProjectVariables = useCallback(
    (projectId: string) => {
      return dispatch(fetchProjectVariables(projectId));
    },
    [dispatch]
  );

  const saveProjectVariables = useCallback(
    (projectId: string, variables: Record<string, ProjectVariableBase>) => {
      return dispatch(setProjectVariables({ projectId, variables }));
    },
    [dispatch]
  );

  const createProjectVariableEntry = useCallback(
    async (
      projectId: string,
      variableKey: string,
      data: ProjectVariableCreate
    ): Promise<ProjectVariableRead> => {
      const result = await dispatch(
        createProjectVariable({ projectId, variableKey, data })
      ).unwrap();

      return result.variable;
    },
    [dispatch]
  );

  const updateProjectVariableEntry = useCallback(
    async (
      projectId: string,
      variableKey: string,
      data: ProjectVariableUpdate
    ): Promise<ProjectVariableRead> => {
      const result = await dispatch(
        updateProjectVariable({ projectId, variableKey, data })
      ).unwrap();

      return result.variable;
    },
    [dispatch]
  );

  const deleteProjectVariableEntry = useCallback(
    (
      projectId: string,
      variableKey: string
    ): Promise<{ projectId: string; variableKey: string }> => {
      return dispatch(
        deleteProjectVariable({ projectId, variableKey })
      ).unwrap();
    },
    [dispatch]
  );

  const selectProject = useCallback(
    (project: ProjectReadSchema) => {
      dispatch(projectsActions.setSelectedProject(project));
    },
    [dispatch]
  );

  const clearSelectedProject = useCallback(() => {
    dispatch(projectsActions.setSelectedProject(null));
  }, [dispatch]);

  return {
    projects,
    loading,
    error,
    projectVariablesByProjectId,
    projectVariablesErrorByProjectId,
    projectVariablesStatusByProjectId,
    selectedProject,
    loadProjects,
    loadProject,
    loadProjectVariables,
    createNewProject,
    createProjectVariable: createProjectVariableEntry,
    removeProject,
    removeProjects,
    deleteProjectVariable: deleteProjectVariableEntry,
    duplicateProject,
    selectProject,
    saveProjectVariables,
    updateProjectVariable: updateProjectVariableEntry,
    updateProjectName,
    moveProjectToFolder,
    createFolder,
    updateFolder,
    removeFolder,
    updateProjectSettings,
    clearSelectedProject,
  };
};
