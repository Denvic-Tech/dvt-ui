import type { ResourceScopeSchema } from '@/shared/gatewayClient';

export type ResourceScopeMode = ResourceScopeSchema['mode'];

export const buildResourceScope = (
  mode: ResourceScopeMode,
  ids: string[]
): ResourceScopeSchema => {
  if (mode === 'all') {
    return { mode: 'all' };
  }

  return { mode: 'selected', ids: Array.from(new Set(ids)) };
};

export const isResourceScopeValid = (
  mode: ResourceScopeMode,
  ids: string[]
): boolean => mode === 'all' || ids.length > 0;
