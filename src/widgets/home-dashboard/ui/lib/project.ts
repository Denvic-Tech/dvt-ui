import type { ProjectReadSchema } from '@/shared/gatewayClient';

export const getProjectTimestamp = (project: ProjectReadSchema): number => {
  const rawValue = project.updated_at ?? project.created_at;
  const timestamp = rawValue ? new Date(rawValue).getTime() : Number.NaN;

  return Number.isFinite(timestamp) ? timestamp : 0;
};
