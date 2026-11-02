import dayjs, { type Dayjs } from 'dayjs';

import type { McpAccessScopeSchema } from '@/shared/gatewayClient';

import {
  buildResourceScope,
  isResourceScopeValid,
  type ResourceScopeMode,
} from './mcpTokenScope';

import 'dayjs/locale/ru';

export type TokenExpiryMode = '30d' | '90d' | '1y' | 'never' | 'date';

export type TokenAccessForm = {
  expiryMode: TokenExpiryMode;
  expiryDate: Dayjs | null;
  projectsMode: ResourceScopeMode;
  projectIds: string[];
  connectionsMode: ResourceScopeMode;
  connectionIds: string[];
};

export const EXPIRY_PRESETS: Array<{
  value: Exclude<TokenExpiryMode, 'date'>;
  label: string;
}> = [
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
  { value: '1y', label: '1 год' },
  { value: 'never', label: 'Бессрочно' },
];

export type ResourceSelection = {
  mode: ResourceScopeMode;
  ids: string[];
};

export const formatTokenExpiry = (form: TokenAccessForm): string => {
  if (form.expiryMode === 'date') {
    return `До ${form.expiryDate?.format('DD.MM.YYYY') ?? ''}`;
  }

  return (
    EXPIRY_PRESETS.find(preset => preset.value === form.expiryMode)?.label ?? ''
  );
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

export const resolveTokenExpiresAt = (
  form: TokenAccessForm,
  now: Dayjs = dayjs()
): number | null => {
  switch (form.expiryMode) {
    case '30d':
      return now.add(30, 'day').unix();
    case '90d':
      return now.add(90, 'day').unix();
    case '1y':
      return now.add(1, 'year').unix();
    case 'date':
      return form.expiryDate?.unix() ?? null;
    case 'never':
      return null;
  }
};

export const isTokenAccessFormValid = (
  form: TokenAccessForm,
  now: Dayjs = dayjs()
): boolean => {
  const isExpiryValid =
    form.expiryMode !== 'date' ||
    (form.expiryDate?.isValid() === true && form.expiryDate.isAfter(now));

  return (
    isExpiryValid &&
    isResourceScopeValid(form.projectsMode, form.projectIds) &&
    isResourceScopeValid(form.connectionsMode, form.connectionIds)
  );
};

export const buildTokenAccessScope = (
  form: TokenAccessForm
): McpAccessScopeSchema => ({
  schema_version: 1,
  purpose: 'mcp',
  projects: buildResourceScope(form.projectsMode, form.projectIds),
  db_connections: buildResourceScope(form.connectionsMode, form.connectionIds),
});
