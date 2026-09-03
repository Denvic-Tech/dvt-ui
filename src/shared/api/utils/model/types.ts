import { apiUtilsApi } from '../api';

export type CreateTableArgs = Parameters<typeof apiUtilsApi.createTable>[0];

export type CreateTableResult = Awaited<
  ReturnType<typeof apiUtilsApi.createTable>
>;

export type GenerateTableDDLArgs = Parameters<
  typeof apiUtilsApi.generateTableDDL
>[0];

export type GenerateTableDDLResult = Awaited<
  ReturnType<typeof apiUtilsApi.generateTableDDL>
>;

export type CreateSchemaArgs = Parameters<typeof apiUtilsApi.createSchema>[0];

export type CreateSchemaResult = Awaited<
  ReturnType<typeof apiUtilsApi.createSchema>
>;

export type GenerateSchemaDDLArgs = Parameters<
  typeof apiUtilsApi.generateSchemaDDL
>[0];

export type GenerateSchemaDDLResult = Awaited<
  ReturnType<typeof apiUtilsApi.generateSchemaDDL>
>;

export type CreateDatabaseArgs = Parameters<
  typeof apiUtilsApi.createDatabase
>[0];

export type CreateDatabaseResult = Awaited<
  ReturnType<typeof apiUtilsApi.createDatabase>
>;

export type GetSQLCodeMetadataArgs = Parameters<
  typeof apiUtilsApi.getSqlCodeMetadata
>[0];

export type GetSQLCodeMetadataResult = Awaited<
  ReturnType<typeof apiUtilsApi.getSqlCodeMetadata>
>;
