import { ApiError, type ApiErrorPayload } from './ApiError';

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const createUnknownError = (
  message: string,
  code = 'UNKNOWN',
  meta?: Record<string, unknown>
): ApiErrorPayload => ({
  code,
  message,
  meta,
});

export const ensureApiErrorPayload = (
  payload: ApiErrorPayload | undefined,
  fallbackMessage: string
): ApiErrorPayload => {
  return payload ?? createUnknownError(fallbackMessage);
};

export const toApiErrorPayload = (
  error: unknown,
  fallbackMessage: string
): ApiErrorPayload => {
  if (isApiError(error)) {
    return error.toPayload();
  }

  return createUnknownError(fallbackMessage);
};
