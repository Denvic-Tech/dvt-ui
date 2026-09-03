import { v4 as uuid4 } from 'uuid';

import { type ApiErrorPayload } from './ApiError';
import { toApiErrorPayload } from './utils';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export type ErrorSource =
  | 'gateway'
  | 'reduxThunk'
  | 'react'
  | 'graphEngine'
  | 'websocket'
  | 'custom';

export interface ErrorEventContext {
  actionType?: string;
  nodeId?: string;
  requestId?: string;
  pipelineId?: string;
  [key: string]: unknown;
}

export interface ErrorEventMetadata {
  [key: string]: unknown;
}

export interface ErrorEvent {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  source: ErrorSource;
  message: string;
  payload: ApiErrorPayload;
  fingerprint: string;
  context?: ErrorEventContext;
  alertId?: string;
  notify?: boolean;
  metadata?: ErrorEventMetadata;
}

export interface CreateErrorEventMeta {
  source: ErrorSource;
  severity?: ErrorSeverity;
  message?: string;
  context?: ErrorEventContext;
  fingerprint?: string;
  fingerprintHint?: string;
  alertId?: string;
  notify?: boolean;
  metadata?: ErrorEventMetadata;
  timestamp?: number;
  fallbackMessage?: string;
}

interface FingerprintInput {
  source: ErrorSource;
  code?: string;
  message?: string;
  context?: ErrorEventContext;
  metadata?: ErrorEventMetadata;
  hint?: string;
}

const stableStringify = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }

  try {
    const sorted = sortKeys(value);
    return JSON.stringify(sorted);
  } catch (error) {
    console.warn('Unable to stringify error fingerprint payload', error);
    return '';
  }
};

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
};

export const fingerprintError = ({
  source,
  code,
  message,
  context,
  metadata,
  hint,
}: FingerprintInput): string => {
  const segments = [
    source,
    code ?? '',
    message?.trim() ?? '',
    hint ?? '',
    stableStringify(context),
    stableStringify(metadata),
  ];

  const fingerprint = segments.filter(Boolean).join('|');
  return fingerprint.length > 0
    ? fingerprint
    : `${source}|${code ?? 'UNKNOWN'}`;
};

export const errorSeverityFromStatus = (
  status?: number | null
): ErrorSeverity => {
  if (status === undefined || status === null) {
    return 'error';
  }

  if (status >= 500) {
    return 'critical';
  }

  if (status === 429) {
    return 'warning';
  }

  if (status >= 400) {
    return status === 404 ? 'warning' : 'error';
  }

  return 'info';
};

export const createErrorEvent = (
  error: unknown,
  meta: CreateErrorEventMeta
): ErrorEvent => {
  const payload = toApiErrorPayload(
    error,
    meta.fallbackMessage ?? meta.message ?? 'Unexpected error'
  );

  const message = meta.message ?? payload.message;
  const severity = meta.severity ?? errorSeverityFromStatus(payload.status);
  const fingerprint =
    meta.fingerprint ??
    fingerprintError({
      source: meta.source,
      code: payload.code,
      message,
      ...(meta.context !== undefined && { context: meta.context }),
      ...(meta.metadata !== undefined && { metadata: meta.metadata }),
      ...(meta.fingerprintHint !== undefined && { hint: meta.fingerprintHint }),
    });

  const timestamp = meta.timestamp ?? Date.now();

  const normalizedPayload: ApiErrorPayload = {
    ...payload,
    message,
  };

  return {
    id: uuid4(),
    timestamp,
    severity,
    source: meta.source,
    message,
    payload: normalizedPayload,
    fingerprint,
    ...(meta.context !== undefined && { context: meta.context }),
    ...(meta.alertId !== undefined && { alertId: meta.alertId }),
    notify: meta.notify ?? true,
    ...(meta.metadata !== undefined && { metadata: meta.metadata }),
  };
};
