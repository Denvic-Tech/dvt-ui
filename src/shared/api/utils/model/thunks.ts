import { createAppAsyncThunk } from '@/app/providers/store';

import {
  apiUtilsApi,
  CreateDatabaseArgs,
  CreateDatabaseResult,
  CreateSchemaArgs,
  CreateSchemaResult,
  CreateTableArgs,
  CreateTableResult,
  GenerateSchemaDDLArgs,
  GenerateSchemaDDLResult,
  GenerateTableDDLArgs,
  GenerateTableDDLResult,
} from '@/shared/api/utils';
import { GetSQLCodeMetadataResult } from '@/shared/api/utils/model/types';

export const createTableThunk = createAppAsyncThunk<
  CreateTableResult,
  CreateTableArgs
>('apiUtils/createTable', payload => apiUtilsApi.createTable(payload));

export const generateTableDDLThunk = createAppAsyncThunk<
  GenerateTableDDLResult,
  GenerateTableDDLArgs
>('apiUtils/generateTableDDL', payload =>
  apiUtilsApi.generateTableDDL(payload)
);

export const createSchemaThunk = createAppAsyncThunk<
  CreateSchemaResult,
  CreateSchemaArgs
>('apiUtils/createSchema', payload => apiUtilsApi.createSchema(payload));

export const generateSchemaDDLThunk = createAppAsyncThunk<
  GenerateSchemaDDLResult,
  GenerateSchemaDDLArgs
>('apiUtils/generateSchemaDDL', payload =>
  apiUtilsApi.generateSchemaDDL(payload)
);

export const createDatabaseThunk = createAppAsyncThunk<
  CreateDatabaseResult,
  CreateDatabaseArgs
>('apiUtils/createDatabase', payload => apiUtilsApi.createDatabase(payload));

export const getSQLCodeMetadataThunk = createAppAsyncThunk<
  GetSQLCodeMetadataResult,
  { connectionID: string; sqlCode: string }
>('apiUtils/getSQLCodeMetadata', payload =>
  apiUtilsApi.getSqlCodeMetadata(payload.connectionID, payload.sqlCode)
);
