import {
  SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  type SystemUpdateMarker,
} from './types';

export const SYSTEM_UPDATE_SESSION_KEY = 'dvt:system-update:v1';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const parseSystemUpdateMarker = (
  value: unknown
): SystemUpdateMarker | null => {
  if (value == null || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const jobId = candidate['jobId'];
  const outageStartedAt = candidate['outageStartedAt'];

  if (
    candidate['schemaVersion'] !== SYSTEM_UPDATE_MARKER_SCHEMA_VERSION ||
    typeof candidate['ownerKey'] !== 'string' ||
    candidate['ownerKey'].trim().length === 0 ||
    typeof candidate['targetVersion'] !== 'string' ||
    candidate['targetVersion'].trim().length === 0 ||
    !isFiniteNumber(candidate['launchedAt']) ||
    typeof candidate['paused'] !== 'boolean' ||
    (jobId !== null && typeof jobId !== 'string') ||
    (outageStartedAt !== null && !isFiniteNumber(outageStartedAt))
  ) {
    return null;
  }

  return {
    schemaVersion: SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
    jobId,
    ownerKey: candidate['ownerKey'],
    targetVersion: candidate['targetVersion'],
    launchedAt: candidate['launchedAt'],
    paused: candidate['paused'],
    outageStartedAt,
  };
};

export const readSystemUpdateMarker = (): SystemUpdateMarker | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SYSTEM_UPDATE_SESSION_KEY);

    if (raw == null) {
      return null;
    }

    return parseSystemUpdateMarker(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const writeSystemUpdateMarker = (
  marker: SystemUpdateMarker | null
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (marker == null) {
      window.sessionStorage.removeItem(SYSTEM_UPDATE_SESSION_KEY);
      return;
    }

    window.sessionStorage.setItem(
      SYSTEM_UPDATE_SESSION_KEY,
      JSON.stringify(marker)
    );
  } catch {
    // Operation monitoring still works in memory when storage is unavailable.
  }
};
