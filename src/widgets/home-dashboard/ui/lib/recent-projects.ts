import { projectsApi } from '@/entities/project/projects/api/projectsApi';

import type { ProjectReadSchema } from '@/shared/gatewayClient';

import { getProjectTimestamp } from './project.ts';

export const RECENT_PROJECTS_LIMIT = 4;

export const loadRecentProjects = async (): Promise<ProjectReadSchema[]> => {
  const projects = await projectsApi.getAll({
    sortBy: 'updated_at',
    sortOrder: 'desc',
  });

  return projects
    .sort(
      (left, right) => getProjectTimestamp(right) - getProjectTimestamp(left)
    )
    .slice(0, RECENT_PROJECTS_LIMIT);
};
