import type { RootState } from '@/app/providers/store';

import type { ApiUtilsSliceState } from './slice';

export const selectApiUtilsState = (state: RootState): ApiUtilsSliceState =>
  state.apiUtils;

export const selectCreateTableState = (state: RootState) =>
  selectApiUtilsState(state).createTable;

export const selectGenerateTableDDLState = (state: RootState) =>
  selectApiUtilsState(state).generateTableDDL;

export const selectCreateSchemaState = (state: RootState) =>
  selectApiUtilsState(state).createSchema;

export const selectGenerateSchemaDDLState = (state: RootState) =>
  selectApiUtilsState(state).generateSchemaDDL;

export const selectCreateDatabaseState = (state: RootState) =>
  selectApiUtilsState(state).createDatabase;

export const selectApiUtilsIsLoading = (state: RootState): boolean => {
  const apiUtilsState = selectApiUtilsState(state);

  return (
    apiUtilsState.createTable.status === 'loading' ||
    apiUtilsState.generateTableDDL.status === 'loading' ||
    apiUtilsState.createSchema.status === 'loading' ||
    apiUtilsState.generateSchemaDDL.status === 'loading' ||
    apiUtilsState.createDatabase.status === 'loading'
  );
};
