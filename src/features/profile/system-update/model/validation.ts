import type { UpdateStatusSchema } from '@/shared/gatewayClient';

import type { SystemUpdateMarker } from './types';

const VALID_JOB_STATES = new Set(['running', 'succeeded', 'failed']);

export const validateSystemUpdateSnapshot = (
  marker: SystemUpdateMarker,
  snapshot: UpdateStatusSchema
): string | null => {
  if (snapshot.kind !== 'update') {
    return 'Installation manager вернул статус другой операции.';
  }

  if (marker.jobId && snapshot.id !== marker.jobId) {
    return 'Текущая задача installation manager не совпадает с запущенным обновлением.';
  }

  if (
    !marker.jobId &&
    snapshot.version &&
    snapshot.version !== marker.targetVersion
  ) {
    return 'Installation manager вернул статус обновления другой версии.';
  }

  if (!VALID_JOB_STATES.has(snapshot.state)) {
    return `Installation manager вернул неизвестное состояние: ${snapshot.state}.`;
  }

  return null;
};
