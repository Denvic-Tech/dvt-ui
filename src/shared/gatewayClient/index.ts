import {
  ApiError,
  ApiErrorPayload,
  ErrorEnvelopeSchema,
} from '@/shared/lib/errors';

import config from '@/config';

import { client } from './client.gen';

// TODO: CLR, add 'modal' dir, rename to 'gateway-client'

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * If true, suppress automatic alert notification for this request's errors.
     * Use when error handling is done locally in the component.
     */
    silent?: boolean;
  }
}

// ——— Late-binding error handler (set by app layer to dispatch notifications)
type GatewayErrorHandler = (payload: ApiErrorPayload) => void;
let errorHandler: GatewayErrorHandler | null = null;

export const setGatewayErrorHandler = (handler: GatewayErrorHandler) => {
  errorHandler = handler;
};

type GatewaySystemUpdatingHandler = (payload: ApiErrorPayload) => void;
let systemUpdatingHandler: GatewaySystemUpdatingHandler | null = null;

export const setGatewaySystemUpdatingHandler = (
  handler: GatewaySystemUpdatingHandler
) => {
  systemUpdatingHandler = handler;
};

export const isSystemUpdatingResponse = (
  status: number | undefined,
  code: string | undefined
): boolean => status === 503 && code === 'SYSTEM_UPDATING';

type AuthStateChangeDetail = {
  reason: 'unauthorized';
  status: 401;
  requestUrl?: string;
  showNotification?: boolean;
};

const AUTH_STATE_CHANGE_EVENT = 'authStateChange';
const AUTH_EXCLUDED_PATHS = new Set([
  '/auth/sign-in',
  '/auth/check-auth',
  '/auth/logout',
  '/auth/refresh',
]);

const resolveRequestPathname = (
  requestUrl: string | undefined
): string | null => {
  if (requestUrl == null || requestUrl.trim().length === 0) {
    return null;
  }

  try {
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : config.apiBaseUrl;
    return new URL(requestUrl, baseUrl).pathname;
  } catch {
    return null;
  }
};

const shouldDispatchUnauthorizedEvent = (
  status: number | undefined,
  requestUrl: string | undefined
): status is 401 => {
  if (status !== 401 || typeof window === 'undefined') {
    return false;
  }

  if (window.location.pathname.startsWith('/sign_in')) {
    return false;
  }

  const pathname = resolveRequestPathname(requestUrl);

  if (pathname != null && pathname.startsWith('/setup/')) {
    return false;
  }

  if (pathname != null && AUTH_EXCLUDED_PATHS.has(pathname)) {
    return false;
  }

  return true;
};

const isSignInRouteActive = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.pathname.startsWith('/sign_in');
};

const shouldSuppressAlertsOnSignInRoute = (
  status: number | undefined,
  requestUrl: string | undefined
): boolean => {
  if (!isSignInRouteActive()) {
    return false;
  }

  const pathname = resolveRequestPathname(requestUrl);

  if (pathname === '/auth/sign-in') {
    return false;
  }

  return status === 401;
};

const resolveLanguageHeader = (): string => {
  const fallback = 'ru-RU';

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const value = window.localStorage?.getItem('language');

    if (value && value.trim().length > 0) {
      return value;
    }
  } catch (error) {
    console.warn('Unable to read language from localStorage:', error);
  }

  return fallback;
};

client.setConfig({
  baseURL: config.apiBaseUrl,
  throwOnError: true,
  withCredentials: true,
  headers: {
    'X-Language': resolveLanguageHeader(),
  },
});

// Статусы, для которых уведомления не нужны (auth-редирект и т.п.)
const SILENT_STATUSES = new Set([401]);

client.instance.interceptors.response.use(
  resp => resp,
  error => {
    // axios error shape
    const status = error?.response?.status as number | undefined;
    const data = error?.response?.data;
    const fallbackDetail =
      typeof data?.detail === 'string'
        ? data.detail
        : (data?.detail ?? data?.exc_data);
    const fallbackMessage =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.description === 'string'
          ? data.description
          : typeof data?.detail === 'string'
            ? data.detail
            : (error?.message ?? 'Unexpected error');

    // попытка распарсить доменный конверт
    const parsed = ErrorEnvelopeSchema.safeParse(data);
    const name = parsed.success
      ? parsed.data.name
      : typeof data?.name === 'string'
        ? data.name
        : status
          ? `HTTP_${status}`
          : 'UNKNOWN';

    const code = parsed.success
      ? parsed.data.code
      : typeof data?.code === 'string'
        ? data.code
        : status
          ? `HTTP_${status}`
          : 'UNKNOWN';

    const message = parsed.success ? parsed.data.message : fallbackMessage;
    const description = parsed.success
      ? parsed.data.description
      : typeof data?.description === 'string'
        ? data.description
        : fallbackMessage;

    const detail = parsed.success
      ? (parsed.data.detail ?? fallbackDetail)
      : fallbackDetail;

    const payload: ApiErrorPayload = {
      name,
      description,
      code,
      message,
      status,
      detail,
      meta: {
        exc_data: data?.exc_data,
        raw: data,
        name: data?.name,
        category: data?.category,
        type: data?.type,
      },
    };

    const isSilent = error?.config?.silent === true;
    const requestUrl = error?.config?.url as string | undefined;
    const suppressAlertsOnSignIn = shouldSuppressAlertsOnSignInRoute(
      status,
      requestUrl
    );
    const isSystemUpdating = isSystemUpdatingResponse(status, payload.code);

    if (isSystemUpdating) {
      systemUpdatingHandler?.(payload);
    }

    if (shouldDispatchUnauthorizedEvent(status, requestUrl)) {
      const detail: AuthStateChangeDetail = {
        reason: 'unauthorized',
        status,
        showNotification: true,
      };

      if (requestUrl != null) {
        detail.requestUrl = requestUrl;
      }

      window.dispatchEvent(
        new CustomEvent<AuthStateChangeDetail>(AUTH_STATE_CHANGE_EVENT, {
          detail,
        })
      );
    }

    if (
      errorHandler &&
      !isSilent &&
      !isSystemUpdating &&
      !suppressAlertsOnSignIn &&
      !(status && SILENT_STATUSES.has(status))
    ) {
      errorHandler(payload);
    }

    throw new ApiError(payload);
  }
);

export { client };
export * from './client.gen/types.gen';
export * from './client.gen/zod.gen';
