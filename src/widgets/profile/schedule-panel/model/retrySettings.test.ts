import { describe, expect, it } from 'vitest';

import {
  buildRetryPayload,
  buildRetrySettings,
  DEFAULT_RETRY_SETTINGS,
  isRetrySettingsValid,
} from './retrySettings';

describe('schedule retry settings', () => {
  it('uses API defaults for a new schedule', () => {
    expect(buildRetrySettings()).toEqual(DEFAULT_RETRY_SETTINGS);
  });

  it('restores retry settings returned by the API', () => {
    expect(
      buildRetrySettings({
        max_retries: 5,
        retry_delay_seconds: 15,
        retry_backoff: 'exponential',
        retry_max_delay_seconds: 900,
      })
    ).toEqual({
      enabled: true,
      maxRetries: '5',
      delaySeconds: '15',
      backoff: 'exponential',
      maxDelaySeconds: '900',
    });
  });

  it('encodes disabled retries as max_retries zero', () => {
    expect(buildRetryPayload(DEFAULT_RETRY_SETTINGS)).toEqual({
      max_retries: 0,
      retry_delay_seconds: 60,
      retry_backoff: 'fixed',
      retry_max_delay_seconds: 3600,
    });
  });

  it('serializes enabled exponential retries', () => {
    expect(
      buildRetryPayload({
        enabled: true,
        maxRetries: '4',
        delaySeconds: '30',
        backoff: 'exponential',
        maxDelaySeconds: '600',
      })
    ).toEqual({
      max_retries: 4,
      retry_delay_seconds: 30,
      retry_backoff: 'exponential',
      retry_max_delay_seconds: 600,
    });
  });

  it('uses valid API defaults for hidden invalid values', () => {
    expect(
      buildRetryPayload({
        enabled: false,
        maxRetries: '',
        delaySeconds: '',
        backoff: 'fixed',
        maxDelaySeconds: '',
      })
    ).toEqual({
      max_retries: 0,
      retry_delay_seconds: 60,
      retry_backoff: 'fixed',
      retry_max_delay_seconds: 3600,
    });
  });

  it.each([
    ['1', '1', 'fixed', ''],
    ['10', '86400', 'fixed', ''],
    ['1', '1', 'exponential', '1'],
    ['10', '86400', 'exponential', '86400'],
  ] as const)(
    'accepts valid values: retries=%s delay=%s backoff=%s maxDelay=%s',
    (maxRetries, delaySeconds, backoff, maxDelaySeconds) => {
      expect(
        isRetrySettingsValid({
          enabled: true,
          maxRetries,
          delaySeconds,
          backoff,
          maxDelaySeconds,
        })
      ).toBe(true);
    }
  );

  it.each([
    ['', '60', 'fixed', '3600'],
    ['0', '60', 'fixed', '3600'],
    ['11', '60', 'fixed', '3600'],
    ['1.5', '60', 'fixed', '3600'],
    ['1', '', 'fixed', '3600'],
    ['1', '0', 'fixed', '3600'],
    ['1', '86401', 'fixed', '3600'],
    ['1', '1.5', 'fixed', '3600'],
    ['1', '60', 'exponential', ''],
    ['1', '60', 'exponential', '86401'],
  ] as const)(
    'rejects invalid values: retries=%s delay=%s backoff=%s maxDelay=%s',
    (maxRetries, delaySeconds, backoff, maxDelaySeconds) => {
      expect(
        isRetrySettingsValid({
          enabled: true,
          maxRetries,
          delaySeconds,
          backoff,
          maxDelaySeconds,
        })
      ).toBe(false);
    }
  );

  it('ignores hidden field validation when retries are disabled', () => {
    expect(
      isRetrySettingsValid({
        enabled: false,
        maxRetries: '',
        delaySeconds: '',
        backoff: 'exponential',
        maxDelaySeconds: '',
      })
    ).toBe(true);
  });
});
