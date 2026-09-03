import { describe, expect, it } from 'vitest';

import { buildResourceScope, isResourceScopeValid } from './mcpTokenScope';

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
