import type {
  ProjectScheduleResponse,
  RetryBackoff,
} from '@/shared/gatewayClient';

export type RetrySettingsFormData = {
  enabled: boolean;
  maxRetries: string;
  delaySeconds: string;
  backoff: RetryBackoff;
  maxDelaySeconds: string;
};

export const DEFAULT_RETRY_SETTINGS: RetrySettingsFormData = {
  enabled: false,
  maxRetries: '1',
  delaySeconds: '60',
  backoff: 'fixed',
  maxDelaySeconds: '3600',
};

const isIntegerInRange = (value: string, min: number, max: number) => {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  const parsedValue = Number(value);
  return (
    Number.isSafeInteger(parsedValue) &&
    parsedValue >= min &&
    parsedValue <= max
  );
};

const parseIntegerOrDefault = (
  value: string,
  min: number,
  max: number,
  defaultValue: number
) => (isIntegerInRange(value, min, max) ? Number(value) : defaultValue);

export const buildRetrySettings = (
  schedule?: Pick<
    ProjectScheduleResponse,
    | 'max_retries'
    | 'retry_delay_seconds'
    | 'retry_backoff'
    | 'retry_max_delay_seconds'
  >
): RetrySettingsFormData => {
  const maxRetries = schedule?.max_retries ?? 0;

  return {
    enabled: maxRetries > 0,
    maxRetries: String(maxRetries > 0 ? maxRetries : 1),
    delaySeconds: String(schedule?.retry_delay_seconds ?? 60),
    backoff: schedule?.retry_backoff ?? 'fixed',
    maxDelaySeconds: String(schedule?.retry_max_delay_seconds ?? 3600),
  };
};

export const isRetrySettingsValid = (
  settings: RetrySettingsFormData
): boolean => {
  if (!settings.enabled) {
    return true;
  }

  if (
    !isIntegerInRange(settings.maxRetries, 1, 10) ||
    !isIntegerInRange(settings.delaySeconds, 1, 86400)
  ) {
    return false;
  }

  return (
    settings.backoff !== 'exponential' ||
    isIntegerInRange(settings.maxDelaySeconds, 1, 86400)
  );
};

export const buildRetryPayload = (settings: RetrySettingsFormData) => ({
  max_retries: settings.enabled
    ? parseIntegerOrDefault(settings.maxRetries, 1, 10, 1)
    : 0,
  retry_delay_seconds: parseIntegerOrDefault(
    settings.delaySeconds,
    1,
    86400,
    60
  ),
  retry_backoff: settings.backoff,
  retry_max_delay_seconds: parseIntegerOrDefault(
    settings.maxDelaySeconds,
    1,
    86400,
    3600
  ),
});
