import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import type {
  ProjectCreateSchema as ProjectCreate,
  ProjectReadSchema as Project,
  ProjectUpdateSchema as ProjectUpdate,
  ProjectVariableBase,
  ProjectVariableCreate,
  ProjectVariableRead,
  ProjectVariableUpdate,
} from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { projectsApi } from '../api/projectsApi';

interface ProjectsState {
  projects: Project[] | null;
  loading: boolean;
  error: ApiErrorPayload | null;
  projectVariablesByProjectId: Record<string, ProjectVariableRead[]>;
  projectVariablesErrorByProjectId: Record<string, ApiErrorPayload | null>;
  projectVariablesStatusByProjectId: Record<
    string,
    'idle' | 'loading' | 'ready' | 'saving' | 'error'
  >;
  selectedProject: Project | null;
}

const initialState: ProjectsState = {
  projects: null,
  loading: false,
  error: null,
  projectVariablesByProjectId: {},
  projectVariablesErrorByProjectId: {},
  projectVariablesStatusByProjectId: {},
  selectedProject: null,
};

const buildProjectVariablesRecord = (
  variables: ProjectVariableRead[]
): Record<string, ProjectVariableBase> =>
  variables.reduce<Record<string, ProjectVariableBase>>((acc, variable) => {
    acc[variable.key] = {
      type: variable.type,
      value: variable.value,
      ...(variable.is_list_type !== undefined
        ? { is_list_type: variable.is_list_type }
        : {}),
    };
    return acc;
  }, {});

const syncProjectVariablesState = (
  state: ProjectsState,
  projectId: string,
  variables: ProjectVariableRead[]
) => {
  state.projectVariablesByProjectId[projectId] = variables;
  state.projectVariablesStatusByProjectId[projectId] = 'ready';
  state.projectVariablesErrorByProjectId[projectId] = null;

  const projectVariablesRecord = buildProjectVariablesRecord(variables);

  if (state.projects) {
    state.projects = state.projects.map(project =>
      project.id === projectId
        ? {
            ...project,
            variables: projectVariablesRecord,
          }
        : project
    );
  }

  if (state.selectedProject?.id === projectId) {
    state.selectedProject = {
      ...state.selectedProject,
      variables: projectVariablesRecord,
    };
  }
};

export const fetchProjects = createAppAsyncThunk<Project[], void>(
  'projects/fetchAll',
  () => projectsApi.getAll()
);

export const fetchProjectById = createAppAsyncThunk<Project, string>(
  'projects/fetchById',
  id => projectsApi.getById(id)
);

export const createProject = createAppAsyncThunk<Project, ProjectCreate>(
  'projects/create',
  data => projectsApi.create(data)
);

export const copyProject = createAppAsyncThunk<
  Project,
  { id: string; data: ProjectUpdate }
>('projects/copy', ({ id, data = {} }) => projectsApi.copy(id, data));

export const deleteProject = createAppAsyncThunk<string, string>(
  'projects/delete',
  async id => {
    await projectsApi.delete(id);
    return id;
  }
);

export const deleteProjectsBatch = createAppAsyncThunk<string[], string[]>(
  'projects/deleteBatch',
  async projectIds => {
    await projectsApi.deleteBatch(projectIds);
    return projectIds;
  }
);

export const updateProject = createAppAsyncThunk<
  Project,
  { id: string; data: ProjectUpdate }
>('projects/update', async ({ id, data }) => {
  return await projectsApi.update(id, data);
});

export const fetchProjectVariables = createAppAsyncThunk<
  { projectId: string; variables: ProjectVariableRead[] },
  string
>('projects/fetchVariables', async projectId => ({
  projectId,
  variables: await projectsApi.getVariables(projectId),
}));

export const setProjectVariables = createAppAsyncThunk<
  { projectId: string; variables: ProjectVariableRead[] },
  { projectId: string; variables: Record<string, ProjectVariableBase> }
>('projects/setVariables', async ({ projectId, variables }) => ({
  projectId,
  variables: await projectsApi.setVariables(projectId, variables),
}));

export const createProjectVariable = createAppAsyncThunk<
  { projectId: string; variable: ProjectVariableRead },
  { projectId: string; variableKey: string; data: ProjectVariableCreate }
>('projects/createVariable', async ({ projectId, variableKey, data }) => ({
  projectId,
  variable: await projectsApi.createVariable(projectId, variableKey, data),
}));

export const updateProjectVariable = createAppAsyncThunk<
  { projectId: string; variable: ProjectVariableRead; variableKey: string },
  { projectId: string; variableKey: string; data: ProjectVariableUpdate }
>('projects/updateVariable', async ({ projectId, variableKey, data }) => ({
  projectId,
  variableKey,
  variable: await projectsApi.updateVariable(projectId, variableKey, data),
}));

export const deleteProjectVariable = createAppAsyncThunk<
  { projectId: string; variableKey: string },
  { projectId: string; variableKey: string }
>('projects/deleteVariable', async ({ projectId, variableKey }) => {
  await projectsApi.deleteVariable(projectId, variableKey);
  return { projectId, variableKey };
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
    clearProjects: state => {
      state.projects = null;
      state.selectedProject = null;
      state.error = null;
      state.loading = false;
      state.projectVariablesByProjectId = {};
      state.projectVariablesErrorByProjectId = {};
      state.projectVariablesStatusByProjectId = {};
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProjects.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.projects = null;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить проекты'
        );
      })
      .addCase(fetchProjectById.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProject = action.payload;
        state.error = null;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить проект'
        );
      })
      .addCase(updateProject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (state.projects) {
          state.projects = state.projects.map(project =>
            project.id === action.payload.id ? action.payload : project
          );
        }

        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось обновить проект'
        );
      })
      .addCase(fetchProjectVariables.pending, (state, action) => {
        state.projectVariablesStatusByProjectId[action.meta.arg] = 'loading';
        state.projectVariablesErrorByProjectId[action.meta.arg] = null;
      })
      .addCase(fetchProjectVariables.fulfilled, (state, action) => {
        syncProjectVariablesState(
          state,
          action.payload.projectId,
          action.payload.variables
        );
      })
      .addCase(fetchProjectVariables.rejected, (state, action) => {
        state.projectVariablesStatusByProjectId[action.meta.arg] = 'error';
        state.projectVariablesErrorByProjectId[action.meta.arg] =
          ensureApiErrorPayload(
            action.payload,
            action.error.message ?? 'Не удалось загрузить переменные проекта'
          );
      })
      .addCase(setProjectVariables.pending, (state, action) => {
        state.projectVariablesStatusByProjectId[action.meta.arg.projectId] =
          'saving';
        state.projectVariablesErrorByProjectId[action.meta.arg.projectId] =
          null;
      })
      .addCase(setProjectVariables.fulfilled, (state, action) => {
        syncProjectVariablesState(
          state,
          action.payload.projectId,
          action.payload.variables
        );
      })
      .addCase(setProjectVariables.rejected, (state, action) => {
        state.projectVariablesStatusByProjectId[action.meta.arg.projectId] =
          'error';
        state.projectVariablesErrorByProjectId[action.meta.arg.projectId] =
          ensureApiErrorPayload(
            action.payload,
            action.error.message ?? 'Не удалось сохранить переменные проекта'
          );
      })
      .addCase(createProjectVariable.pending, (state, action) => {
        state.projectVariablesErrorByProjectId[action.meta.arg.projectId] =
          null;
      })
      .addCase(createProjectVariable.fulfilled, (state, action) => {
        const currentVariables =
          state.projectVariablesByProjectId[action.payload.projectId] ?? [];
        syncProjectVariablesState(state, action.payload.projectId, [
          ...currentVariables.filter(
            variable => variable.key !== action.payload.variable.key
          ),
          action.payload.variable,
        ]);
      })
      .addCase(updateProjectVariable.pending, (state, action) => {
        state.projectVariablesErrorByProjectId[action.meta.arg.projectId] =
          null;
      })
      .addCase(updateProjectVariable.fulfilled, (state, action) => {
        const currentVariables =
          state.projectVariablesByProjectId[action.payload.projectId] ?? [];
        syncProjectVariablesState(
          state,
          action.payload.projectId,
          currentVariables.map(variable =>
            variable.key === action.payload.variableKey
              ? action.payload.variable
              : variable
          )
        );
      })
      .addCase(deleteProjectVariable.pending, (state, action) => {
        state.projectVariablesErrorByProjectId[action.meta.arg.projectId] =
          null;
      })
      .addCase(deleteProjectVariable.fulfilled, (state, action) => {
        const currentVariables =
          state.projectVariablesByProjectId[action.payload.projectId] ?? [];
        syncProjectVariablesState(
          state,
          action.payload.projectId,
          currentVariables.filter(
            variable => variable.key !== action.payload.variableKey
          )
        );
      })
      .addCase(createProject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (!state.projects) {
          state.projects = [action.payload];
        } else {
          state.projects.push(action.payload);
        }
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось создать проект'
        );
      })
      .addCase(copyProject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(copyProject.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (!state.projects) {
          state.projects = [action.payload];
        } else {
          state.projects.push(action.payload);
        }
      })
      .addCase(copyProject.rejected, (state, action) => {
        state.loading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось скопировать проект'
        );
      })
      .addCase(deleteProject.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (state.projects) {
          state.projects = state.projects.filter(
            project => project.id !== action.payload
          );
        }

        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }

        delete state.projectVariablesByProjectId[action.payload];
        delete state.projectVariablesErrorByProjectId[action.payload];
        delete state.projectVariablesStatusByProjectId[action.payload];
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось удалить проект'
        );
      })
      .addCase(deleteProjectsBatch.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProjectsBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const deletedIds = new Set(action.payload);

        if (state.projects) {
          state.projects = state.projects.filter(
            project => !deletedIds.has(project.id)
          );
        }

        if (
          state.selectedProject?.id &&
          deletedIds.has(state.selectedProject.id)
        ) {
          state.selectedProject = null;
        }

        for (const deletedId of deletedIds) {
          delete state.projectVariablesByProjectId[deletedId];
          delete state.projectVariablesErrorByProjectId[deletedId];
          delete state.projectVariablesStatusByProjectId[deletedId];
        }
      })
      .addCase(deleteProjectsBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось удалить проекты'
        );
      });
  },
});

export const projectsReducer = projectsSlice.reducer;

export const projectsActions = projectsSlice.actions;
