import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';

import { dbConnectionsAdapterSelectors } from './slice';
import type { DBConnectionsState } from './types';

export const selectDbConnectionsState = (
  state: RootState
): DBConnectionsState => state.dbConnections;

export const selectDbConnections = createSelector(
  [selectDbConnectionsState],
  state => dbConnectionsAdapterSelectors.selectAll(state)
);

export const selectDbConnectionsEntities = createSelector(
  [selectDbConnectionsState],
  state => dbConnectionsAdapterSelectors.selectEntities(state)
);

export const selectDbConnectionsLoadingState = createSelector(
  [selectDbConnectionsState],
  state => state.loading
);

export const selectDbConnectionsLoading = createSelector(
  [selectDbConnectionsLoadingState],
  loading =>
    loading.isFetching ||
    loading.isFetchingCatalog ||
    loading.isCreating ||
    loading.isUpdating ||
    loading.isDeleting ||
    loading.isChecking
);

export const selectDbConnectionsError = createSelector(
  [selectDbConnectionsState],
  state => state.error
);

export const selectDbConnectionsCatalogState = createSelector(
  [selectDbConnectionsState],
  state => state.catalog
);

export const selectDbConnectionsCatalog = createSelector(
  [selectDbConnectionsCatalogState],
  state => state.data
);

export const selectDbConnectionsKinds = createSelector(
  [selectDbConnectionsCatalog],
  catalog => catalog?.kinds ?? []
);

export const selectDbConnectionsTypes = createSelector(
  [selectDbConnectionsCatalog],
  catalog => catalog?.types ?? []
);

export const selectDbConnectionsStatuses = createSelector(
  [selectDbConnectionsState],
  state =>
    Object.values(state.statusesById).filter(status => status !== undefined)
);

export const selectSelectedDbConnection = createSelector(
  [selectDbConnectionsState, selectDbConnectionsEntities],
  (state, entities) =>
    state.selectedConnectionId
      ? (entities[state.selectedConnectionId] ?? null)
      : null
);
