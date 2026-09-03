import type { RootState } from '@/app/providers/store/rootReducer';

import { buildAppSettingsNamespaces } from './adapters';
import type { AppSettingsSliceState } from './types';

export const selectAppSettingsState = (
  state: RootState
): AppSettingsSliceState => state.appSettings;

export const selectAppSettings = (state: RootState) =>
  selectAppSettingsState(state).settings;

export const selectAppSettingsDefinitions = (state: RootState) =>
  selectAppSettingsState(state).definitions;

export const selectAppSettingsNamespaces = (state: RootState) =>
  buildAppSettingsNamespaces(selectAppSettingsDefinitions(state));

export const selectAppSettingsStatus = (state: RootState) =>
  selectAppSettingsState(state).status;

export const selectAppSettingsDefinitionsStatus = (state: RootState) =>
  selectAppSettingsState(state).definitionsStatus;

export const selectAppSettingsError = (state: RootState) =>
  selectAppSettingsState(state).error;

export const selectAppSettingsDefinitionsError = (state: RootState) =>
  selectAppSettingsState(state).definitionsError;

export const selectAppSettingsUpsertStatus = (state: RootState) =>
  selectAppSettingsState(state).upsertStatus;

export const selectAppSettingsUpsertError = (state: RootState) =>
  selectAppSettingsState(state).upsertError;

export const selectAppSettingsActiveNamespace = (state: RootState) =>
  selectAppSettingsState(state).activeNamespace;

export const selectAppSettingsActiveKey = (state: RootState) =>
  selectAppSettingsState(state).activeKey;

export const selectAppSettingsLastUpdatedAt = (state: RootState) =>
  selectAppSettingsState(state).lastUpdatedAt;

export const selectAppSettingsIsLoading = (state: RootState): boolean => {
  const appSettingsState = selectAppSettingsState(state);

  return (
    appSettingsState.status === 'loading' ||
    appSettingsState.definitionsStatus === 'loading' ||
    appSettingsState.upsertStatus === 'loading' ||
    appSettingsState.setValueStatus === 'loading' ||
    appSettingsState.deleteValueStatus === 'loading'
  );
};
