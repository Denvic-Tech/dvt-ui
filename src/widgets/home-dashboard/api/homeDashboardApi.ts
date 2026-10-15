import { projectsApi } from '@/entities/project/projects/api/projectsApi';

import type {
  ProjectReadSchema,
  ProjectScheduleResponse,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';

const RECENT_PROJECTS_LIMIT = 10;

export const homeDashboardApi = {
  /** Most recently updated projects for the «Недавние» tab. */
  async getRecentProjects(): Promise<ProjectReadSchema[]> {
    return projectsApi.getAll({
      sortBy: 'updated_at',
      sortOrder: 'desc',
      limit: RECENT_PROJECTS_LIMIT,
      silent: true,
    });
  },

  /**
   * Scheduler entries with project names and recent runs (admin+); same
   * source as «Активные расписания».
   */
  async getProjectSchedules(): Promise<ProjectScheduleResponse[]> {
    // The generated request validator rejects the empty request envelope for
    // this GET (same workaround as the profile SchedulePanel).
    const response = await client.projects.scheduler.scheduled.get(
      {},
      { requestValidator: async data => data, silent: true }
    );

    return response.data;
  },

  async getFavoriteProjects(): Promise<ProjectReadSchema[]> {
    return projectsApi.getFavorites({ silent: true });
  },

  async setProjectFavorite(projectId: string, favorite: boolean) {
    // Errors surface through the dashboard's own alert, not the global one.
    return favorite
      ? projectsApi.addFavorite(projectId, { silent: true })
      : projectsApi.removeFavorite(projectId, { silent: true });
  },

  async searchProjects(
    query: string,
    { includeLastRuns, limit }: { includeLastRuns: boolean; limit: number }
  ): Promise<{ projects: ProjectReadSchema[]; total: number }> {
    const page = await projectsApi.search({
      name: query,
      itemType: 'project',
      limit,
      sortBy: 'updated_at',
      sortOrder: 'desc',
      includeLastRuns,
      silent: true,
    });

    return {
      projects: (page.items ?? []).flatMap(item =>
        item.type === 'project' && item.project ? [item.project] : []
      ),
      total: page.total,
    };
  },
};
