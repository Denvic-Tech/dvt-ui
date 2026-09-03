import {
  createListenerMiddleware,
  isRejectedWithValue,
} from '@reduxjs/toolkit';

import { ingestError } from '@/app/errors/error-journal';

import {
  ApiError,
  ApiErrorPayload,
  createErrorEvent,
} from '@/shared/lib/errors';

export const errorListener = createListenerMiddleware();

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const sanitizeErrorMetadata = (value: unknown): unknown => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return '[function]';
  }

  if (typeof AbortSignal !== 'undefined' && value instanceof AbortSignal) {
    return '[AbortSignal]';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeErrorMetadata(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sanitizeErrorMetadata(nestedValue),
      ])
    );
  }

  return String(value);
};

errorListener.startListening({
  matcher: isRejectedWithValue,
  effect: (action, api) => {
    const payload = action.payload as ApiErrorPayload | undefined;
    if (!payload) {
      return;
    }
    if (payload.meta?.['handledLocally'] === true) {
      return;
    }

    const requestId = action.meta?.requestId as string | undefined;
    const error = new ApiError(payload);
    const event = createErrorEvent(error, {
      source: 'reduxThunk',
      context: {
        actionType: action.type,
        ...(requestId !== undefined && { requestId }),
      },
      metadata: {
        arg: sanitizeErrorMetadata(action.meta?.arg),
      },
      fingerprintHint: payload.code,
    });

    api.dispatch(ingestError({ event }));
  },
});

export const errorListenerMiddleware = errorListener.middleware;
