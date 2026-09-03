import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import type { DataFrameData } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { dataframeApi, type GetDataFrameDataOptions } from '../api.ts';

export const DEFAULT_DATAFRAME_OUTPUT_NAME = 'output';
export const DEFAULT_DATAFRAME_OFFSET = 0;
export const DEFAULT_DATAFRAME_LIMIT = 1000;

export type DataFrameStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface DataFrameRequestOptions {
  projectID: string;
  nodeID: string;
  outputName?: string;
  offset?: number;
  limit?: number;
}

export type DataFrameRequestParams = GetDataFrameDataOptions;

export interface DataFrameCacheEntry {
  key: string;
  params: DataFrameRequestParams;
  status: DataFrameStatus;
  data: DataFrameData | null;
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;
}

export interface DataFrameSliceState {
  entries: Record<string, DataFrameCacheEntry>;
}

const initialState: DataFrameSliceState = {
  entries: {},
};

export const resolveDataFrameRequestParams = (
  options: DataFrameRequestOptions
): DataFrameRequestParams => ({
  projectID: options.projectID,
  nodeID: options.nodeID,
  outputName: options.outputName ?? DEFAULT_DATAFRAME_OUTPUT_NAME,
  offset: options.offset ?? DEFAULT_DATAFRAME_OFFSET,
  limit: options.limit ?? DEFAULT_DATAFRAME_LIMIT,
});

export const buildDataFrameRequestKey = (
  params: DataFrameRequestParams
): string =>
  [
    params.projectID,
    params.nodeID,
    params.outputName,
    params.offset,
    params.limit,
  ].join('::');

export interface FetchDataFrameSuccessPayload {
  key: string;
  params: DataFrameRequestParams;
  data: DataFrameData;
}

export const fetchDataFrameData = createAppAsyncThunk<
  FetchDataFrameSuccessPayload,
  DataFrameRequestParams
>('dataframe/fetchDataFrameData', async params => {
  const data = await dataframeApi.getDataFrameData(params);
  return {
    key: buildDataFrameRequestKey(params),
    params,
    data,
  };
});

const dataframeSlice = createSlice({
  name: 'dataframe',
  initialState,
  reducers: {
    clearDataFrameCache(state) {
      state.entries = {};
    },
    removeDataFrameEntry(state, action: PayloadAction<string>) {
      delete state.entries[action.payload];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDataFrameData.pending, (state, action) => {
        const params = action.meta.arg;
        const key = buildDataFrameRequestKey(params);

        const entry =
          state.entries[key] ??
          ({
            key,
            params,
            status: 'idle',
            data: null,
            error: null,
            lastUpdatedAt: null,
          } as DataFrameCacheEntry);

        entry.status = 'loading';
        entry.error = null;
        entry.data = null;
        entry.params = params;

        state.entries[key] = entry;
      })
      .addCase(fetchDataFrameData.fulfilled, (state, action) => {
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
      .addCase(fetchDataFrameData.rejected, (state, action) => {
        const params = action.meta.arg;
        const key = buildDataFrameRequestKey(params);
        const fallbackMessage =
          action.error.message ?? 'Не удалось загрузить данные DataFrame';

        const entry =
          state.entries[key] ??
          ({
            key,
            params,
            status: 'idle',
            data: null,
            error: null,
            lastUpdatedAt: null,
          } as DataFrameCacheEntry);

        entry.status = 'failed';
        entry.error = ensureApiErrorPayload(action.payload, fallbackMessage);
        entry.lastUpdatedAt = new Date().toISOString();
        entry.params = params;

        state.entries[key] = entry;
      });
  },
});

export const dataframeReducer = dataframeSlice.reducer;
export const { clearDataFrameCache, removeDataFrameEntry } =
  dataframeSlice.actions;
