import type {
  ProjectLastRunSchema,
  ProjectReadSchema,
} from '@/shared/gatewayClient';

/**
 * What a project row needs. Full `ProjectReadSchema` objects satisfy it, and
 * scheduler entries can be mapped into it without fetching the project.
 */
export type HomeProject = Pick<
  ProjectReadSchema,
  'created_at' | 'id' | 'is_favorite' | 'name' | 'updated_at'
> & {
  last_runs?: ProjectLastRunSchema[];
};
