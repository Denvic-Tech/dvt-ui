import { describe, expect, it } from 'vitest';

import {
  buildResourceScope,
  formatAccessSummary,
  isResourceScopeValid,
} from './mcpTokenScope';

describe('mcpTokenScope', () => {
  it('не передаёт ids для доступа ко всем ресурсам', () => {
    expect(buildResourceScope('all', ['project-1'])).toEqual({ mode: 'all' });
  });

  it('передаёт уникальные ids для выбранных ресурсов', () => {
    expect(
      buildResourceScope('selected', ['project-1', 'project-1', 'project-2'])
    ).toEqual({
      mode: 'selected',
      ids: ['project-1', 'project-2'],
    });
  });

  it('требует хотя бы один ресурс только в selected-режиме', () => {
    expect(isResourceScopeValid('all', [])).toBe(true);
    expect(isResourceScopeValid('selected', [])).toBe(false);
    expect(isResourceScopeValid('selected', ['connection-1'])).toBe(true);
  });
});

describe('formatAccessSummary', () => {
  it('collapses full access into one phrase', () => {
    expect(
      formatAccessSummary({
        projects: { mode: 'all' },
        db_connections: { mode: 'all' },
      })
    ).toBe('Все проекты и подключения');
  });

  it('counts selected resources', () => {
    expect(
      formatAccessSummary({
        projects: { mode: 'selected', ids: ['a', 'b'] },
        db_connections: { mode: 'selected', ids: ['c'] },
      })
    ).toBe('2 проекта, 1 подключение');
  });

  it('mixes full and selected access', () => {
    expect(
      formatAccessSummary({
        projects: { mode: 'all' },
        db_connections: { mode: 'selected', ids: ['a', 'b', 'c', 'd', 'e'] },
      })
    ).toBe('Все проекты, 5 подключений');
  });
});
