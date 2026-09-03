import type {
  ConnectionKindInfoResponse,
  ConnectionTypeInfoResponse,
  DbDialect,
} from '@/shared/gatewayClient';
import { getDialectMetadata } from '@/shared/lib/db-metadata';

import { buildConnectionIssueFieldMap, isBrokenConnection } from './issues';
import { buildFieldDescriptors } from './schema';
import type {
  DBConnectionCatalog,
  DBConnectionCatalogTypeInfo,
  DBConnectionCreatePayload,
  DBConnectionDraft,
  DBConnectionFieldDescriptor,
  DBConnectionRecord,
  DBConnectionResource,
  DBConnectionSectionKey,
  DBConnectionStatus,
  DBConnectionUpdatePayload,
} from './types';

const DIALECT_BY_CONNECTION_TYPE: Partial<Record<string, DbDialect>> = {
  clickhouse: 'clickhouse',
  mariadb: 'mariadb',
  mongodb: 'mongodb',
  mssql: 'mssql',
  mysql: 'mysql',
  oracle: 'oracle',
  postgres: 'postgresql',
  sqlserver: 'sqlserver',
};

const DEFAULT_PORT_BY_CONNECTION_TYPE: Partial<Record<string, number>> = {
  ftp: 21,
  sftp: 22,
};

const MSSQL_CONNECTION_TYPE = 'mssql';
const MSSQL_NAMED_INSTANCE_SEPARATOR = '\\';
const MSSQL_NAMED_INSTANCE_HOST_ERROR =
  'Укажите host в формате server\\instance';
const MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME = 'driver_name';
const MSSQL_ODBC_DRIVER_OPTION_PUBLIC_NAME = 'odbc_driver_name';
const MSSQL_DEFAULT_ODBC_DRIVER_NAME = 'ODBC Driver 18 for SQL Server';

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isObjectRecord(value) &&
  Object.values(value).every(item => typeof item === 'string');

const asObjectRecord = (value: unknown): Record<string, unknown> =>
  isObjectRecord(value) ? value : {};

const asObjectRecordOrNull = (
  value: unknown
): Record<string, unknown> | null => (isObjectRecord(value) ? value : null);

const asNullableObjectRecord = (
  value: unknown
): Record<string, unknown> | null => (isObjectRecord(value) ? value : null);

const asNullableStringRecord = (
  value: unknown
): Record<string, string> | null => (isStringRecord(value) ? value : null);

const isMssqlConnectionType = (connectionType: string | null | undefined) =>
  connectionType === MSSQL_CONNECTION_TYPE;

const parseMssqlNamedInstanceHost = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const separatorIndex = value.indexOf(MSSQL_NAMED_INSTANCE_SEPARATOR);

  if (separatorIndex < 0) {
    return null;
  }

  const host = value.slice(0, separatorIndex).trim();
  const instanceName = value.slice(separatorIndex + 1).trim();

  return {
    host,
    instanceName,
    isValid: Boolean(host && instanceName),
  };
};

const isMssqlNamedInstanceHost = (value: unknown) =>
  parseMssqlNamedInstanceHost(value) !== null;

const isMssqlOdbcDriverOptionField = (
  field: DBConnectionFieldDescriptor,
  connectionType?: string | null
) =>
  field.section === 'driver_options' &&
  isMssqlConnectionType(connectionType) &&
  (field.name === MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME ||
    field.name === MSSQL_ODBC_DRIVER_OPTION_PUBLIC_NAME);

const getFieldDefaultValue = (
  field: DBConnectionFieldDescriptor,
  connectionType?: string | null
) =>
  isMssqlOdbcDriverOptionField(field, connectionType)
    ? MSSQL_DEFAULT_ODBC_DRIVER_NAME
    : field.defaultValue;

const normalizeTypeInfo = (
  typeInfo: ConnectionTypeInfoResponse
): DBConnectionCatalogTypeInfo => ({
  ...typeInfo,
  default_driver: typeInfo.default_driver ?? null,
  drivers: typeInfo.drivers ?? [],
  supported_drivers: typeInfo.supported_drivers ?? [],
  capabilities: typeInfo.capabilities ?? [],
  tags: typeInfo.tags ?? [],
  properties_schema: asObjectRecord(typeInfo.properties_schema),
  secrets_schema: asNullableObjectRecord(typeInfo.secrets_schema),
  public_schema: asNullableObjectRecord(typeInfo.public_schema),
});

export const normalizeCatalog = (
  kinds: ConnectionKindInfoResponse[],
  types: ConnectionTypeInfoResponse[]
): DBConnectionCatalog => {
  const normalizedTypes = types.map(normalizeTypeInfo);

  return {
    kinds,
    kindsByName: kinds.reduce<Record<string, ConnectionKindInfoResponse>>(
      (acc, item) => {
        acc[item.name] = item;
        return acc;
      },
      {}
    ),
    types: normalizedTypes,
    typesByName: normalizedTypes.reduce<
      Record<string, DBConnectionCatalogTypeInfo>
    >((acc, item) => {
      acc[item.name] = item;
      return acc;
    }, {}),
  };
};

export const normalizeConnection = (
  connection: DBConnectionResource
): DBConnectionRecord => {
  if (!connection.id) {
    throw new Error('Получено подключение без идентификатора');
  }

  return {
    ...connection,
    id: connection.id,
    ...(connection.state === 'invalid' ? { state: 'invalid' as const } : {}),
    driver: typeof connection.driver === 'string' ? connection.driver : null,
    driver_options: asNullableObjectRecord(connection.driver_options),
    properties: asObjectRecord(connection.properties),
    labels: asNullableStringRecord(connection.labels),
    metadata: asNullableObjectRecord(connection.metadata),
    created_at:
      typeof connection.created_at === 'string' ? connection.created_at : null,
    updated_at:
      typeof connection.updated_at === 'string' ? connection.updated_at : null,
    deleted_at:
      typeof connection.deleted_at === 'string' ? connection.deleted_at : null,
    user_id: typeof connection.user_id === 'string' ? connection.user_id : null,
    organization_id:
      typeof connection.organization_id === 'string'
        ? connection.organization_id
        : null,
    issues: Array.isArray(connection.issues) ? connection.issues : [],
    raw_properties: connection.raw_properties ?? null,
    raw_driver_options: connection.raw_driver_options ?? null,
    raw_secrets: connection.raw_secrets ?? null,
  };
};

export const normalizeConnections = (connections: DBConnectionResource[]) =>
  connections.map(normalizeConnection);

export const resolveConnectionTypeInfo = (
  catalog: DBConnectionCatalog | null,
  typeName: string
) => catalog?.typesByName[typeName] ?? null;

export const resolveTypeDriver = (
  typeInfo: DBConnectionCatalogTypeInfo | null
): string | null => {
  if (!typeInfo) {
    return null;
  }

  if (typeInfo.default_driver) {
    return typeInfo.default_driver;
  }

  return typeInfo.drivers[0]?.name ?? null;
};

const resolveDefaultPort = (connectionType: string | null | undefined) => {
  if (!connectionType) {
    return null;
  }

  const dialect = DIALECT_BY_CONNECTION_TYPE[connectionType];

  if (dialect) {
    return getDialectMetadata(dialect).defaultPort;
  }

  return DEFAULT_PORT_BY_CONNECTION_TYPE[connectionType] ?? null;
};

const toFieldControlValue = (
  field: DBConnectionFieldDescriptor,
  sourceValue: unknown,
  connectionType?: string | null,
  useDefaultValue: boolean = true
) => {
  const defaultValue = useDefaultValue
    ? getFieldDefaultValue(field, connectionType)
    : undefined;
  const value =
    useDefaultValue &&
    field.name === 'port' &&
    (sourceValue === null || sourceValue === undefined || sourceValue === '')
      ? (resolveDefaultPort(connectionType) ?? defaultValue)
      : (sourceValue ?? defaultValue);

  switch (field.kind) {
    case 'boolean':
      return Boolean(value);
    case 'number':
      return typeof value === 'number' ? value : (value ?? '');
    case 'array':
      return Array.isArray(value)
        ? value.map(item => String(item)).join(', ')
        : '';
    case 'json':
      if (value === null || value === undefined || value === '') {
        return '';
      }
      return JSON.stringify(value, null, 2);
    default:
      return value === null || value === undefined ? '' : String(value);
  }
};

const getSectionSource = (
  connection: DBConnectionRecord | null | undefined,
  section: DBConnectionSectionKey
) => {
  if (!connection) {
    return {};
  }

  switch (section) {
    case 'driver_options':
      if (isBrokenConnection(connection)) {
        return (
          asObjectRecordOrNull(connection.raw_driver_options) ??
          connection.driver_options ??
          {}
        );
      }

      return connection.driver_options ?? {};
    case 'secrets':
      return {};
    case 'properties':
      if (isBrokenConnection(connection)) {
        return (
          asObjectRecordOrNull(connection.raw_properties) ??
          connection.properties
        );
      }

      return connection.properties;
  }
};

const getFieldSourceValue = (
  connection: DBConnectionRecord | null | undefined,
  field: DBConnectionFieldDescriptor,
  connectionType?: string | null
) => {
  const source = getSectionSource(connection, field.section);

  if (
    field.section === 'properties' &&
    field.name === 'host' &&
    isMssqlConnectionType(connectionType) &&
    typeof source['host'] === 'string' &&
    typeof source['instance_name'] === 'string' &&
    source['instance_name'].trim()
  ) {
    return `${source['host']}\\${source['instance_name']}`;
  }

  if (
    field.section === 'driver_options' &&
    isMssqlConnectionType(connectionType) &&
    field.name === MSSQL_ODBC_DRIVER_OPTION_PUBLIC_NAME &&
    typeof source[MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME] === 'string'
  ) {
    return source[MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME];
  }

  if (
    field.section === 'driver_options' &&
    isMssqlConnectionType(connectionType) &&
    field.name === MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME &&
    typeof source[MSSQL_ODBC_DRIVER_OPTION_PUBLIC_NAME] === 'string'
  ) {
    return source[MSSQL_ODBC_DRIVER_OPTION_PUBLIC_NAME];
  }

  return source[field.name];
};

export const serializeLabels = (
  labels: Record<string, string> | null | undefined
) =>
  labels
    ? Object.entries(labels)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')
    : '';

export const parseLabelsText = (
  value: string
): Record<string, string> | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed
    .split(/\r?\n/g)
    .map(line => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex <= 0) {
        throw new Error('Метки должны быть в формате key=value');
      }

      const key = line.slice(0, separatorIndex).trim();
      const itemValue = line.slice(separatorIndex + 1).trim();

      if (!key) {
        throw new Error('Ключ метки не может быть пустым');
      }

      acc[key] = itemValue;
      return acc;
    }, {});
};

export const serializeMetadata = (
  metadata: Record<string, unknown> | null | undefined
) => (metadata ? JSON.stringify(metadata, null, 2) : '');

export const parseMetadataText = (
  value: string
): Record<string, unknown> | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = JSON.parse(trimmed) as unknown;

  if (!isObjectRecord(parsed)) {
    throw new Error('Metadata должна быть JSON-объектом');
  }

  return parsed;
};

export const createDraftFromType = (
  typeInfo: DBConnectionCatalogTypeInfo | null,
  connection?: DBConnectionRecord | null,
  driverOverride?: string | null
): DBConnectionDraft => {
  const connectionType = connection?.type ?? typeInfo?.name ?? '';
  const driver =
    driverOverride ?? connection?.driver ?? resolveTypeDriver(typeInfo);
  const propertiesFields = buildFieldDescriptors(
    'properties',
    typeInfo?.public_schema ?? typeInfo?.properties_schema
  );
  const secretsFields = buildFieldDescriptors(
    'secrets',
    typeInfo?.secrets_schema
  );
  const driverOptionFields = buildFieldDescriptors(
    'driver_options',
    typeInfo?.drivers.find(item => item.name === driver)
      ?.public_options_schema ??
      typeInfo?.drivers.find(item => item.name === driver)?.options_schema
  );
  const brokenFieldIssueMap = buildConnectionIssueFieldMap(
    isBrokenConnection(connection) ? connection?.issues : [],
    [...propertiesFields, ...secretsFields, ...driverOptionFields]
  );
  const getHydratedFieldValue = (field: DBConnectionFieldDescriptor) => {
    const issueKey = `${field.section}.${field.name}`;

    if (brokenFieldIssueMap[issueKey]) {
      return toFieldControlValue(field, '', connectionType, false);
    }

    return toFieldControlValue(
      field,
      getFieldSourceValue(connection, field, connectionType),
      connectionType
    );
  };

  return {
    name: connection?.name ?? '',
    kind: connection?.kind ?? typeInfo?.kind ?? '',
    type: connection?.type ?? typeInfo?.name ?? '',
    driver,
    driverOptions: driverOptionFields.reduce<Record<string, unknown>>(
      (acc, field) => {
        acc[field.name] = getHydratedFieldValue(field);
        return acc;
      },
      {}
    ),
    properties: propertiesFields.reduce<Record<string, unknown>>(
      (acc, field) => {
        acc[field.name] = getHydratedFieldValue(field);
        return acc;
      },
      {}
    ),
    secrets: secretsFields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {}),
    labelsText: serializeLabels(connection?.labels),
    metadataText: serializeMetadata(connection?.metadata),
  };
};

const parseFieldValue = (
  field: DBConnectionFieldDescriptor,
  rawValue: unknown
): unknown => {
  switch (field.kind) {
    case 'boolean':
      return Boolean(rawValue);
    case 'number': {
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        return field.nullable ? null : null;
      }

      const numberValue = Number(rawValue);
      if (Number.isNaN(numberValue)) {
        throw new Error(`Поле "${field.label}" должно быть числом`);
      }
      return numberValue;
    }
    case 'array':
      if (typeof rawValue !== 'string') {
        return [];
      }
      return rawValue
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    case 'json':
      if (typeof rawValue !== 'string' || rawValue.trim() === '') {
        return field.nullable ? null : {};
      }
      return JSON.parse(rawValue);
    default:
      if (rawValue === '' && field.nullable) {
        return null;
      }
      return typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  }
};

export const validateDraft = (params: {
  draft: DBConnectionDraft;
  propertiesFields: DBConnectionFieldDescriptor[];
  secretsFields: DBConnectionFieldDescriptor[];
  driverOptionFields: DBConnectionFieldDescriptor[];
  isEditing: boolean;
}): Record<string, string> => {
  const {
    draft,
    propertiesFields,
    secretsFields,
    driverOptionFields,
    isEditing,
  } = params;
  const errors: Record<string, string> = {};

  if (!draft.name.trim()) {
    errors['name'] = 'Укажите имя подключения';
  }

  const validateFields = (
    prefix: string,
    fields: DBConnectionFieldDescriptor[],
    values: Record<string, unknown>
  ) => {
    fields.forEach(field => {
      const rawValue = values[field.name];

      if (
        field.required &&
        (rawValue === '' ||
          rawValue === null ||
          rawValue === undefined ||
          (Array.isArray(rawValue) && rawValue.length === 0))
      ) {
        if (!(isEditing && prefix === 'secrets')) {
          errors[`${prefix}.${field.name}`] =
            `Поле "${field.label}" обязательно`;
          return;
        }
      }

      if (
        field.kind === 'json' &&
        typeof rawValue === 'string' &&
        rawValue.trim()
      ) {
        try {
          JSON.parse(rawValue);
        } catch {
          errors[`${prefix}.${field.name}`] =
            `Поле "${field.label}" должно содержать валидный JSON`;
        }
      }
    });
  };

  validateFields('properties', propertiesFields, draft.properties);
  validateFields('secrets', secretsFields, draft.secrets);
  validateFields('driver_options', driverOptionFields, draft.driverOptions);

  if (isMssqlConnectionType(draft.type)) {
    const namedInstanceHost = parseMssqlNamedInstanceHost(
      draft.properties['host']
    );

    if (namedInstanceHost && !namedInstanceHost.isValid) {
      errors['properties.host'] = MSSQL_NAMED_INSTANCE_HOST_ERROR;
    }
  }

  if (draft.labelsText.trim()) {
    try {
      parseLabelsText(draft.labelsText);
    } catch (error) {
      errors['labelsText'] =
        error instanceof Error ? error.message : 'Некорректный формат labels';
    }
  }

  if (draft.metadataText.trim()) {
    try {
      parseMetadataText(draft.metadataText);
    } catch (error) {
      errors['metadataText'] =
        error instanceof Error ? error.message : 'Некорректный JSON metadata';
    }
  }

  return errors;
};

const buildSectionPayload = (
  fields: DBConnectionFieldDescriptor[],
  values: Record<string, unknown>,
  options?: {
    omitBlankSecrets?: boolean;
    touchedSecrets?: Record<string, boolean>;
  }
) => {
  const payload: Record<string, unknown> = {};

  fields.forEach(field => {
    if (
      options?.omitBlankSecrets &&
      field.section === 'secrets' &&
      !options.touchedSecrets?.[field.name] &&
      (values[field.name] === '' ||
        values[field.name] === null ||
        values[field.name] === undefined)
    ) {
      return;
    }

    payload[field.name] = parseFieldValue(field, values[field.name]);
  });

  return payload;
};

const stripEmptyObject = <T extends Record<string, unknown>>(value: T) =>
  Object.keys(value).length > 0 ? value : undefined;

const toPayloadRecord = <T extends Record<string, unknown>>(
  value: T | null
): T | Record<string, never> => value ?? {};

const toNullableScopeValue = (value: string | null | undefined) =>
  value ?? null;

const normalizePropertiesPayload = (
  draft: DBConnectionDraft,
  properties: Record<string, unknown>
) => {
  if (!isMssqlConnectionType(draft.type)) {
    return properties;
  }

  const payload = { ...properties };
  const namedInstanceHost = parseMssqlNamedInstanceHost(payload['host']);

  if (namedInstanceHost) {
    payload['host'] = namedInstanceHost.host;
    payload['instance_name'] = namedInstanceHost.instanceName;
    delete payload['port'];
    return payload;
  }

  delete payload['instance_name'];
  return payload;
};

const normalizeDriverOptionsPayload = (
  draft: DBConnectionDraft,
  driverOptions: Record<string, unknown>
) => {
  if (!isMssqlConnectionType(draft.type)) {
    return driverOptions;
  }

  const payload = { ...driverOptions };
  const inputValue = payload[MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME];
  const publicValue = payload[MSSQL_ODBC_DRIVER_OPTION_PUBLIC_NAME];

  if (typeof inputValue === 'string' && inputValue.trim()) {
    payload[MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME] = inputValue.trim();
  } else if (typeof publicValue === 'string' && publicValue.trim()) {
    payload[MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME] = publicValue.trim();
  } else {
    payload[MSSQL_ODBC_DRIVER_OPTION_INPUT_NAME] =
      MSSQL_DEFAULT_ODBC_DRIVER_NAME;
  }

  delete payload[MSSQL_ODBC_DRIVER_OPTION_PUBLIC_NAME];
  return payload;
};

export const buildCreatePayload = (params: {
  draft: DBConnectionDraft;
  propertiesFields: DBConnectionFieldDescriptor[];
  secretsFields: DBConnectionFieldDescriptor[];
  driverOptionFields: DBConnectionFieldDescriptor[];
  userId?: string | null;
  organizationId?: string | null;
}): DBConnectionCreatePayload => {
  const {
    draft,
    propertiesFields,
    secretsFields,
    driverOptionFields,
    userId,
    organizationId,
  } = params;

  const driverOptions = normalizeDriverOptionsPayload(
    draft,
    buildSectionPayload(driverOptionFields, draft.driverOptions)
  );
  const properties = normalizePropertiesPayload(
    draft,
    buildSectionPayload(propertiesFields, draft.properties) as Record<
      string,
      unknown
    >
  );
  const secrets = buildSectionPayload(secretsFields, draft.secrets);

  return {
    name: draft.name.trim(),
    kind: draft.kind,
    type: draft.type,
    driver: draft.driver,
    ...(stripEmptyObject(driverOptions)
      ? {
          driver_options: driverOptions as Record<string, unknown>,
        }
      : {}),
    properties,
    ...(stripEmptyObject(secrets)
      ? {
          secrets: secrets as Record<string, unknown>,
        }
      : {}),
    labels: toPayloadRecord(parseLabelsText(draft.labelsText)),
    metadata: toPayloadRecord(parseMetadataText(draft.metadataText)),
    user_id: toNullableScopeValue(userId),
    organization_id: toNullableScopeValue(organizationId),
  };
};

export const buildUpdatePayload = (params: {
  draft: DBConnectionDraft;
  propertiesFields: DBConnectionFieldDescriptor[];
  secretsFields: DBConnectionFieldDescriptor[];
  driverOptionFields: DBConnectionFieldDescriptor[];
  touchedSecrets: Record<string, boolean>;
  userId?: string | null;
  organizationId?: string | null;
}): DBConnectionUpdatePayload => {
  const {
    draft,
    propertiesFields,
    secretsFields,
    driverOptionFields,
    touchedSecrets,
    userId,
    organizationId,
  } = params;

  const driverOptions = normalizeDriverOptionsPayload(
    draft,
    buildSectionPayload(driverOptionFields, draft.driverOptions)
  );
  const properties = normalizePropertiesPayload(
    draft,
    buildSectionPayload(propertiesFields, draft.properties) as Record<
      string,
      unknown
    >
  );
  const secrets = buildSectionPayload(secretsFields, draft.secrets, {
    omitBlankSecrets: true,
    touchedSecrets,
  });

  return {
    name: draft.name.trim(),
    driver: draft.driver,
    ...(stripEmptyObject(driverOptions)
      ? { driver_options: driverOptions }
      : {}),
    properties,
    ...(stripEmptyObject(secrets) ? { secrets } : {}),
    labels: toPayloadRecord(parseLabelsText(draft.labelsText)),
    metadata: toPayloadRecord(parseMetadataText(draft.metadataText)),
    user_id: toNullableScopeValue(userId),
    organization_id: toNullableScopeValue(organizationId),
  };
};

export const buildStatusMessage = (
  connection: Pick<DBConnectionRecord, 'id' | 'name'>,
  status: DBConnectionStatus
) =>
  status.message ??
  `Подключение "${connection.name || connection.id}": ${
    status.connected ? 'подключено' : 'не подключено'
  }`;

export const getFieldDescriptorsByType = (
  typeInfo: DBConnectionCatalogTypeInfo | null,
  driver: string | null
) => ({
  propertiesFields: buildFieldDescriptors(
    'properties',
    typeInfo?.public_schema ?? typeInfo?.properties_schema
  ),
  secretsFields: buildFieldDescriptors('secrets', typeInfo?.secrets_schema),
  driverOptionFields: buildFieldDescriptors(
    'driver_options',
    typeInfo?.drivers.find(item => item.name === driver)
      ?.public_options_schema ??
      typeInfo?.drivers.find(item => item.name === driver)?.options_schema
  ),
});

export const getEffectiveFieldDescriptorsForDraft = (
  draft: DBConnectionDraft,
  fieldDescriptors: {
    propertiesFields: DBConnectionFieldDescriptor[];
    secretsFields: DBConnectionFieldDescriptor[];
    driverOptionFields: DBConnectionFieldDescriptor[];
  }
) => {
  if (!isMssqlConnectionType(draft.type)) {
    return fieldDescriptors;
  }

  const isNamedInstance = isMssqlNamedInstanceHost(draft.properties['host']);

  return {
    ...fieldDescriptors,
    propertiesFields: fieldDescriptors.propertiesFields.filter(field => {
      if (field.name === 'instance_name') {
        return false;
      }

      if (field.name === 'port' && isNamedInstance) {
        return false;
      }

      return true;
    }),
  };
};
