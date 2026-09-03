import {
  client,
  type CreateDatabaseRequest,
  type CreateSchemaRequest,
  type CreateTableFromSchemaRequest,
  type CreateTableFromSqlRequest,
  type GenerateSchemaDdlRequest,
  type GenerateTableDdl,
} from '@/shared/gatewayClient';

const unwrapData = async <T>(request: Promise<{ data: T }>): Promise<T> => {
  const response = await request;
  return response.data;
};

export const apiUtilsApi = {
  createTable: async (
    config: CreateTableFromSchemaRequest | CreateTableFromSqlRequest
  ) => {
    return unwrapData(
      client.utils.ddl.createTable.post({
        body: config,
      })
    );
  },

  generateTableDDL: async (config: GenerateTableDdl) => {
    return unwrapData(
      client.utils.ddl.generateTableDdl.post({
        body: config,
      })
    );
  },

  createSchema: async (config: CreateSchemaRequest) => {
    return unwrapData(
      client.utils.ddl.createSchema.post({
        body: config,
      })
    );
  },

  generateSchemaDDL: async (config: GenerateSchemaDdlRequest) => {
    return unwrapData(
      client.utils.ddl.generateSchemaDdl.post({
        body: config,
      })
    );
  },

  createDatabase: async (config: CreateDatabaseRequest) => {
    return unwrapData(
      client.utils.ddl.createDatabase.post({
        body: config,
      })
    );
  },

  getSqlCodeMetadata: async (
    connectionID: string,
    sqlCode: string,
    projectID?: string | undefined
  ) => {
    return unwrapData(
      client.utils.sqlCodeMetadata.post({
        body: {
          connection_id: connectionID,
          sql_code: sqlCode,
          project_id: projectID ?? null,
        },
      })
    );
  },
};

export const UtilsAPI = apiUtilsApi;
