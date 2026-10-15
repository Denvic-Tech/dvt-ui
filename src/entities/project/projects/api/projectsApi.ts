import type {
  CommonResponse,
  PipelineExecutionMode,
  ProjectCreateSchema as ProjectCreate,
  ProjectFolderCreateSchema,
  ProjectFolderReadSchema,
  ProjectFolderUpdateSchema,
  ProjectItemsPageSchema,
  ProjectReadSchema as Project,
  ProjectsDeleteSchema,
  ProjectSearchPageSchema,
  ProjectUpdateSchema as ProjectUpdate,
  ProjectVariableBase,
  ProjectVariableCreate,
  ProjectVariableRead,
  ProjectVariableUpdate,
  TaskResponse,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import { ApiError } from '@/shared/lib/errors';

export const projectsApi = {
  async getItems({
    folderId,
    organizationId,
    limit,
    offset,
    sortBy,
    includeLastRuns = true,
    silent,
  }: {
    folderId?: string | null;
    organizationId?: string | null;
    limit?: number;
    offset?: number;
    sortBy?: 'default' | 'updated_at';
    includeLastRuns?: boolean;
    silent?: boolean;
  }): Promise<ProjectItemsPageSchema> {
    const response = await client.projects.items.get(
      {
        query: {
          ...(folderId ? { folder_id: folderId } : {}),
          ...(organizationId ? { organization_id: organizationId } : {}),
          ...(limit != null ? { limit } : {}),
          ...(offset != null ? { offset } : {}),
          ...(sortBy ? { sort_by: sortBy } : {}),
          include_last_runs: includeLastRuns,
        },
      },
      silent ? { silent } : undefined
    );

    return response.data;
  },

  async search({
    name,
    folderId,
    organizationId,
    itemType = 'all',
    limit,
    offset,
    sortBy,
    sortOrder,
    includeLastRuns = false,
    silent,
  }: {
    name: string;
    folderId?: string | null;
    organizationId?: string | null;
    itemType?: 'all' | 'folder' | 'project';
    limit?: number;
    offset?: number;
    sortBy?: 'default' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
    includeLastRuns?: boolean;
    silent?: boolean;
  }): Promise<ProjectSearchPageSchema> {
    const response = await client.projects.search.get(
      {
        query: {
          name: name.trim(),
          item_type: itemType,
          ...(folderId ? { folder_id: folderId } : {}),
          ...(organizationId ? { organization_id: organizationId } : {}),
          ...(limit != null ? { limit } : {}),
          ...(offset != null ? { offset } : {}),
          ...(sortBy ? { sort_by: sortBy } : {}),
          ...(sortOrder ? { sort_order: sortOrder } : {}),
          include_last_runs: includeLastRuns,
        },
      },
      silent ? { silent } : undefined
    );

    return response.data;
  },

  async getAll({
    sortBy,
    sortOrder,
    limit,
    silent,
  }: {
    sortBy?: 'default' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
    /** Server-side cap (≥ 1); omitted returns every project. */
    limit?: number;
    silent?: boolean;
  } = {}) {
    const response = await client.projects.get(
      {
        query: {
          ...(sortBy ? { sort_by: sortBy } : {}),
          ...(sortOrder ? { sort_order: sortOrder } : {}),
          ...(limit != null ? { limit } : {}),
        },
      },
      silent ? { silent } : undefined
    );
    return response.data;
  },

  /** Projects starred by the current user. */
  async getFavorites({ silent }: { silent?: boolean } = {}): Promise<
    Project[]
  > {
    // The generated request validator rejects the empty request envelope for
    // parameterless GETs (same workaround as the scheduler list).
    const response = await client.projects.favorites.get(
      {},
      { requestValidator: async data => data, ...(silent ? { silent } : {}) }
    );

    return response.data;
  },

  async addFavorite(
    id: string,
    { silent }: { silent?: boolean } = {}
  ): Promise<CommonResponse> {
    const response = await client.projects
      .projectId(id)
      .favorite.put(undefined, silent ? { silent } : undefined);
    const result = response.data;

    if (!result.success) {
      throw new ApiError({
        code: 'PROJECTS.FAVORITE_ADD_FAILED',
        message: result.message ?? 'Не удалось добавить проект в избранное.',
        meta: { id },
      });
    }

    return result;
  },

  async removeFavorite(
    id: string,
    { silent }: { silent?: boolean } = {}
  ): Promise<CommonResponse> {
    const response = await client.projects
      .projectId(id)
      .favorite.delete(undefined, silent ? { silent } : undefined);
    const result = response.data;

    if (!result.success) {
      throw new ApiError({
        code: 'PROJECTS.FAVORITE_REMOVE_FAILED',
        message: result.message ?? 'Не удалось убрать проект из избранного.',
        meta: { id },
      });
    }

    return result;
  },

  async getById(id: string) {
    const response = await client.projects.projectId(id).get();
    return response.data;
  },

  async create(data: ProjectCreate): Promise<Project> {
    const response = await client.projects.post({
      body: data,
    });

    return response.data;
  },

  async delete(id: string): Promise<CommonResponse> {
    const response = await client.projects.projectId(id).delete();
    const result = response.data;

    if (!result.success) {
      throw new ApiError({
        code: 'PROJECTS.DELETE_FAILED',
        message: result.message ?? 'Не удалось удалить проект.',
        meta: { id },
      });
    }

    return result;
  },

  async deleteBatch(
    projectIds: ProjectsDeleteSchema['project_ids']
  ): Promise<CommonResponse> {
    const response = await client.projects.batch.delete({
      body: {
        project_ids: projectIds,
      },
    });
    const result = response.data;

    if (!result.success) {
      throw new ApiError({
        code: 'PROJECTS.BATCH_DELETE_FAILED',
        message: result.message ?? 'Не удалось удалить проекты.',
        meta: { projectIds },
      });
    }

    return result;
  },

  async update(id: string, data: ProjectUpdate): Promise<Project> {
    const response = await client.projects.projectId(id).patch({
      body: data,
    });

    return response.data;
  },

  async createFolder(
    data: ProjectFolderCreateSchema
  ): Promise<ProjectFolderReadSchema> {
    const response = await client.projects.folders.post({
      body: data,
    });

    return response.data;
  },

  async updateFolder(
    id: string,
    data: ProjectFolderUpdateSchema
  ): Promise<ProjectFolderReadSchema> {
    const response = await client.projects.folders.folderId(id).patch({
      body: data,
    });

    return response.data;
  },

  async deleteFolder(id: string): Promise<CommonResponse> {
    const response = await client.projects.folders.folderId(id).delete();
    const result = response.data;

    if (!result.success) {
      throw new ApiError({
        code: 'PROJECTS.FOLDER_DELETE_FAILED',
        message: result.message ?? 'Не удалось удалить папку.',
        meta: { id },
      });
    }

    return result;
  },

  async copy(id: string, data: ProjectUpdate = {}): Promise<Project> {
    const response = await client.projects.projectId(id).copy.post({
      body: data,
    });

    return response.data;
  },

  async getVariables(id: string): Promise<ProjectVariableRead[]> {
    const response = await client.projects.projectId(id).variables.get();
    return response.data;
  },

  async setVariables(
    id: string,
    data: Record<string, ProjectVariableBase>
  ): Promise<ProjectVariableRead[]> {
    const response = await client.projects.projectId(id).variables.put({
      body: data,
    });
    return response.data;
  },

  async createVariable(
    projectId: string,
    variableKey: string,
    data: ProjectVariableCreate
  ): Promise<ProjectVariableRead> {
    const response = await client.projects
      .projectId(projectId)
      .variables.variableKey(variableKey)
      .post(
        {
          body: data,
        },
        { silent: true }
      );

    return response.data;
  },

  async updateVariable(
    projectId: string,
    variableKey: string,
    data: ProjectVariableUpdate
  ): Promise<ProjectVariableRead> {
    const response = await client.projects
      .projectId(projectId)
      .variables.variableKey(variableKey)
      .put(
        {
          body: data,
        },
        { silent: true }
      );

    return response.data;
  },

  async deleteVariable(projectId: string, variableKey: string): Promise<void> {
    await client.projects
      .projectId(projectId)
      .variables.variableKey(variableKey)
      .delete(undefined, { silent: true });
  },

  async run(
    id: string,
    mode: PipelineExecutionMode = 'full',
    forceExec: boolean = false
  ): Promise<TaskResponse> {
    const response = await client.projects.projectId(id).tasks.new.post({
      query: {
        mode,
        force_exec: forceExec,
      },
    });

    return response.data;
  },

  async cancelTask(taskID: string, projectID: string): Promise<TaskResponse> {
    const response = await client.projects
      .projectId(projectID)
      .tasks.taskId(taskID)
      .cancel.post();

    return response.data;
  },
};
