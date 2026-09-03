import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';

import {
  appSettingsApi,
  type AppSettingsQueryOptions,
} from '../../api/appSettingsApi';
import {
  selectAppSettings,
  selectAppSettingsActiveKey,
  selectAppSettingsActiveNamespace,
  selectAppSettingsDefinitions,
  selectAppSettingsDefinitionsError,
  selectAppSettingsDefinitionsStatus,
  selectAppSettingsError,
  selectAppSettingsIsLoading,
  selectAppSettingsLastUpdatedAt,
  selectAppSettingsNamespaces,
  selectAppSettingsStatus,
  selectAppSettingsUpsertError,
  selectAppSettingsUpsertStatus,
} from '../selectors';
import {
  deleteAppSettingsValue,
  fetchAppSettings,
  fetchAppSettingsDefinitions,
  resetAppSettingsMutationState,
  resetAppSettingsState,
  setAppSettingsValue,
  type SetAppSettingsValueArgs,
  upsertAppSettings,
  type UpsertAppSettingsArgs,
} from '../slice';

export const useAppSettings = () => {
  const dispatch = useAppDispatch();

  const settings = useAppSelector(selectAppSettings);
  const definitions = useAppSelector(selectAppSettingsDefinitions);
  const namespaces = useAppSelector(selectAppSettingsNamespaces);
  const status = useAppSelector(selectAppSettingsStatus);
  const definitionsStatus = useAppSelector(selectAppSettingsDefinitionsStatus);
  const error = useAppSelector(selectAppSettingsError);
  const definitionsError = useAppSelector(selectAppSettingsDefinitionsError);
  const upsertStatus = useAppSelector(selectAppSettingsUpsertStatus);
  const upsertError = useAppSelector(selectAppSettingsUpsertError);
  const activeNamespace = useAppSelector(selectAppSettingsActiveNamespace);
  const activeKey = useAppSelector(selectAppSettingsActiveKey);
  const lastUpdatedAt = useAppSelector(selectAppSettingsLastUpdatedAt);
  const isLoading = useAppSelector(selectAppSettingsIsLoading);

  const loadDefinitions = useCallback(
    () => dispatch(fetchAppSettingsDefinitions()).unwrap(),
    [dispatch]
  );

  const loadSettings = useCallback(
    (options?: AppSettingsQueryOptions) =>
      dispatch(fetchAppSettings(options)).unwrap(),
    [dispatch]
  );

  const loadAll = useCallback(
    async (options?: AppSettingsQueryOptions) => {
      const [nextDefinitions, nextSettings] = await Promise.all([
        dispatch(fetchAppSettingsDefinitions()).unwrap(),
        dispatch(fetchAppSettings(options)).unwrap(),
      ]);

      return {
        definitions: nextDefinitions,
        settings: nextSettings,
      };
    },
    [dispatch]
  );

  const saveSettings = useCallback(
    (payload: UpsertAppSettingsArgs) =>
      dispatch(upsertAppSettings(payload)).unwrap(),
    [dispatch]
  );

  const updateValue = useCallback(
    (payload: SetAppSettingsValueArgs) =>
      dispatch(setAppSettingsValue(payload)).unwrap(),
    [dispatch]
  );

  const removeValue = useCallback(
    (key: string) => dispatch(deleteAppSettingsValue(key)).unwrap(),
    [dispatch]
  );

  const getValue = useCallback(
    (key: string, options?: AppSettingsQueryOptions) =>
      appSettingsApi.getValue(key, options),
    []
  );

  const getHistory = useCallback(
    (key: string) => appSettingsApi.history(key),
    []
  );

  const resetState = useCallback(() => {
    dispatch(resetAppSettingsState());
  }, [dispatch]);

  const resetMutationState = useCallback(() => {
    dispatch(resetAppSettingsMutationState());
  }, [dispatch]);

  return {
    settings,
    definitions,
    namespaces,
    status,
    definitionsStatus,
    error,
    definitionsError,
    upsertStatus,
    upsertError,
    activeNamespace,
    activeKey,
    lastUpdatedAt,
    isLoading,
    loadDefinitions,
    loadSettings,
    loadAll,
    saveSettings,
    updateValue,
    removeValue,
    getValue,
    getHistory,
    resetState,
    resetMutationState,
  } as const;
};
