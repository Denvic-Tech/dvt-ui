import type {
  McpAccessScopeSchema,
  ResourceScopeSchema,
} from '@/shared/gatewayClient';
import { pluralizeRu } from '@/shared/lib/string/pluralizeRu';

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

export const formatAccessSummary = (scope: McpAccessScopeSchema): string => {
  const { projects, db_connections: connections } = scope;

  if (projects.mode === 'all' && connections.mode === 'all') {
    return 'Все проекты и подключения';
  }

  const projectsPart =
    projects.mode === 'all'
      ? 'Все проекты'
      : pluralizeRu(projects.ids?.length ?? 0, [
          'проект',
          'проекта',
          'проектов',
        ]);
  const connectionsPart =
    connections.mode === 'all'
      ? 'все подключения'
      : pluralizeRu(connections.ids?.length ?? 0, [
          'подключение',
          'подключения',
          'подключений',
        ]);

  return `${projectsPart}, ${connectionsPart}`;
};
