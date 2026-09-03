import type { CustomNodeType } from '@/entities/project-editor/graph';

import type { NodeDefinition } from '@/shared/gatewayClient';
import {
  isConst,
  isExpressionValue,
  isLinkValue,
} from '@/shared/lib/node-input-values';

export const ACTIVE_NODE_SEARCH_INPUT_KEYS: ReadonlySet<string> = new Set([
  'table_name',
  'path',
  'sql_code',
  'code',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const collectSearchableStrings = (
  value: unknown,
  result: string[],
  visited: WeakSet<object>
): void => {
  if (typeof value === 'string') {
    result.push(value);
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  if (isLinkValue(value)) {
    return;
  }

  if (isConst(value) || isExpressionValue(value)) {
    collectSearchableStrings(value.value, result, visited);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectSearchableStrings(item, result, visited));
    return;
  }

  Object.values(value).forEach(item =>
    collectSearchableStrings(item, result, visited)
  );
};

const collectTargetedInputStrings = (
  value: unknown,
  result: string[],
  visited: WeakSet<object>
): void => {
  if (!isRecord(value) || visited.has(value)) {
    return;
  }
  visited.add(value);

  if (isLinkValue(value)) {
    return;
  }

  if (isConst(value) || isExpressionValue(value)) {
    collectTargetedInputStrings(value.value, result, visited);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectTargetedInputStrings(item, result, visited));
    return;
  }

  Object.entries(value).forEach(([key, item]) => {
    if (ACTIVE_NODE_SEARCH_INPUT_KEYS.has(key.toLowerCase())) {
      collectSearchableStrings(item, result, new WeakSet());
    }
    collectTargetedInputStrings(item, result, visited);
  });
};

export const buildActiveNodeSearchText = (
  node: CustomNodeType,
  definition?: NodeDefinition
): string => {
  const searchValues = [
    node.data.displayName,
    node.id,
    node.data.name,
    node.type,
    definition?.display_name,
    definition?.category,
    ...(definition?.tags ?? []),
    node.data.comment,
  ].filter((value): value is string => typeof value === 'string');

  collectTargetedInputStrings(
    node.data.inputValues,
    searchValues,
    new WeakSet()
  );

  return searchValues.join('\n').toLowerCase();
};
