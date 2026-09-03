import {
  flattenJsonStructure,
  getJsonNodeSummary,
  getJsonStructureChildren,
  type JsonPathAssignments,
  type JsonPathGroupKey,
  type JsonPathOption,
} from '@/entities/data/json-data';

import type { JsonStructureNode } from '@/shared/gatewayClient';

export type SchemaMappingActionKey =
  | 'record'
  | 'keep'
  | 'exclude'
  | 'meta'
  | 'explode';

export type SchemaMappingLayout = 'split' | 'tree';
export type SchemaMappingMode = 'record' | 'keep' | 'exclude' | null;

export interface ActionPalette {
  active: string;
  bgLight: string;
  borderLight: string;
  text: string;
}

export interface SchemaAssignedPathEntry {
  actions: SchemaMappingActionKey[];
  groups: JsonPathGroupKey[];
  lastSegment: string;
  option: JsonPathOption | null;
  path: string;
}

export const MONO_FONT_FAMILY =
  '"JetBrains Mono", "Fira Code", "SFMono-Regular", monospace';

export const ACTION_LABELS: Record<SchemaMappingActionKey, string> = {
  record: 'Сделать источником строк',
  keep: 'Оставить как JSON',
  exclude: 'Исключить из результата',
  meta: 'Добавить в каждую строку',
  explode: 'Размножить строки по массиву',
};

export const ACTION_TO_GROUP: Record<SchemaMappingActionKey, JsonPathGroupKey> =
  {
    record: 'record_path',
    keep: 'keep_json_paths',
    exclude: 'exclude_paths',
    meta: 'meta_paths',
    explode: 'explode_paths',
  };

export const GROUP_TO_ACTION: Record<JsonPathGroupKey, SchemaMappingActionKey> =
  {
    record_path: 'record',
    keep_json_paths: 'keep',
    exclude_paths: 'exclude',
    meta_paths: 'meta',
    explode_paths: 'explode',
  };

export const GROUP_LABELS: Record<JsonPathGroupKey, string> = {
  record_path: 'Источник строк',
  keep_json_paths: 'Оставить как JSON',
  exclude_paths: 'Исключить',
  meta_paths: 'Добавить в строки',
  explode_paths: 'Размножить строки',
};

export const ACTION_DISABLED_REASONS = {
  assignedOtherAction: 'Для этого пути уже выбрано другое действие',
  excludedPath: 'Этот путь исключён из результата',
  insideKeptBranch:
    'Этот путь находится внутри ветки, которую нужно оставить как JSON',
  recordAlreadySelected: 'Источник строк уже выбран',
  descendantActionsBlocked:
    'Для вложенных элементов этой ветки действия недоступны',
  unavailable: 'Действие недоступно',
} as const;

export const ACTION_PALETTE: Record<SchemaMappingActionKey, ActionPalette> = {
  record: {
    active: '#8b5cf6',
    bgLight: '#ede9fe',
    borderLight: '#ddd6fe',
    text: '#7c3aed',
  },
  keep: {
    active: '#10b981',
    bgLight: '#d1fae5',
    borderLight: '#a7f3d0',
    text: '#059669',
  },
  exclude: {
    active: '#ef4444',
    bgLight: '#fee2e2',
    borderLight: '#fecaca',
    text: '#dc2626',
  },
  meta: {
    active: '#3b82f6',
    bgLight: '#dbeafe',
    borderLight: '#bfdbfe',
    text: '#1d4ed8',
  },
  explode: {
    active: '#f59e0b',
    bgLight: '#fef3c7',
    borderLight: '#fde68a',
    text: '#b45309',
  },
};

const ACTION_ORDER: SchemaMappingActionKey[] = [
  'record',
  'keep',
  'exclude',
  'meta',
  'explode',
];

export const getLastSegment = (path: string): string => {
  if (path === '$') {
    return '$';
  }

  const match = path.match(/[^.\]]+\]?$/);
  return `.${match ? match[0] : path}`;
};

export const getAssignedActions = (
  groups: JsonPathGroupKey[]
): SchemaMappingActionKey[] => {
  return groups
    .map(group => GROUP_TO_ACTION[group])
    .filter((action, index, collection) => collection.indexOf(action) === index)
    .sort(
      (left, right) => ACTION_ORDER.indexOf(left) - ACTION_ORDER.indexOf(right)
    );
};

export const getNodeMode = (groups: JsonPathGroupKey[]): SchemaMappingMode => {
  if (groups.includes('exclude_paths')) {
    return 'exclude';
  }

  if (groups.includes('keep_json_paths')) {
    return 'keep';
  }

  if (groups.includes('record_path')) {
    return 'record';
  }

  return null;
};

export const getPrimaryAction = (
  groups: JsonPathGroupKey[]
): SchemaMappingActionKey | null => {
  const mode = getNodeMode(groups);

  if (mode) {
    return mode;
  }

  if (groups.includes('meta_paths')) {
    return 'meta';
  }

  if (groups.includes('explode_paths')) {
    return 'explode';
  }

  return null;
};

export const buildActionCounts = (
  assignments: JsonPathAssignments
): Record<SchemaMappingActionKey, number> => {
  const counts: Record<SchemaMappingActionKey, number> = {
    record: 0,
    keep: 0,
    exclude: 0,
    meta: 0,
    explode: 0,
  };

  Object.values(assignments).forEach(groups => {
    getAssignedActions(groups).forEach(action => {
      counts[action] += 1;
    });
  });

  return counts;
};

export const buildAssignedPathEntries = ({
  assignments,
  pathOptions,
}: {
  assignments: JsonPathAssignments;
  pathOptions: JsonPathOption[];
}): SchemaAssignedPathEntry[] => {
  const assignedPaths = new Set(Object.keys(assignments));
  const pathOptionByPath = new Map(
    pathOptions.map(option => [option.path, option])
  );
  const orderedPaths: string[] = [];

  pathOptions.forEach(option => {
    if (assignedPaths.has(option.path)) {
      orderedPaths.push(option.path);
    }
  });

  Object.keys(assignments)
    .filter(path => !pathOptionByPath.has(path))
    .sort((left, right) => left.localeCompare(right))
    .forEach(path => orderedPaths.push(path));

  return orderedPaths.map(path => {
    const groups = assignments[path] ?? [];

    return {
      actions: getAssignedActions(groups),
      groups,
      lastSegment: getLastSegment(path),
      option: pathOptionByPath.get(path) ?? null,
      path,
    };
  });
};

export const buildActionEntries = ({
  action,
  assignments,
  pathOptions,
}: {
  action: SchemaMappingActionKey;
  assignments: JsonPathAssignments;
  pathOptions: JsonPathOption[];
}): SchemaAssignedPathEntry[] => {
  return buildAssignedPathEntries({ assignments, pathOptions }).filter(entry =>
    entry.actions.includes(action)
  );
};

export const filterSchemaTree = ({
  activeActions,
  root,
  selectedOnly,
  assignments,
}: {
  activeActions: Set<SchemaMappingActionKey>;
  root: JsonStructureNode | null | undefined;
  selectedOnly: boolean;
  assignments: JsonPathAssignments;
}): JsonStructureNode | null => {
  if (!root) {
    return null;
  }

  const shouldFilterByActions = activeActions.size > 0;
  const shouldFilterBySelection = selectedOnly || shouldFilterByActions;

  if (!shouldFilterBySelection) {
    return root;
  }

  const visit = (node: JsonStructureNode): JsonStructureNode | null => {
    const children = getJsonStructureChildren(node)
      .map(child => visit(child))
      .filter((child): child is JsonStructureNode => child != null);
    const groups = assignments[node.path] ?? [];
    const actions = getAssignedActions(groups);
    const matchesAction =
      !shouldFilterByActions ||
      actions.some(action => activeActions.has(action));
    const matchesSelection = !selectedOnly || actions.length > 0;
    const matchesNode = matchesAction && matchesSelection;

    if (!matchesNode && children.length === 0) {
      return null;
    }

    if (children.length === getJsonStructureChildren(node).length) {
      return node;
    }

    return {
      ...node,
      children,
    };
  };

  return visit(root);
};

export const buildExpandedPathSet = (
  root: JsonStructureNode | null | undefined
): Set<string> => {
  if (!root) {
    return new Set<string>();
  }

  return new Set(
    flattenJsonStructure(root)
      .map(({ node }) => node)
      .filter(node => getJsonStructureChildren(node).length > 0)
      .map(node => node.path)
  );
};

export const buildAncestorMap = (
  root: JsonStructureNode | null | undefined
): Record<string, string[]> => {
  const map: Record<string, string[]> = {};

  flattenJsonStructure(root).forEach(({ node, parentPath }) => {
    if (!parentPath) {
      map[node.path] = [];
      return;
    }

    map[node.path] = [...(map[parentPath] ?? []), parentPath];
  });

  return map;
};

export const buildNodeSummaryText = (node: JsonStructureNode): string => {
  const summary = getJsonNodeSummary(node);
  const parts = [
    node.path || node.display_path || node.name || '$',
    node.nullable ? 'nullable' : null,
    summary,
  ].filter((value): value is string => Boolean(value));

  return parts.join(' · ');
};

export const isSameOrDescendantPath = (
  path: string,
  ancestorPath: string
): boolean => {
  if (path === ancestorPath) {
    return true;
  }

  return (
    path.startsWith(`${ancestorPath}.`) || path.startsWith(`${ancestorPath}[`)
  );
};

export const isDescendantPath = (
  path: string,
  ancestorPath: string
): boolean => {
  return path !== ancestorPath && isSameOrDescendantPath(path, ancestorPath);
};

const findAssignedAncestorPath = ({
  assignments,
  group,
  path,
}: {
  assignments: JsonPathAssignments;
  group: JsonPathGroupKey;
  path: string;
}): string | null => {
  return (
    Object.keys(assignments)
      .filter(candidatePath => {
        return (
          (assignments[candidatePath] ?? []).includes(group) &&
          isDescendantPath(path, candidatePath)
        );
      })
      .sort((left, right) => right.length - left.length)[0] ?? null
  );
};

const hasAssignedDescendant = ({
  assignments,
  path,
}: {
  assignments: JsonPathAssignments;
  path: string;
}): boolean => {
  return Object.keys(assignments).some(candidatePath => {
    return (
      (assignments[candidatePath] ?? []).length > 0 &&
      isDescendantPath(candidatePath, path)
    );
  });
};

export const getActionDisabledReason = ({
  action,
  assignments,
  path,
}: {
  action: SchemaMappingActionKey;
  assignments: JsonPathAssignments;
  path: string;
}): string | null => {
  const groups = assignments[path] ?? [];
  const targetGroup = ACTION_TO_GROUP[action];

  if (groups.includes(targetGroup)) {
    return null;
  }

  if (groups.includes('exclude_paths')) {
    return ACTION_DISABLED_REASONS.excludedPath;
  }

  if (groups.includes('keep_json_paths')) {
    return ACTION_DISABLED_REASONS.insideKeptBranch;
  }

  if (groups.length > 0) {
    return ACTION_DISABLED_REASONS.assignedOtherAction;
  }

  if (
    findAssignedAncestorPath({
      assignments,
      group: 'exclude_paths',
      path,
    })
  ) {
    return ACTION_DISABLED_REASONS.excludedPath;
  }

  if (
    findAssignedAncestorPath({
      assignments,
      group: 'keep_json_paths',
      path,
    })
  ) {
    return ACTION_DISABLED_REASONS.insideKeptBranch;
  }

  if (action === 'record') {
    const otherRecordPath = Object.keys(assignments).find(candidatePath => {
      return (
        candidatePath !== path &&
        (assignments[candidatePath] ?? []).includes('record_path')
      );
    });

    if (otherRecordPath) {
      return ACTION_DISABLED_REASONS.recordAlreadySelected;
    }
  }

  if (
    (action === 'keep' || action === 'exclude') &&
    hasAssignedDescendant({ assignments, path })
  ) {
    return ACTION_DISABLED_REASONS.descendantActionsBlocked;
  }

  return null;
};
