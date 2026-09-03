import { createSlice } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import {
  appSettingsApi,
  type AppSettingsQueryOptions,
} from '../api/appSettingsApi';

import type {
  AppSettingsDefinition,
  AppSettingsRecord,
  AppSettingsSliceState,
  AppSettingsUpdatePayload,
} from './types';

export interface UpsertAppSettingsArgs extends AppSettingsQueryOptions {
  namespace?: string | undefined;
  values: AppSettingsUpdatePayload;
}

export interface SetAppSettingsValueArgs extends AppSettingsQueryOptions {
  key: string;
  value: unknown;
}

const initialState: AppSettingsSliceState = {
  settings: null,
  definitions: [],
  status: 'idle',
  error: null,
  definitionsStatus: 'idle',
  definitionsError: null,
  upsertStatus: 'idle',
  upsertError: null,
  setValueStatus: 'idle',
  setValueError: null,
  deleteValueStatus: 'idle',
  deleteValueError: null,
  activeNamespace: null,
  activeKey: null,
  lastUpdatedAt: null,
};

const getErrorPayload = (
  payload: ApiErrorPayload | undefined,
  fallback: string
) => ensureApiErrorPayload(payload, fallback);

export const fetchAppSettingsDefinitions = createAppAsyncThunk<
  AppSettingsDefinition[]
>('appSettings/fetchDefinitions', () => appSettingsApi.definitions());

export const fetchAppSettings = createAppAsyncThunk<
  AppSettingsRecord,
  AppSettingsQueryOptions | undefined
>('appSettings/fetch', async options => {
  const settings = await appSettingsApi.get(options);
  return settings as AppSettingsRecord;
});

export const upsertAppSettings = createAppAsyncThunk<
  AppSettingsRecord,
  UpsertAppSettingsArgs
>('appSettings/upsert', async ({ values, ...options }) => {
  const settings = await appSettingsApi.upsert(values, options);
  return settings as AppSettingsRecord;
});

export const setAppSettingsValue = createAppAsyncThunk<
  unknown,
  SetAppSettingsValueArgs
>('appSettings/setValue', ({ key, value, ...options }) =>
  appSettingsApi.setValue(key, value, options)
);

export const deleteAppSettingsValue = createAppAsyncThunk<string, string>(
  'appSettings/deleteValue',
  async key => {
    await appSettingsApi.deleteValue(key);
    return key;
  }
);

const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {
    resetAppSettingsState: () => initialState,
    resetAppSettingsMutationState: state => {
      state.upsertStatus = 'idle';
      state.upsertError = null;
      state.setValueStatus = 'idle';
      state.setValueError = null;
      state.deleteValueStatus = 'idle';
      state.deleteValueError = null;
      state.activeNamespace = null;
      state.activeKey = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAppSettingsDefinitions.pending, state => {
        state.definitionsStatus = 'loading';
        state.definitionsError = null;
      })
      .addCase(fetchAppSettingsDefinitions.fulfilled, (state, action) => {
        state.definitionsStatus = 'succeeded';
        state.definitionsError = null;
        state.definitions = action.payload;
      })
      .addCase(fetchAppSettingsDefinitions.rejected, (state, action) => {
        state.definitionsStatus = 'failed';
        state.definitionsError = getErrorPayload(
          action.payload,
          action.error.message ??
            'Не удалось загрузить определения AppSettings.'
        );
      })

      .addCase(fetchAppSettings.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAppSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.settings = action.payload;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(fetchAppSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = getErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить AppSettings.'
        );
      })

      .addCase(upsertAppSettings.pending, (state, action) => {
        state.upsertStatus = 'loading';
        state.upsertError = null;
        state.activeNamespace = action.meta.arg.namespace ?? null;
      })
      .addCase(upsertAppSettings.fulfilled, (state, action) => {
        state.upsertStatus = 'succeeded';
        state.upsertError = null;
        state.activeNamespace = null;
        state.settings = action.payload;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(upsertAppSettings.rejected, (state, action) => {
        state.upsertStatus = 'failed';
        state.upsertError = getErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось сохранить AppSettings.'
        );
        state.activeNamespace = null;
      })

      .addCase(setAppSettingsValue.pending, (state, action) => {
        state.setValueStatus = 'loading';
        state.setValueError = null;
        state.activeKey = action.meta.arg.key;
      })
      .addCase(setAppSettingsValue.fulfilled, state => {
        state.setValueStatus = 'succeeded';
        state.setValueError = null;
        state.activeKey = null;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(setAppSettingsValue.rejected, (state, action) => {
        state.setValueStatus = 'failed';
        state.setValueError = getErrorPayload(
          action.payload,
          action.error.message ??
            'Не удалось обновить отдельное значение AppSettings.'
        );
        state.activeKey = null;
      })

      .addCase(deleteAppSettingsValue.pending, (state, action) => {
        state.deleteValueStatus = 'loading';
        state.deleteValueError = null;
        state.activeKey = action.meta.arg;
      })
      .addCase(deleteAppSettingsValue.fulfilled, state => {
        state.deleteValueStatus = 'succeeded';
        state.deleteValueError = null;
        state.activeKey = null;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(deleteAppSettingsValue.rejected, (state, action) => {
        state.deleteValueStatus = 'failed';
        state.deleteValueError = getErrorPayload(
          action.payload,
          action.error.message ??
            'Не удалось удалить отдельное значение AppSettings.'
        );
        state.activeKey = null;
      });
  },
});

export const appSettingsReducer = appSettingsSlice.reducer;

export const { resetAppSettingsState, resetAppSettingsMutationState } =
  appSettingsSlice.actions;
