import { describe, expect, it } from 'vitest';

import { isSystemUpdatingResponse } from './index';

describe('isSystemUpdatingResponse', () => {
  it('matches only the dedicated 503 system-updating error', () => {
    expect(isSystemUpdatingResponse(503, 'SYSTEM_UPDATING')).toBe(true);
    expect(isSystemUpdatingResponse(503, 'OTHER_ERROR')).toBe(false);
    expect(isSystemUpdatingResponse(502, 'SYSTEM_UPDATING')).toBe(false);
  });
});
