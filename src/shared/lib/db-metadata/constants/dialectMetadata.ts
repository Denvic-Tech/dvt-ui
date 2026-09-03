import { DbDialect } from '@/shared/gatewayClient';

import type { DialectMetadata } from '../types';

export const DIALECT_METADATA: Record<DbDialect, DialectMetadata> = {
  postgresql: {
    supportsDatabases: true,
    supportsSchemas: true,

    requiresPort: true,
    defaultPort: 5432,

    requiresDriverName: false,
  },
  mysql: {
    supportsDatabases: false,
    supportsSchemas: true,

    requiresPort: true,
    defaultPort: 3306,

    requiresDriverName: false,
  },
  mariadb: {
    supportsDatabases: false,
    supportsSchemas: true,

    requiresPort: true,
    defaultPort: 3306,

    requiresDriverName: false,
  },
  mongodb: {
    supportsDatabases: false,
    supportsSchemas: false,

    requiresPort: true,
    defaultPort: 27017,

    requiresDriverName: false,
  },
  mssql: {
    supportsDatabases: true,
    supportsSchemas: true,

    requiresPort: true,
    defaultPort: 1433,

    requiresDriverName: true,
    defaultDriverName: 'ODBC Driver 18 for SQL Server',
  },
  sqlserver: {
    supportsDatabases: true,
    supportsSchemas: true,

    requiresPort: true,
    defaultPort: 1433,

    requiresDriverName: true,
    defaultDriverName: 'ODBC Driver 18 for SQL Server',
  },
  clickhouse: {
    supportsDatabases: true,
    supportsSchemas: false,

    requiresPort: true,
    defaultPort: 8123,

    requiresDriverName: false,
  },
  sqlite: {
    supportsDatabases: false,
    supportsSchemas: false,

    requiresPort: false,

    requiresDriverName: false,
  },
  oracle: {
    requiresPort: true,
    defaultPort: 1521,
    supportsDatabases: false,
    supportsSchemas: true,
    requiresDriverName: false,
  },
};
