import { beforeEach, describe, expect, it } from 'vitest';

import {
  parseSystemUpdateMarker,
  readSystemUpdateMarker,
  SYSTEM_UPDATE_SESSION_KEY,
  writeSystemUpdateMarker,
} from '../session';
import {
  SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  type SystemUpdateMarker,
} from '../types';

const marker: SystemUpdateMarker = {
  schemaVersion: SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  jobId: 'job-1',
  ownerKey: 'superadmin@example.com',
  targetVersion: 'latest',
  launchedAt: 123,
  paused: false,
  outageStartedAt: null,
};

describe('system update session marker', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('persists and restores a marker in the current tab', () => {
    writeSystemUpdateMarker(marker);

    expect(readSystemUpdateMarker()).toEqual(marker);

    writeSystemUpdateMarker(null);
    expect(window.sessionStorage.getItem(SYSTEM_UPDATE_SESSION_KEY)).toBeNull();
  });

  it('rejects malformed and obsolete marker data', () => {
    expect(parseSystemUpdateMarker(null)).toBeNull();
    expect(parseSystemUpdateMarker({ ...marker, schemaVersion: 2 })).toBeNull();
    expect(parseSystemUpdateMarker({ ...marker, ownerKey: '' })).toBeNull();

    window.sessionStorage.setItem(SYSTEM_UPDATE_SESSION_KEY, '{bad json');
    expect(readSystemUpdateMarker()).toBeNull();
  });
});
