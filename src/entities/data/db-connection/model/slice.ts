import {
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import {
  type ApiErrorPayload,
  createUnknownError,
  ensureApiErrorPayload,
  isApiError,
} from '@/shared/lib/errors';

import { invalidateDbCatalog } from '../api/dbCatalogApi';
import { dbConnectionsApi } from '../api/dbConnectionsApi';

import {
  buildStatusMessage,
  normalizeCatalog,
  normalizeConnection,
  normalizeConnections,
} from './adapters';
import type {
  DBConnectionCatalog,
  DBConnectionCreatePayload,
  DBConnectionListParams,
  DBConnectionRecord,
  DBConnectionsState,
  DBConnectionStatus,
  DBConnectionUpdatePayload,
} from './types';

const dbConnectionsAdapter = createEntityAdapter<DBConnectionRecord, string>({
  selectId: connection => connection.id,
});

const initialState: DBConnectionsState = dbConnectionsAdapter.getInitialState({
  statusesById: {},
  catalog: {
    data: null,
    isLoaded: false,
  },
  loading: {
    isFetching: false,
    isFetchingCatalog: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isChecking: false,
  },
  error: null,
  selectedConnectionId: null,
});

const resolveApiError = (error: unknown, fallback: string): ApiErrorPayload => {
  if (isApiError(error)) {
    return error.toPayload();
  }

  if (error instanceof Error) {
    return createUnknownError(error.message);
  }

  return createUnknownError(fallback);
};

const isAbortError = (error: {
  code?: unknown;
  message?: unknown;
  name?: unknown;
}) =>
  error.name === 'AbortError' ||
  error.name === 'CanceledError' ||
  error.code === 'ERR_CANCELED' ||
  error.message === 'canceled';

type ConnectionCheckArgs = {
  id: string;
  data?: DBConnectionUpdatePayload;
};

type ConnectionCheckFulfilled = {
  id: string;
  status: DBConnectionStatus;
};

export const fetchDBConnections = createAppAsyncThunk<
  DBConnectionRecord[],
  DBConnectionListParams | undefined
>(
  'dbConnections/fetchAll',
  async params => {
    const data = await dbConnectionsApi.list(params);
    return normalizeConnections(data);
  },
  {
    mapUnknownError: ({ error }) =>
      resolveApiError(error, 'Ошибка загрузки подключений'),
  }
);

export const fetchDBConnectionsCatalog = createAppAsyncThunk<
  DBConnectionCatalog,
  void
>(
  'dbConnections/fetchCatalog',
  async () => {
    const [kinds, types] = await Promise.all([
      dbConnectionsApi.kinds(),
      dbConnectionsApi.types(),
    ]);

    return normalizeCatalog(kinds, types);
  },
  {
    mapUnknownError: ({ error }) =>
      resolveApiError(error, 'Ошибка загрузки каталога подключений'),
  }
);

export const createDBConnection = createAppAsyncThunk<
  DBConnectionRecord,
  DBConnectionCreatePayload
>(
  'dbConnections/create',
  async (payload, { dispatch }) => {
    const created = await dbConnectionsApi.create(payload);
    const connection = normalizeConnection(created);

    dispatch(checkDBConnectionSilent({ id: connection.id }));

    return connection;
  },
  {
    mapUnknownError: ({ error }) =>
      resolveApiError(error, 'Ошибка создания подключения'),
  }
);

export const updateDBConnection = createAppAsyncThunk<
  DBConnectionRecord,
  { id: string; data: DBConnectionUpdatePayload }
>(
  'dbConnections/update',
  async ({ id, data }, { dispatch }) => {
    const updated = await dbConnectionsApi.update(id, data);
    const connection = normalizeConnection(updated);

    dispatch(checkDBConnectionSilent({ id: connection.id, data }));

    return connection;
  },
  {
    mapUnknownError: ({ error }) =>
      resolveApiError(error, 'Ошибка обновления подключения'),
  }
);

export const deleteDBConnection = createAppAsyncThunk<string, string>(
  'dbConnections/delete',
  async (id, { dispatch }) => {
    await dbConnectionsApi.remove(id);
    dispatch(invalidateDbCatalog(id));
    return id;
  },
  {
    mapUnknownError: ({ error }) =>
      resolveApiError(error, 'Ошибка удаления подключения'),
  }
);

export const checkDBConnection = createAppAsyncThunk<
  ConnectionCheckFulfilled,
  ConnectionCheckArgs
>(
  'dbConnections/check',
  async ({ id, data }, { getState, signal }) => {
    const response = await dbConnectionsApi.checkById(id, data, signal);
    const state = getState().dbConnections;
    const connection = state.entities[id];
    const baseStatus: DBConnectionStatus = {
      id,
      name: response.name ?? connection?.name ?? id,
      connected: Boolean(response.connected),
      message: response.message ?? null,
      exception: response.exception ?? null,
    };

    return {
      id,
      status: {
        ...baseStatus,
        message: buildStatusMessage(
          connection ?? { id, name: response.name ?? id },
          baseStatus
        ),
      },
    };
  },
  {
    mapUnknownError: ({ error }) =>
      isAbortError({
        code: (error as { code?: unknown } | null)?.code,
        message: (error as { message?: unknown } | null)?.message,
        name: (error as { name?: unknown } | null)?.name,
      })
        ? undefined
        : resolveApiError(error, 'Ошибка проверки подключения'),
  }
);

export const checkDBConnectionSilent = createAppAsyncThunk<
  ConnectionCheckFulfilled,
  ConnectionCheckArgs
>(
  'dbConnections/checkSilent',
  async ({ id, data }, { getState, signal }) => {
    const response = await dbConnectionsApi.checkById(id, data, signal);
    const state = getState().dbConnections;
    const connection = state.entities[id];

    return {
      id,
      status: {
        id,
        name: response.name ?? connection?.name ?? id,
        connected: Boolean(response.connected),
        message: response.message ?? null,
        exception: response.exception ?? null,
      },
    };
  },
  {
    mapUnknownError: ({ error }) =>
      isAbortError({
        code: (error as { code?: unknown } | null)?.code,
        message: (error as { message?: unknown } | null)?.message,
        name: (error as { name?: unknown } | null)?.name,
      })
        ? undefined
        : resolveApiError(error, 'Ошибка проверки подключения'),
  }
);

const isCheckRejectedByAbort = (action: {
  error: { message?: string | null; name?: string | null };
  meta: { aborted?: boolean };
  payload: ApiErrorPayload | undefined;
}) =>
  action.meta.aborted ||
  isAbortError({
    message: action.error.message ?? undefined,
    name: action.error.name ?? undefined,
  }) ||
  isAbortError({
    message: action.payload?.message,
  });

export const dbConnectionsSlice = createSlice({
  name: 'dbConnections',
  initialState,
  reducers: {
    clearDBConnectionsError(state) {
      state.error = null;
    },
    selectDBConnection(
      state,
      action: PayloadAction<DBConnectionRecord | null>
    ) {
      state.selectedConnectionId = action.payload?.id ?? null;
    },
    clearSelectedDBConnection(state) {
      state.selectedConnectionId = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDBConnections.pending, state => {
        state.loading.isFetching = true;
        state.error = null;
      })
      .addCase(fetchDBConnections.fulfilled, (state, action) => {
        state.loading.isFetching = false;
        dbConnectionsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchDBConnections.rejected, (state, action) => {
        state.loading.isFetching = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить подключения'
        ).message;
      })
      .addCase(fetchDBConnectionsCatalog.pending, state => {
        state.loading.isFetchingCatalog = true;
        state.error = null;
      })
      .addCase(fetchDBConnectionsCatalog.fulfilled, (state, action) => {
        state.loading.isFetchingCatalog = false;
        state.catalog = {
          data: action.payload,
          isLoaded: true,
        };
      })
      .addCase(fetchDBConnectionsCatalog.rejected, (state, action) => {
        state.loading.isFetchingCatalog = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить каталог подключений'
        ).message;
      })
      .addCase(createDBConnection.pending, state => {
        state.loading.isCreating = true;
        state.error = null;
      })
      .addCase(createDBConnection.fulfilled, (state, action) => {
        state.loading.isCreating = false;
        dbConnectionsAdapter.upsertOne(state, action.payload);
      })
      .addCase(createDBConnection.rejected, (state, action) => {
        state.loading.isCreating = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось создать подключение'
        ).message;
      })
      .addCase(updateDBConnection.pending, state => {
        state.loading.isUpdating = true;
        state.error = null;
      })
      .addCase(updateDBConnection.fulfilled, (state, action) => {
        state.loading.isUpdating = false;
        dbConnectionsAdapter.upsertOne(state, action.payload);
      })
      .addCase(updateDBConnection.rejected, (state, action) => {
        state.loading.isUpdating = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось обновить подключение'
        ).message;
      })
      .addCase(deleteDBConnection.pending, state => {
        state.loading.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteDBConnection.fulfilled, (state, action) => {
        state.loading.isDeleting = false;
        dbConnectionsAdapter.removeOne(state, action.payload);
        delete state.statusesById[action.payload];

        if (state.selectedConnectionId === action.payload) {
          state.selectedConnectionId = null;
        }
      })
      .addCase(deleteDBConnection.rejected, (state, action) => {
        state.loading.isDeleting = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось удалить подключение'
        ).message;
      })
      .addCase(checkDBConnection.pending, state => {
        state.loading.isChecking = true;
        state.error = null;
      })
      .addCase(checkDBConnection.fulfilled, (state, action) => {
        state.loading.isChecking = false;
        state.statusesById[action.payload.id] = action.payload.status;
      })
      .addCase(checkDBConnection.rejected, (state, action) => {
        state.loading.isChecking = false;

        if (isCheckRejectedByAbort(action)) {
          return;
        }

        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось проверить подключение'
        ).message;
      })
      .addCase(checkDBConnectionSilent.fulfilled, (state, action) => {
        state.statusesById[action.payload.id] = action.payload.status;
      })
      .addCase(checkDBConnectionSilent.rejected, (state, action) => {
        if (isCheckRejectedByAbort(action)) {
          return;
        }

        const payload = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось проверить подключение'
        );
        const id = action.meta.arg.id;
        const connection = state.entities[id];

        state.statusesById[id] = {
          id,
          name: connection?.name ?? id,
          connected: false,
          message: payload.message,
          exception: null,
        };
      });
  },
});

export const {
  clearDBConnectionsError,
  selectDBConnection,
  clearSelectedDBConnection,
} = dbConnectionsSlice.actions;

export const dbConnectionsReducer = dbConnectionsSlice.reducer;

export const dbConnectionsAdapterSelectors =
  dbConnectionsAdapter.getSelectors();
