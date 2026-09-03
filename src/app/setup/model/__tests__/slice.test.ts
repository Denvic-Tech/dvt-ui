import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import type { RootState } from '@/app/providers/store';

import type { SetupStatus } from '@/shared/gatewayClient';

import {
  selectSetupHasResolved,
  selectSetupIsInitialized,
  selectSetupSteps,
  selectSetupSubmitErrorByCode,
  selectSetupSubmitStatusByCode,
} from '../selectors';
import {
  fetchSetupStatus,
  resetSetupMutationState,
  setupReducer,
  submitSetupStep,
} from '../slice';

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
}));

const makeStatus = (initialized = false): SetupStatus => ({
  initialized,
  steps: [
    {
      code: 'organization',
      title: 'Create organization',
      description: 'Provide organization name.',
      submit_label: 'Create organization',
      completed: initialized,
      fields: initialized
        ? []
        : [
            {
              key: 'name',
              label: 'Organization name',
              type: 'text',
              required: true,
              nullable: false,
              value: null,
            },
          ],
    },
    {
      code: 'app_settings',
      title: 'Bootstrap AppSettings',
      description: 'Provide DCC URL.',
      submit_label: 'Save',
      completed: initialized,
      fields: initialized
        ? []
        : [
            {
              key: 'dcc.url',
              label: 'DCC URL',
              type: 'text',
              required: true,
              nullable: true,
              value: null,
            },
          ],
    },
  ],
});

describe('setup slice', () => {
  it('handles setup status loading lifecycle', () => {
    const pendingState = setupReducer(
      undefined,
      fetchSetupStatus.pending('req-1', undefined)
    );

    expect(pendingState.loadStatus).toBe('loading');

    const fulfilledState = setupReducer(
      pendingState,
      fetchSetupStatus.fulfilled(makeStatus(false), 'req-1', undefined)
    );

    expect(fulfilledState.loadStatus).toBe('succeeded');
    expect(fulfilledState.status?.initialized).toBe(false);
    expect(fulfilledState.status?.steps?.[0]?.code).toBe('organization');
  });

  it('stores submit state per step code and resets mutation state', () => {
    const afterSubmitPending = setupReducer(
      undefined,
      submitSetupStep.pending('req-submit', {
        code: 'organization',
        values: { name: 'Acme' },
      })
    );

    expect(afterSubmitPending.submitStatusByCode['organization']).toBe(
      'loading'
    );
    expect(afterSubmitPending.submitErrorByCode['organization']).toBeNull();

    const afterSubmit = setupReducer(
      afterSubmitPending,
      submitSetupStep.fulfilled(makeStatus(false), 'req-submit', {
        code: 'organization',
        values: { name: 'Acme' },
      })
    );

    expect(afterSubmit.submitStatusByCode['organization']).toBe('succeeded');
    expect(afterSubmit.status?.steps?.[0]?.completed).toBe(false);

    const resetState = setupReducer(afterSubmit, resetSetupMutationState());

    expect(resetState.submitStatusByCode).toEqual({});
    expect(resetState.submitErrorByCode).toEqual({});
  });

  it('selectors derive initialization state and submit state', () => {
    const setupState = setupReducer(
      undefined,
      fetchSetupStatus.fulfilled(makeStatus(false), 'req-2', undefined)
    );
    const state = {
      setup: {
        ...setupState,
        submitStatusByCode: {
          organization: 'failed',
        },
        submitErrorByCode: {
          organization: {
            code: 'HTTP_422',
            message: 'Validation failed',
          },
        },
      },
    } as unknown as RootState;

    expect(selectSetupHasResolved(state)).toBe(true);
    expect(selectSetupIsInitialized(state)).toBe(false);
    expect(selectSetupSteps(state)).toHaveLength(2);
    expect(selectSetupSubmitStatusByCode('organization')(state)).toBe('failed');
    expect(selectSetupSubmitStatusByCode('missing')(state)).toBe('idle');
    expect(selectSetupSubmitErrorByCode('organization')(state)?.message).toBe(
      'Validation failed'
    );
  });

  it('selectSetupSteps returns stable empty array when setup status is missing', () => {
    const state = {
      setup: setupReducer(undefined, { type: 'unknown' }),
    } as unknown as RootState;

    const firstResult = selectSetupSteps(state);
    const secondResult = selectSetupSteps(state);

    expect(firstResult).toBe(secondResult);
    expect(firstResult).toEqual([]);
  });
});
