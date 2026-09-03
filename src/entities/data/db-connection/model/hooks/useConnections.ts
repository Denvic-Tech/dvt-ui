import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectDbConnections,
  selectDbConnectionsCatalog,
  selectDbConnectionsEntities,
  selectDbConnectionsError,
  selectDbConnectionsKinds,
  selectDbConnectionsLoading,
  selectDbConnectionsLoadingState,
  selectDbConnectionsState,
  selectDbConnectionsStatuses,
  selectDbConnectionsTypes,
  selectSelectedDbConnection,
} from '../selectors';
import {
  checkDBConnection,
  checkDBConnectionSilent,
  clearDBConnectionsError,
  clearSelectedDBConnection,
  createDBConnection,
  deleteDBConnection,
  fetchDBConnections,
  fetchDBConnectionsCatalog,
  selectDBConnection,
  updateDBConnection,
} from '../slice';
import type {
  DBConnectionCreatePayload,
  DBConnectionListParams,
  DBConnectionUpdatePayload,
} from '../types';

import { linkAbortSignalToThunkPromise } from './abortableThunk';

export const useConnections = () => {
  const dispatch = useAppDispatch();
  const connections = useAppSelector(selectDbConnections);
  const entities = useAppSelector(selectDbConnectionsEntities);
  const state = useAppSelector(selectDbConnectionsState);
  const catalog = useAppSelector(selectDbConnectionsCatalog);
  const kinds = useAppSelector(selectDbConnectionsKinds);
  const types = useAppSelector(selectDbConnectionsTypes);
  const connectionStatuses = useAppSelector(selectDbConnectionsStatuses);
  const loading = useAppSelector(selectDbConnectionsLoading);
  const loadingState = useAppSelector(selectDbConnectionsLoadingState);
  const error = useAppSelector(selectDbConnectionsError);
  const selectedConnection = useAppSelector(selectSelectedDbConnection);

  const fetchConnections = useCallback(
    (params?: DBConnectionListParams) => dispatch(fetchDBConnections(params)),
    [dispatch]
  );

  const fetchCatalog = useCallback(
    () => dispatch(fetchDBConnectionsCatalog()),
    [dispatch]
  );

  const createConnection = useCallback(
    (payload: DBConnectionCreatePayload) =>
      dispatch(createDBConnection(payload)),
    [dispatch]
  );

  const updateConnection = useCallback(
    (id: string, data: DBConnectionUpdatePayload) =>
      dispatch(updateDBConnection({ id, data })),
    [dispatch]
  );

  const deleteConnection = useCallback(
    (id: string) => dispatch(deleteDBConnection(id)),
    [dispatch]
  );

  const checkConnection = useCallback(
    (id: string, data?: DBConnectionUpdatePayload, signal?: AbortSignal) => {
      const thunkPromise = dispatch(
        checkDBConnection(data ? { id, data } : { id })
      );
      return linkAbortSignalToThunkPromise(thunkPromise, signal).unwrap();
    },
    [dispatch]
  );

  const checkConnectionSilent = useCallback(
    (id: string, data?: DBConnectionUpdatePayload, signal?: AbortSignal) => {
      const thunkPromise = dispatch(
        checkDBConnectionSilent(data ? { id, data } : { id })
      );

      return linkAbortSignalToThunkPromise(thunkPromise, signal).unwrap();
    },
    [dispatch]
  );

  const clearErrors = useCallback(() => {
    dispatch(clearDBConnectionsError());
  }, [dispatch]);

  const selectConnectionById = useCallback(
    (id: string) => {
      dispatch(selectDBConnection(entities[id] ?? null));
    },
    [dispatch, entities]
  );

  const clearSelected = useCallback(() => {
    dispatch(clearSelectedDBConnection());
  }, [dispatch]);

  const getConnectionById = useCallback(
    (id: string) => entities[id],
    [entities]
  );

  const getConnectionStatus = useCallback(
    (id: string) => state.statusesById[id],
    [state.statusesById]
  );

  return {
    connections,
    catalog,
    kinds,
    types,
    connectionStatuses,
    loading,
    loadingState,
    error,
    selectedConnection,

    fetchConnections,
    fetchCatalog,
    createConnection,
    updateConnection,
    deleteConnection,
    checkConnection,
    checkConnectionSilent,
    clearErrors,
    selectConnectionById,
    clearSelected,
    getConnectionById,
    getConnectionStatus,
  };
};
