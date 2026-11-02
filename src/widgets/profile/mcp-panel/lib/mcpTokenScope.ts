import type {
  McpAccessScopeSchema,
  ResourceScopeSchema,
} from '@/shared/gatewayClient';

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

export const pluralizeRu = (
  count: number,
  forms: [string, string, string]
): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod10 === 1 && mod100 !== 11
      ? forms[0]
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? forms[1]
        : forms[2];

  return `${count} ${form}`;
};

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
