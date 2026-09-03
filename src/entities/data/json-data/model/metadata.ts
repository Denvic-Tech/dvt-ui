import type {
  JsonFlattenCandidate,
  JsonFlattenCandidateKind,
  JsonMetadata,
  JsonNodeKind,
  JsonStructureNode,
  Metadata,
} from '@/shared/gatewayClient';

export type JsonPathGroupKey =
  | 'record_path'
  | 'meta_paths'
  | 'explode_paths'
  | 'keep_json_paths'
  | 'exclude_paths';

export interface JsonPathOption {
  path: string;
  displayPath: string;
  kind: JsonNodeKind;
  depth: number;
  required: boolean;
  nullable: boolean;
  occurrences: number | null;
  node: JsonStructureNode;
}

export interface JsonStructureNodeEntry {
  node: JsonStructureNode;
  depth: number;
  parentPath: string | null;
}

export interface JsonPathConflict {
  path: string;
  groups: JsonPathGroupKey[];
}

export type JsonPathAssignments = Record<string, JsonPathGroupKey[]>;

export const JSON_PATH_GROUP_ORDER: JsonPathGroupKey[] = [
  'record_path',
  'meta_paths',
  'explode_paths',
  'keep_json_paths',
  'exclude_paths',
];

export const JSON_PATH_GROUP_LABELS: Record<JsonPathGroupKey, string> = {
  record_path: 'Источник строк',
  meta_paths: 'Добавить в строки',
  explode_paths: 'Размножить строки',
  keep_json_paths: 'Оставить как JSON',
  exclude_paths: 'Исключить',
};

export const JSON_PATH_GROUP_TITLES: Record<JsonPathGroupKey, string> = {
  record_path: 'Источник строк',
  meta_paths: 'Добавить в строки',
  explode_paths: 'Размножить строки',
  keep_json_paths: 'Оставить как JSON',
  exclude_paths: 'Исключить',
};

export const JSON_CANDIDATE_KIND_TITLES: Record<
  JsonFlattenCandidateKind,
  string
> = {
  RECORD_PATH: 'Record path',
  META_PATH: 'Meta path',
  EXPLODE_PATH: 'Explode path',
};

export const JSON_CANDIDATE_KIND_TO_GROUP: Record<
  JsonFlattenCandidateKind,
  JsonPathGroupKey
> = {
  RECORD_PATH: 'record_path',
  META_PATH: 'meta_paths',
  EXPLODE_PATH: 'explode_paths',
};

export const isJsonMetadata = (metadata: unknown): metadata is JsonMetadata => {
  if (metadata == null || typeof metadata !== 'object') {
    return false;
  }

  return (metadata as Metadata).type === 'JSON';
};

export const getJsonStructureChildren = (
  node: JsonStructureNode | null | undefined
): JsonStructureNode[] => {
  return Array.isArray(node?.children) ? node.children : [];
};

const toDisplayPath = (node: JsonStructureNode): string => {
  return node.display_path?.trim() || node.path || node.name || '$';
};

const buildNodeSearchText = (node: JsonStructureNode): string => {
  const parts: string[] = [
    node.name,
    node.path,
    node.display_path,
    node.kind,
    ...(node.kinds ?? []),
    ...(node.object_keys ?? []),
    ...(node.examples ?? []).map(example => JSON.stringify(example)),
  ].filter((value): value is string => typeof value === 'string');

  return parts.join(' ').toLowerCase();
};

export const flattenJsonStructure = (
  root: JsonStructureNode | null | undefined
): JsonStructureNodeEntry[] => {
  if (!root) {
    return [];
  }

  const result: JsonStructureNodeEntry[] = [];

  const visit = (
    node: JsonStructureNode,
    depth: number,
    parentPath: string | null
  ) => {
    result.push({ node, depth, parentPath });

    getJsonStructureChildren(node).forEach(child => {
      visit(child, depth + 1, node.path);
    });
  };

  visit(root, 0, null);

  return result;
};

export const buildJsonPathOptions = (
  root: JsonStructureNode | null | undefined
): JsonPathOption[] => {
  const seenPaths = new Set<string>();

  return flattenJsonStructure(root)
    .filter(({ node }) => {
      if (!node.path || seenPaths.has(node.path)) {
        return false;
      }

      seenPaths.add(node.path);
      return true;
    })
    .map(({ node, depth }) => ({
      path: node.path,
      displayPath: toDisplayPath(node),
      kind: node.kind,
      depth,
      required: Boolean(node.required),
      nullable: Boolean(node.nullable),
      occurrences:
        typeof node.occurrences === 'number' ? node.occurrences : null,
      node,
    }));
};

export const filterJsonStructure = (
  root: JsonStructureNode | null | undefined,
  query: string
): JsonStructureNode | null => {
  if (!root) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return root;
  }

  const filterNode = (node: JsonStructureNode): JsonStructureNode | null => {
    const filteredChildren = getJsonStructureChildren(node)
      .map(filterNode)
      .filter((child): child is JsonStructureNode => child != null);
    const matches = buildNodeSearchText(node).includes(normalizedQuery);

    if (!matches && filteredChildren.length === 0) {
      return null;
    }

    if (filteredChildren.length === getJsonStructureChildren(node).length) {
      return node;
    }

    return {
      ...node,
      children: filteredChildren,
    };
  };

  return filterNode(root);
};

export const groupJsonFlattenCandidates = (
  candidates: Array<JsonFlattenCandidate> | null | undefined
): Record<JsonFlattenCandidateKind, JsonFlattenCandidate[]> => {
  const grouped: Record<JsonFlattenCandidateKind, JsonFlattenCandidate[]> = {
    RECORD_PATH: [],
    META_PATH: [],
    EXPLODE_PATH: [],
  };

  (candidates ?? []).forEach(candidate => {
    grouped[candidate.kind].push(candidate);
  });

  return grouped;
};

export const buildJsonCandidateKindsByPath = (
  candidates: Array<JsonFlattenCandidate> | null | undefined
): Record<string, JsonFlattenCandidateKind[]> => {
  const result: Record<string, JsonFlattenCandidateKind[]> = {};

  (candidates ?? []).forEach(candidate => {
    const currentKinds = result[candidate.path] ?? [];

    if (!currentKinds.includes(candidate.kind)) {
      currentKinds.push(candidate.kind);
      result[candidate.path] = currentKinds;
    }
  });

  return result;
};

export const normalizeJsonPathList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
};

export const normalizeJsonRecordPath = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

export const buildJsonPathAssignments = (values: {
  exclude_paths?: unknown;
  explode_paths?: unknown;
  keep_json_paths?: unknown;
  meta_paths?: unknown;
  record_path?: unknown;
}): JsonPathAssignments => {
  const assignments: JsonPathAssignments = {};

  const addGroup = (path: string, group: JsonPathGroupKey) => {
    const groups = assignments[path] ?? [];

    if (!groups.includes(group)) {
      groups.push(group);
      assignments[path] = groups;
    }
  };

  const recordPath = normalizeJsonRecordPath(values.record_path);
  if (recordPath) {
    addGroup(recordPath, 'record_path');
  }

  normalizeJsonPathList(values.meta_paths).forEach(path =>
    addGroup(path, 'meta_paths')
  );
  normalizeJsonPathList(values.explode_paths).forEach(path =>
    addGroup(path, 'explode_paths')
  );
  normalizeJsonPathList(values.keep_json_paths).forEach(path =>
    addGroup(path, 'keep_json_paths')
  );
  normalizeJsonPathList(values.exclude_paths).forEach(path =>
    addGroup(path, 'exclude_paths')
  );

  Object.values(assignments).forEach(groups => {
    groups.sort(
      (left, right) =>
        JSON_PATH_GROUP_ORDER.indexOf(left) -
        JSON_PATH_GROUP_ORDER.indexOf(right)
    );
  });

  return assignments;
};

export const findJsonExcludeConflicts = (values: {
  exclude_paths?: unknown;
  explode_paths?: unknown;
  keep_json_paths?: unknown;
  meta_paths?: unknown;
  record_path?: unknown;
}): JsonPathConflict[] => {
  const assignments = buildJsonPathAssignments(values);

  return Object.entries(assignments)
    .filter(([, groups]) => {
      return groups.includes('exclude_paths') && groups.length > 1;
    })
    .map(([path, groups]) => ({
      path,
      groups,
    }));
};

export const getJsonNodeKindLabel = (kind: JsonNodeKind): string => {
  switch (kind) {
    case 'OBJECT':
      return 'object';
    case 'ARRAY':
      return 'array';
    case 'STRING':
      return 'string';
    case 'INTEGER':
      return 'integer';
    case 'NUMBER':
      return 'number';
    case 'BOOLEAN':
      return 'boolean';
    case 'NULL':
      return 'null';
    case 'UNION':
      return 'union';
    default:
      return 'unknown';
  }
};

export const getJsonNodeSummary = (node: JsonStructureNode): string | null => {
  if (node.kind === 'UNION' && node.kinds && node.kinds.length > 0) {
    return `Kinds: ${node.kinds.map(getJsonNodeKindLabel).join(', ')}`;
  }

  if (node.kind === 'OBJECT') {
    const keysCount =
      node.object_keys?.length ?? getJsonStructureChildren(node).length;
    return `Keys: ${keysCount}`;
  }

  if (node.kind === 'ARRAY') {
    const parts = [
      node.item_kind ? `Items: ${getJsonNodeKindLabel(node.item_kind)}` : null,
      typeof node.array_min_items === 'number'
        ? `min ${node.array_min_items}`
        : null,
      typeof node.array_max_items === 'number'
        ? `max ${node.array_max_items}`
        : null,
      typeof node.sampled_items === 'number'
        ? `sampled ${node.sampled_items}`
        : null,
    ].filter((value): value is string => Boolean(value));

    return parts.length > 0 ? parts.join(' · ') : null;
  }

  if (node.examples && node.examples.length > 0) {
    return `Examples: ${node.examples.length}`;
  }

  return null;
};
