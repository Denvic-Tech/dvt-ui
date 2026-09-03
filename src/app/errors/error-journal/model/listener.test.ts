import { describe, expect, it } from 'vitest';

import { sanitizeErrorMetadata } from './listener.ts';

describe('sanitizeErrorMetadata', () => {
  it('replaces non-serializable values with serializable equivalents', () => {
    const controller = new AbortController();
    const timestamp = new Date('2026-05-04T00:00:00.000Z');
    const result = sanitizeErrorMetadata({
      signal: controller.signal,
      nested: {
        callback: () => 'noop',
        error: new Error('boom'),
        timestamp,
      },
    });

    expect(result).toEqual({
      signal: '[AbortSignal]',
      nested: {
        callback: '[function]',
        error: {
          name: 'Error',
          message: 'boom',
        },
        timestamp: '2026-05-04T00:00:00.000Z',
      },
    });
  });
});
