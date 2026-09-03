import type { EntityState } from '@reduxjs/toolkit';

import type {
  ConnectionCheckResult,
  ConnectionDriverInfoResponse,
  ConnectionIssueResponse,
  ConnectionKindInfoResponse,
  ConnectionTypeInfoResponse,
} from '@/shared/gatewayClient';

export type DBConnectionJsonSchema = {
  [key: string]: unknown;
};

export type DBConnectionListParams = {
  kind?: string | null;
  type?: string | null;
  name?: string | null;
  labels?: string | null;
  metadata?: string | null;
  extra?: string | null;
};

export type DBConnectionResource = {
  state?: 'invalid';
  id?: string;
  name: string;
  kind: string;
  type: string;
  driver?: string | null;
  driver_options?: Record<string, unknown> | null;
  properties?: Record<string, unknown> | null;
  secrets?: Record<string, unknown> | null;
  labels?: Record<string, string> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  user_id?: string | null;
  organization_id?: string | null;
  issues?: ConnectionIssueResponse[] | null;
  raw_properties?: unknown | null;
  raw_driver_options?: unknown | null;
  raw_secrets?: unknown | null;
  [key: string]: unknown;
};

export type DBConnectionRecord = DBConnectionResource & {
  id: string;
  driver: string | null;
  driver_options: Record<string, unknown> | null;
  properties: Record<string, unknown>;
  labels: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  user_id: string | null;
  organization_id: string | null;
  issues: ConnectionIssueResponse[];
  raw_properties: unknown | null;
  raw_driver_options: unknown | null;
  raw_secrets: unknown | null;
};

export type DBConnectionCreatePayload = Omit<
  DBConnectionResource,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export type DBConnectionUpdatePayload = Partial<
  Omit<
    DBConnectionResource,
    'id' | 'kind' | 'type' | 'created_at' | 'updated_at' | 'deleted_at'
  >
>;

export type DBConnectionCatalogTypeInfo = Omit<
  ConnectionTypeInfoResponse,
  | 'default_driver'
  | 'drivers'
  | 'supported_drivers'
  | 'capabilities'
  | 'tags'
  | 'properties_schema'
  | 'secrets_schema'
  | 'public_schema'
> & {
  default_driver: string | null;
  drivers: ConnectionDriverInfoResponse[];
  supported_drivers: string[];
  capabilities: string[];
  tags: string[];
  properties_schema: DBConnectionJsonSchema;
  secrets_schema: DBConnectionJsonSchema | null;
  public_schema: DBConnectionJsonSchema | null;
};

export type DBConnectionCatalog = {
  kinds: ConnectionKindInfoResponse[];
  kindsByName: Record<string, ConnectionKindInfoResponse>;
  types: DBConnectionCatalogTypeInfo[];
  typesByName: Record<string, DBConnectionCatalogTypeInfo>;
};

export type DBConnectionCatalogState = {
  data: DBConnectionCatalog | null;
  isLoaded: boolean;
};

export type DBConnectionStatus = ConnectionCheckResult & {
  id: string;
  name: string;
  message: string | null;
  exception: string | null;
};

export type DBConnectionLoadingState = {
  isFetching: boolean;
  isFetchingCatalog: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isChecking: boolean;
};

export type DBConnectionDraft = {
  name: string;
  kind: string;
  type: string;
  driver: string | null;
  driverOptions: Record<string, unknown>;
  properties: Record<string, unknown>;
  secrets: Record<string, unknown>;
  labelsText: string;
  metadataText: string;
};

export type DBConnectionSectionKey =
  | 'driver_options'
  | 'properties'
  | 'secrets';

export type DBConnectionFieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'array'
  | 'json';

export type DBConnectionFieldDescriptor = {
  section: DBConnectionSectionKey;
  name: string;
  label: string;
  description?: string | undefined;
  required: boolean;
  nullable: boolean;
  kind: DBConnectionFieldKind;
  enumOptions?: Array<{ label: string; value: string }> | undefined;
  defaultValue?: unknown;
};

export type DBConnectionScopeOption = {
  value: string;
  label: string;
  description?: string | null | undefined;
};

export interface DBConnectionsState extends EntityState<
  DBConnectionRecord,
  string
> {
  statusesById: Partial<Record<string, DBConnectionStatus>>;
  catalog: DBConnectionCatalogState;
  loading: DBConnectionLoadingState;
  error: string | null;
  selectedConnectionId: string | null;
}
