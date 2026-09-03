import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import {
  buildNodeDocumentationRequestKey,
  nodeDocumentationReducer,
} from '../slice';
import { fetchNodeDocumentation } from '../thunks';

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
}));

const params = {
  language: 'ru-RU',
  nodeName: 'expand_json',
};

const key = buildNodeDocumentationRequestKey(params);

describe('node-documentation slice', () => {
  it('stores loading and successful documentation payload', () => {
    const pending = nodeDocumentationReducer(
      undefined,
      fetchNodeDocumentation.pending('req-doc', params)
    );

    expect(pending.entriesByKey[key]?.status).toBe('loading');
    expect(pending.entriesByKey[key]?.error).toBeNull();

    const fulfilled = nodeDocumentationReducer(
      pending,
      fetchNodeDocumentation.fulfilled(
        {
          data: {
            content: '# Expand JSON',
            locale: 'ru-RU',
            node_name: 'expand_json',
          },
          key,
          params,
        },
        'req-doc',
        params
      )
    );

    expect(fulfilled.entriesByKey[key]?.status).toBe('succeeded');
    expect(fulfilled.entriesByKey[key]?.data?.content).toBe('# Expand JSON');
    expect(fulfilled.entriesByKey[key]?.data?.locale).toBe('ru-RU');
    expect(fulfilled.entriesByKey[key]?.lastUpdatedAt).toEqual(
      expect.any(String)
    );
  });

  it('stores failure payload for the matching request key', () => {
    const rejected = nodeDocumentationReducer(
      undefined,
      fetchNodeDocumentation.rejected(new Error('fail'), 'req-doc', params, {
        code: 'DOC_FETCH_FAILED',
        message: 'Не удалось получить документацию',
      })
    );

    expect(rejected.entriesByKey[key]?.status).toBe('failed');
    expect(rejected.entriesByKey[key]?.error).toMatchObject({
      code: 'DOC_FETCH_FAILED',
      message: 'Не удалось получить документацию',
    });
  });
});
