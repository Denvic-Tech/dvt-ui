import type {
  UpdateStatusSchema,
  UserReadSchema,
} from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

export const SYSTEM_UPDATE_MARKER_SCHEMA_VERSION = 1;
export const SYSTEM_UPDATE_RECONNECT_TIMEOUT_MS = 10 * 60 * 1000;

export type SystemUpdatePhase =
  | 'idle'
  | 'starting'
  | 'running'
  | 'reconnecting'
  | 'awaiting_auth'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'status_error';

export interface SystemUpdateMarker {
  schemaVersion: typeof SYSTEM_UPDATE_MARKER_SCHEMA_VERSION;
  jobId: string | null;
  ownerKey: string;
  targetVersion: string;
  launchedAt: number;
  paused: boolean;
  outageStartedAt: number | null;
}

export interface SystemUpdateState {
  hydrated: boolean;
  phase: SystemUpdatePhase;
  marker: SystemUpdateMarker | null;
  snapshot: UpdateStatusSchema | null;
  logs: string[];
  logOffset: number;
  reconnectTimedOut: boolean;
  error: ApiErrorPayload | null;
}

export const getSystemUpdateOwnerKey = (
  user: UserReadSchema | null | undefined
): string | null => {
  const externalId = user?.external_id?.trim();

  if (externalId) {
    return externalId;
  }

  const email = user?.email.trim();
  return email || null;
};
