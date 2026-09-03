export type { DbDialect } from '@/shared/gatewayClient';

export type DbMetadataTableSelector = {
  databaseName?: string | null | undefined;
  schemaName?: string | null | undefined;
  tableName?: string | null | undefined;
};

type DriverNameRequirement =
  | {
      requiresDriverName: true;
      defaultDriverName: string;
    }
  | {
      requiresDriverName: false;
      defaultDriverName?: never;
    };

type PortRequirement =
  | {
      requiresPort: true;
      defaultPort: number;
    }
  | {
      requiresPort: false;
      defaultPort?: never;
    };

type DialectMetadataBase = {
  supportsDatabases: boolean;
  supportsSchemas: boolean;
};

export type DialectMetadata = DialectMetadataBase &
  DriverNameRequirement &
  PortRequirement;
