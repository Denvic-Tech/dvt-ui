import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearSystemUpdateMarker,
  hasSystemUpdateMarker,
  markSystemUpdateInProgress,
  SYSTEM_UPDATE_IN_PROGRESS_KEY,
} from './storage';

describe('system availability storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and clears the global update marker', () => {
    expect(hasSystemUpdateMarker()).toBe(false);

    markSystemUpdateInProgress();

    expect(hasSystemUpdateMarker()).toBe(true);
    expect(window.localStorage.getItem(SYSTEM_UPDATE_IN_PROGRESS_KEY)).toBe(
      '1'
    );

    clearSystemUpdateMarker();
    expect(hasSystemUpdateMarker()).toBe(false);
  });
});
