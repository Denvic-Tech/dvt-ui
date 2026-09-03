import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { PublishedNodeDocumentationSchema } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { fetchNodeDocumentation } from './thunks';

export interface NodeDocumentationRequestParams {
  language: string;
  nodeName: string;
}

export interface NodeDocumentationEntry {
  data: PublishedNodeDocumentationSchema | null;
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

export interface NodeDocumentationState {
  entriesByKey: Record<string, NodeDocumentationEntry | undefined>;
}

export const buildNodeDocumentationRequestKey = ({
  language,
  nodeName,
}: NodeDocumentationRequestParams): string => `${language}::${nodeName}`;

const createInitialEntry = (): NodeDocumentationEntry => ({
  data: null,
  error: null,
  lastUpdatedAt: null,
  status: 'idle',
});

const initialState: NodeDocumentationState = {
  entriesByKey: {},
};

export const nodeDocumentationSlice = createSlice({
  name: 'nodeDocumentation',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchNodeDocumentation.pending, (state, action) => {
        const key = buildNodeDocumentationRequestKey(action.meta.arg);
        const currentEntry = state.entriesByKey[key] ?? createInitialEntry();

        state.entriesByKey[key] = {
          ...currentEntry,
          error: null,
          status: 'loading',
        };
      })
      .addCase(
        fetchNodeDocumentation.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: PublishedNodeDocumentationSchema;
            key: string;
            params: NodeDocumentationRequestParams;
          }>
        ) => {
          state.entriesByKey[action.payload.key] = {
            data: action.payload.data,
            error: null,
            lastUpdatedAt: new Date().toISOString(),
            status: 'succeeded',
          };
        }
      )
      .addCase(fetchNodeDocumentation.rejected, (state, action) => {
        const key = buildNodeDocumentationRequestKey(action.meta.arg);
        const currentEntry = state.entriesByKey[key] ?? createInitialEntry();

        state.entriesByKey[key] = {
          ...currentEntry,
          error: ensureApiErrorPayload(
            action.payload,
            'Не удалось загрузить документацию ноды'
          ),
          status: 'failed',
        };
      });
  },
});

export const nodeDocumentationReducer = nodeDocumentationSlice.reducer;
