import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';
import type { JsonData } from '@/shared/gatewayClient';
import {
  ensureApiErrorPayload,
  type ApiErrorPayload,
} from '@/shared/lib/errors';

import { jsonDataApi, type GetJsonDataOptions } from '../api.ts';

export const DEFAULT_JSON_OUTPUT_NAME = 'output';
export const DEFAULT_JSON_OFFSET = 0;
export const DEFAULT_JSON_LIMIT = 200;

export type JsonDataStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface JsonDataRequestOptions {
  projectID: string;
  nodeID: string;
  outputName?: string;
  offset?: number;
  limit?: number;
}

export type JsonDataRequestParams = GetJsonDataOptions;

export interface JsonDataCacheEntry {
  key: string;
  params: JsonDataRequestParams;
  status: JsonDataStatus;
  data: JsonData | null;
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;
}

export interface JsonDataSliceState {
  entries: Record<string, JsonDataCacheEntry>;
}

const initialState: JsonDataSliceState = {
  entries: {},
};

export const resolveJsonDataRequestParams = (
  options: JsonDataRequestOptions
): JsonDataRequestParams => ({
  projectID: options.projectID,
  nodeID: options.nodeID,
  outputName: options.outputName ?? DEFAULT_JSON_OUTPUT_NAME,
  offset: options.offset ?? DEFAULT_JSON_OFFSET,
  limit: options.limit ?? DEFAULT_JSON_LIMIT,
});

export const buildJsonDataRequestKey = (
  params: JsonDataRequestParams
): string =>
  [
    params.projectID,
    params.nodeID,
    params.outputName,
    params.offset,
    params.limit,
  ].join('::');

export interface FetchJsonDataSuccessPayload {
  key: string;
  params: JsonDataRequestParams;
  data: JsonData;
}

export const fetchJsonData = createAppAsyncThunk<
  FetchJsonDataSuccessPayload,
  JsonDataRequestParams
>('jsonData/fetchJsonData', async params => {
  const data = await jsonDataApi.getJsonData(params);
  return {
    key: buildJsonDataRequestKey(params),
    params,
    data,
  };
});

const jsonDataSlice = createSlice({
  name: 'jsonData',
  initialState,
  reducers: {
    clearJsonDataCache(state) {
      state.entries = {};
    },
    removeJsonDataEntry(state, action: PayloadAction<string>) {
      delete state.entries[action.payload];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchJsonData.pending, (state, action) => {
        const params = action.meta.arg;
        const key = buildJsonDataRequestKey(params);

        const entry =
          state.entries[key] ??
          ({
            key,
            params,
            status: 'idle',
            data: null,
            error: null,
            lastUpdatedAt: null,
          } as JsonDataCacheEntry);

        entry.status = 'loading';
        entry.error = null;
        entry.params = params;

        state.entries[key] = entry;
      })
      .addCase(fetchJsonData.fulfilled, (state, action) => {
        const { key, params, data } = action.payload;

        state.entries[key] = {
          key,
          params,
          status: 'succeeded',
          data,
          error: null,
          lastUpdatedAt: new Date().toISOString(),
        };
      })
      .addCase(fetchJsonData.rejected, (state, action) => {
        const params = action.meta.arg;
        const key = buildJsonDataRequestKey(params);
        const fallbackMessage =
          action.error.message ?? 'Не удалось загрузить JSON-выход ноды';

        const entry =
          state.entries[key] ??
          ({
            key,
            params,
            status: 'idle',
            data: null,
            error: null,
            lastUpdatedAt: null,
          } as JsonDataCacheEntry);

        entry.status = 'failed';
        entry.error = ensureApiErrorPayload(action.payload, fallbackMessage);
        entry.lastUpdatedAt = new Date().toISOString();
        entry.params = params;

        state.entries[key] = entry;
      });
  },
});

export const jsonDataReducer = jsonDataSlice.reducer;
export const { clearJsonDataCache, removeJsonDataEntry } =
  jsonDataSlice.actions;
