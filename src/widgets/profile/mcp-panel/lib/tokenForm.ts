import dayjs, { type Dayjs } from 'dayjs';

import type { McpAccessScopeSchema } from '@/shared/gatewayClient';
import {
  isTokenExpiryValid,
  type TokenExpiryValue,
} from '@/shared/lib/token/tokenExpiryForm';

import {
  buildResourceScope,
  isResourceScopeValid,
  type ResourceScopeMode,
} from './mcpTokenScope';

import 'dayjs/locale/ru';

export type TokenAccessForm = TokenExpiryValue & {
  projectsMode: ResourceScopeMode;
  projectIds: string[];
  connectionsMode: ResourceScopeMode;
  connectionIds: string[];
};

export type ResourceSelection = {
  mode: ResourceScopeMode;
  ids: string[];
};

export const toggleResourceItem = (
  { mode, ids }: ResourceSelection,
  id: string,
  allIds: string[]
): ResourceSelection => {
  let next: string[];
  if (mode === 'all') {
    next = allIds.filter(item => item !== id);
  } else if (ids.includes(id)) {
    next = ids.filter(item => item !== id);
  } else {
    next = [...ids, id];
  }

  return next.length === allIds.length
    ? { mode: 'all', ids: [] }
    : { mode: 'selected', ids: next };
};

export const formatResourceSelection = (
  { mode, ids }: ResourceSelection,
  options: Array<{ value: string; label: string }>,
  allLabel: string
): string => {
  if (mode === 'all') return allLabel;
  if (ids.length === 0) return 'Ничего не выбрано';

  const names = options
    .filter(option => ids.includes(option.value))
    .map(option => option.label);

  if (names.length === 0) return `Выбрано: ${ids.length}`;

  return names.length <= 2
    ? names.join(', ')
    : `${names[0]} и ещё ${names.length - 1}`;
};

export const createDefaultTokenAccessForm = (): TokenAccessForm => ({
  expiryMode: 'never',
  expiryDate: null,
  projectsMode: 'all',
  projectIds: [],
  connectionsMode: 'all',
  connectionIds: [],
});

export const defaultTokenName = (now: Dayjs = dayjs()): string =>
  `MCP-токен · ${now.locale('ru').format('D MMM').replace('.', '')}`;

export const isTokenAccessFormValid = (
  form: TokenAccessForm,
  now: Dayjs = dayjs()
): boolean =>
  isTokenExpiryValid(form, now) &&
  isResourceScopeValid(form.projectsMode, form.projectIds) &&
  isResourceScopeValid(form.connectionsMode, form.connectionIds);

export const buildTokenAccessScope = (
  form: TokenAccessForm
): McpAccessScopeSchema => ({
  schema_version: 1,
  purpose: 'mcp',
  projects: buildResourceScope(form.projectsMode, form.projectIds),
  db_connections: buildResourceScope(form.connectionsMode, form.connectionIds),
});
