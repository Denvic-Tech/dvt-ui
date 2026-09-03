import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import {
  createDatabaseThunk,
  createSchemaThunk,
  createTableThunk,
  generateSchemaDDLThunk,
  generateTableDDLThunk,
  getSQLCodeMetadataThunk,
} from '@/shared/api/utils/model/thunks';
import {
  CreateDatabaseArgs,
  CreateSchemaArgs,
  CreateTableArgs,
  GenerateSchemaDDLArgs,
  GenerateTableDDLArgs,
} from '@/shared/api/utils/model/types';

import { selectApiUtilsIsLoading, selectApiUtilsState } from './selectors';
import { resetApiUtilsState } from './slice';

export const useApiUtils = () => {
  const dispatch = useAppDispatch();
  const apiUtilsState = useAppSelector(selectApiUtilsState);
  const isLoading = useAppSelector(selectApiUtilsIsLoading);

  const createTable = useCallback(
    (payload: CreateTableArgs) => dispatch(createTableThunk(payload)).unwrap(),
    [dispatch]
  );

  const generateTableDDL = useCallback(
    (payload: GenerateTableDDLArgs) =>
      dispatch(generateTableDDLThunk(payload)).unwrap(),
    [dispatch]
  );

  const createSchema = useCallback(
    (payload: CreateSchemaArgs) =>
      dispatch(createSchemaThunk(payload)).unwrap(),
    [dispatch]
  );

  const generateSchemaDDL = useCallback(
    (payload: GenerateSchemaDDLArgs) =>
      dispatch(generateSchemaDDLThunk(payload)).unwrap(),
    [dispatch]
  );

  const createDatabase = useCallback(
    (payload: CreateDatabaseArgs) =>
      dispatch(createDatabaseThunk(payload)).unwrap(),
    [dispatch]
  );

  const getSQLCodeMetadata = useCallback(
    (connectionID: string, sqlCode: string) =>
      dispatch(getSQLCodeMetadataThunk({ connectionID, sqlCode })).unwrap(),
    [dispatch]
  );

  const resetState = useCallback(() => {
    dispatch(resetApiUtilsState());
  }, [dispatch]);

  return {
    createTableState: apiUtilsState.createTable,
    generateTableDDLState: apiUtilsState.generateTableDDL,
    createSchemaState: apiUtilsState.createSchema,
    generateSchemaDDLState: apiUtilsState.generateSchemaDDL,
    createDatabaseState: apiUtilsState.createDatabase,
    getSQLCodeMetadataState: apiUtilsState.getSQLCodeMetadata,
    isLoading,
    createTable,
    generateTableDDL,
    createSchema,
    generateSchemaDDL,
    createDatabase,
    getSQLCodeMetadata,
    resetState,
  } as const;
};
