import type { AppDispatch } from '@/app/providers/store';

import { setGatewayErrorHandler } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

import { addAlert } from './slice.ts';

/**
 * Initializes the gateway error handler to dispatch alerts.
 * Should be called once after store creation.
 */
export const initGatewayAlertHandler = (dispatch: AppDispatch) => {
  setGatewayErrorHandler((payload: ApiErrorPayload) => {
    const title = payload.name ?? 'ERROR';
    let description = payload.description ?? payload.message ?? undefined;

    let detail =
      typeof payload.detail === 'string'
        ? payload.detail
        : payload.detail != null
          ? JSON.stringify(payload.detail)
          : undefined;

    if (description === 'Unexpected error' && detail != null) {
      description = detail;
      detail = undefined;
    }

    dispatch(
      addAlert({
        type: 'error',
        title,
        ...(description != null && { description }),
        ...(detail != null && { detail }),
        group: `gateway:${payload.code}`,
      })
    );
  });
};
