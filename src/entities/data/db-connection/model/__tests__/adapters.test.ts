import { describe, expect, it } from 'vitest';

import {
  buildCreatePayload,
  buildUpdatePayload,
  createDraftFromType,
  getEffectiveFieldDescriptorsForDraft,
  getFieldDescriptorsByType,
  normalizeCatalog,
  normalizeConnection,
  parseLabelsText,
  parseMetadataText,
  resolveConnectionTypeInfo,
  validateDraft,
} from '../adapters';
import {
  buildConnectionIssueValidationErrors,
  formatConnectionIssue,
  isBrokenConnection,
} from '../issues';
import type {
  DBConnectionCatalogTypeInfo,
  DBConnectionFieldDescriptor,
  DBConnectionRecord,
} from '../types';

const typeInfo: DBConnectionCatalogTypeInfo = {
  name: 'smbprotocol',
  kind: 'file',
  default_driver: null,
  drivers: [],
  supported_drivers: [],
  capabilities: ['check', 'client'],
  tags: [],
  properties_schema: {
    properties: {
      server: { title: 'Server', type: 'string' },
      share: { title: 'Share', type: 'string' },
      username: { title: 'Username', type: 'string' },
    },
    required: ['server', 'share', 'username'],
    type: 'object',
  },
  secrets_schema: {
    properties: {
      password: {
        anyOf: [{ type: 'string' }, { type: 'null' }],
        title: 'Password',
      },
    },
    required: ['password'],
    type: 'object',
  },
  public_schema: {
    properties: {
      server: { title: 'Server', type: 'string' },
      share: { title: 'Share', type: 'string' },
      username: { title: 'Username', type: 'string' },
    },
    required: ['server', 'share', 'username'],
    type: 'object',
  },
};

const postgresTypeInfo: DBConnectionCatalogTypeInfo = {
  name: 'postgres',
  kind: 'database',
  default_driver: null,
  drivers: [],
  supported_drivers: [],
  capabilities: ['check'],
  tags: [],
  properties_schema: {
    properties: {
      host: { title: 'Host', type: 'string' },
      port: { title: 'Port', type: 'integer' },
      username: { title: 'Username', type: 'string' },
    },
    required: ['host', 'username'],
    type: 'object',
  },
  secrets_schema: {
    properties: {
      password: {
        anyOf: [{ type: 'string' }, { type: 'null' }],
        title: 'Password',
      },
    },
    required: [],
    type: 'object',
  },
  public_schema: {
    properties: {
      host: { title: 'Host', type: 'string' },
      port: { title: 'Port', type: 'integer' },
      username: { title: 'Username', type: 'string' },
    },
    required: ['host', 'username'],
    type: 'object',
  },
};

const mssqlTypeInfo: DBConnectionCatalogTypeInfo = {
  name: 'mssql',
  kind: 'sql',
  default_driver: 'pyodbc',
  drivers: [
    {
      name: 'pyodbc',
      options_schema: {
        properties: {
          driver_name: { title: 'Driver Name', type: 'string' },
        },
        required: ['driver_name'],
        type: 'object',
      },
      public_options_schema: {
        properties: {
          odbc_driver_name: { title: 'ODBC Driver Name', type: 'string' },
        },
        required: ['odbc_driver_name'],
        type: 'object',
      },
    },
  ],
  supported_drivers: ['pyodbc'],
  capabilities: ['check'],
  tags: [],
  properties_schema: {
    $defs: {
      MSSQLTCPProperties: {
        properties: {
          host: { title: 'Host', type: 'string' },
          port: { title: 'Port', type: 'integer' },
          username: { title: 'Username', type: 'string' },
          database: { title: 'Database', type: 'string' },
        },
        required: ['host', 'port', 'username', 'database'],
        type: 'object',
      },
      MSSQLNamedInstanceProperties: {
        properties: {
          host: { title: 'Host', type: 'string' },
          instance_name: { title: 'Instance Name', type: 'string' },
          username: { title: 'Username', type: 'string' },
          database: { title: 'Database', type: 'string' },
        },
        required: ['host', 'instance_name', 'username', 'database'],
        type: 'object',
      },
    },
    anyOf: [
      { $ref: '#/$defs/MSSQLTCPProperties' },
      { $ref: '#/$defs/MSSQLNamedInstanceProperties' },
    ],
  },
  secrets_schema: {
    properties: {
      password: {
        anyOf: [{ type: 'string' }, { type: 'null' }],
        title: 'Password',
      },
    },
    required: [],
    type: 'object',
  },
  public_schema: {
    $defs: {
      MSSQLTCPProperties: {
        properties: {
          host: { title: 'Host', type: 'string' },
          port: { title: 'Port', type: 'integer' },
          username: { title: 'Username', type: 'string' },
          database: { title: 'Database', type: 'string' },
        },
        required: ['host', 'port', 'username', 'database'],
        type: 'object',
      },
      MSSQLNamedInstanceProperties: {
        properties: {
          host: { title: 'Host', type: 'string' },
          instance_name: { title: 'Instance Name', type: 'string' },
          username: { title: 'Username', type: 'string' },
          database: { title: 'Database', type: 'string' },
        },
        required: ['host', 'instance_name', 'username', 'database'],
        type: 'object',
      },
    },
    anyOf: [
      { $ref: '#/$defs/MSSQLTCPProperties' },
      { $ref: '#/$defs/MSSQLNamedInstanceProperties' },
    ],
  },
};

const mssqlPropertiesFields: DBConnectionFieldDescriptor[] = [
  {
    section: 'properties',
    name: 'host',
    label: 'Host',
    required: true,
    nullable: false,
    kind: 'text',
  },
  {
    section: 'properties',
    name: 'port',
    label: 'Port',
    required: true,
    nullable: false,
    kind: 'number',
  },
  {
    section: 'properties',
    name: 'instance_name',
    label: 'Instance Name',
    required: false,
    nullable: false,
    kind: 'text',
  },
  {
    section: 'properties',
    name: 'username',
    label: 'Username',
    required: true,
    nullable: false,
    kind: 'text',
  },
  {
    section: 'properties',
    name: 'database',
    label: 'Database',
    required: true,
    nullable: false,
    kind: 'text',
  },
];

const ftpTypeInfo: DBConnectionCatalogTypeInfo = {
  name: 'ftp',
  kind: 'file',
  default_driver: null,
  drivers: [],
  supported_drivers: [],
  capabilities: ['check', 'client'],
  tags: [],
  properties_schema: {
    $defs: {
      FTPMode: {
        enum: ['ftp', 'ftps_implicit', 'ftps_explicit'],
        title: 'Connection mode',
        type: 'string',
      },
    },
    properties: {
      host: { title: 'Host', type: 'string' },
      mode: {
        anyOf: [{ $ref: '#/$defs/FTPMode' }, { type: 'null' }],
        default: 'ftp',
        description: 'FTP transport mode',
        title: 'Mode',
      },
      encoding: {
        default: 'utf-8',
        title: 'Encoding',
        type: 'string',
      },
    },
    required: ['host'],
    type: 'object',
  },
  secrets_schema: null,
  public_schema: {
    $defs: {
      FTPMode: {
        enum: ['ftp', 'ftps_implicit', 'ftps_explicit'],
        title: 'Connection mode',
        type: 'string',
      },
    },
    properties: {
      host: { title: 'Host', type: 'string' },
      mode: {
        anyOf: [{ $ref: '#/$defs/FTPMode' }, { type: 'null' }],
        default: 'ftp',
        description: 'FTP transport mode',
        title: 'Mode',
      },
      encoding: {
        default: 'utf-8',
        title: 'Encoding',
        type: 'string',
      },
    },
    required: ['host'],
    type: 'object',
  },
};

const sourceConnection: DBConnectionRecord = {
  id: 'conn-1',
  name: 'SMB Main',
  kind: 'file',
  type: 'smbprotocol',
  driver: null,
  driver_options: null,
  properties: {
    server: 'files.local',
    share: 'reports',
    username: 'reader',
  },
  labels: { env: 'prod' },
  metadata: { owner: 'team-a' },
  created_at: null,
  updated_at: null,
  deleted_at: null,
  user_id: null,
  organization_id: null,
  issues: [],
  raw_properties: null,
  raw_driver_options: null,
  raw_secrets: null,
};

describe('db-connection-v1 adapters', () => {
  it('normalizes catalog and keeps smbprotocol type discoverable', () => {
    const catalog = normalizeCatalog(
      [{ name: 'file', description: '', capabilities: ['client'] }],
      [typeInfo]
    );

    expect(resolveConnectionTypeInfo(catalog, 'smbprotocol')?.name).toBe(
      'smbprotocol'
    );
    expect(catalog.kindsByName['file']?.name).toBe('file');
  });

  it('creates draft from type metadata and stored connection', () => {
    const draft = createDraftFromType(typeInfo, sourceConnection);

    expect(draft.type).toBe('smbprotocol');
    expect(draft.name).toBe('SMB Main');
    expect(draft.properties['server']).toBe('files.local');
    expect(draft.labelsText).toContain('env=prod');
  });

  it('hydrates default port from dialect metadata for new sql drafts', () => {
    const draft = createDraftFromType(postgresTypeInfo);

    expect(draft.properties['port']).toBe(5432);
  });

  it('builds mssql fields from union properties schema', () => {
    const fieldDescriptors = getFieldDescriptorsByType(mssqlTypeInfo, 'pyodbc');
    const draft = createDraftFromType(mssqlTypeInfo);
    const effectiveFieldDescriptors = getEffectiveFieldDescriptorsForDraft(
      draft,
      fieldDescriptors
    );

    expect(fieldDescriptors.propertiesFields.map(field => field.name)).toEqual([
      'host',
      'port',
      'username',
      'database',
      'instance_name',
    ]);
    expect(
      effectiveFieldDescriptors.propertiesFields.map(field => field.name)
    ).toEqual(['host', 'port', 'username', 'database']);
    expect(draft.properties['port']).toBe(1433);
    expect(
      fieldDescriptors.driverOptionFields.map(field => field.name)
    ).toEqual(['odbc_driver_name']);
    expect(draft.driverOptions['odbc_driver_name']).toBe(
      'ODBC Driver 18 for SQL Server'
    );
  });

  it('hydrates mssql named instance host from stored properties', () => {
    const draft = createDraftFromType(mssqlTypeInfo, {
      id: 'mssql-1',
      name: 'MSSQL Named',
      kind: 'sql',
      type: 'mssql',
      driver: 'pyodbc',
      driver_options: {
        odbc_driver_name: 'ODBC Driver 17 for SQL Server',
      },
      properties: {
        host: 'sql-host',
        instance_name: 'SQLEXPRESS',
        username: 'reader',
        database: 'dwh',
      },
      labels: null,
      metadata: null,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      user_id: null,
      organization_id: null,
      issues: [],
      raw_properties: null,
      raw_driver_options: null,
      raw_secrets: null,
    });

    expect(draft.properties['host']).toBe('sql-host\\SQLEXPRESS');
    expect(draft.driverOptions['odbc_driver_name']).toBe(
      'ODBC Driver 17 for SQL Server'
    );
  });

  it('normalizes invalid connections with issues and raw sections', () => {
    const normalized = normalizeConnection({
      id: 'broken-1',
      state: 'invalid',
      name: 'Broken Postgres',
      kind: 'sql',
      type: 'postgres',
      driver: 'psycopg',
      labels: { env: 'dev' },
      metadata: { owner: 'etl' },
      created_at: '2026-07-16T08:00:00Z',
      updated_at: '2026-07-16T08:30:00Z',
      issues: [
        {
          field: 'raw_properties.host',
          code: 'invalid_type',
          message: 'Host has invalid type',
        },
      ],
      raw_properties: {
        host: 42,
        port: 5433,
        username: 'reader',
      },
      raw_driver_options: {
        connect_timeout: 10,
      },
      raw_secrets: {
        password: 123,
      },
    });

    expect(isBrokenConnection(normalized)).toBe(true);
    expect(normalized.issues).toHaveLength(1);
    expect(normalized.raw_properties).toEqual({
      host: 42,
      port: 5433,
      username: 'reader',
    });
    expect(normalized.properties).toEqual({});
  });

  it('hydrates invalid connection drafts from raw fields and blanks broken fields', () => {
    const connection = normalizeConnection({
      id: 'broken-2',
      state: 'invalid',
      name: 'Broken Postgres',
      kind: 'database',
      type: 'postgres',
      driver: null,
      labels: null,
      metadata: null,
      created_at: '2026-07-16T08:00:00Z',
      updated_at: '2026-07-16T08:30:00Z',
      issues: [
        {
          field: 'raw_properties.host',
          code: 'invalid_type',
          message: 'Host has invalid type',
        },
      ],
      raw_properties: {
        host: 42,
        port: 5433,
        username: 'reader',
      },
    });
    const draft = createDraftFromType(postgresTypeInfo, connection);

    expect(draft.name).toBe('Broken Postgres');
    expect(draft.properties['host']).toBe('');
    expect(draft.properties['port']).toBe(5433);
    expect(draft.properties['username']).toBe('reader');
  });

  it('formats invalid field issues as validation errors', () => {
    const descriptors = getFieldDescriptorsByType(postgresTypeInfo, null);
    const allFields = [
      ...descriptors.propertiesFields,
      ...descriptors.secretsFields,
      ...descriptors.driverOptionFields,
    ];
    const issue = {
      field: 'properties.host',
      code: 'invalid_type',
      message: 'Host has invalid type',
    };
    const errors = buildConnectionIssueValidationErrors([issue], allFields);

    expect(formatConnectionIssue(issue, allFields)).toBe(
      'Host: Host has invalid type'
    );
    expect(errors['properties.host']).toBe('Host: Host has invalid type');
  });

  it('hydrates wrapper defaults for new ftp drafts', () => {
    const draft = createDraftFromType(ftpTypeInfo);

    expect(draft.properties['mode']).toBe('ftp');
    expect(draft.properties['encoding']).toBe('utf-8');
  });

  it('builds create payload with backend-compatible empty records/null scope when overrides are absent', () => {
    const draft = {
      ...createDraftFromType(typeInfo),
      name: ' SMB New ',
      properties: {
        server: 'files.local',
        share: 'exports',
        username: 'writer',
      },
      secrets: {
        password: 'secret',
      },
      labelsText: 'env=test',
      metadataText: '{"owner":"team-b"}',
    };

    const payload = buildCreatePayload({
      draft,
      propertiesFields: [
        {
          section: 'properties',
          name: 'server',
          label: 'Server',
          required: true,
          nullable: false,
          kind: 'text',
        },
        {
          section: 'properties',
          name: 'share',
          label: 'Share',
          required: true,
          nullable: false,
          kind: 'text',
        },
        {
          section: 'properties',
          name: 'username',
          label: 'Username',
          required: true,
          nullable: false,
          kind: 'text',
        },
      ],
      secretsFields: [
        {
          section: 'secrets',
          name: 'password',
          label: 'Password',
          required: true,
          nullable: true,
          kind: 'text',
        },
      ],
      driverOptionFields: [],
    });

    expect(payload['name']).toBe('SMB New');
    expect(payload['user_id']).toBeNull();
    expect(payload['organization_id']).toBeNull();
    expect(payload['labels']).toEqual({ env: 'test' });
    expect(payload['metadata']).toEqual({ owner: 'team-b' });
  });

  it('builds create payload with empty labels and metadata records by default', () => {
    const draft = {
      ...createDraftFromType(typeInfo),
      name: ' SMB Empty Meta ',
      properties: {
        server: 'files.local',
        share: 'exports',
        username: 'writer',
      },
      secrets: {
        password: 'secret',
      },
      labelsText: '',
      metadataText: '',
    };

    const payload = buildCreatePayload({
      draft,
      propertiesFields: [
        {
          section: 'properties',
          name: 'server',
          label: 'Server',
          required: true,
          nullable: false,
          kind: 'text',
        },
        {
          section: 'properties',
          name: 'share',
          label: 'Share',
          required: true,
          nullable: false,
          kind: 'text',
        },
        {
          section: 'properties',
          name: 'username',
          label: 'Username',
          required: true,
          nullable: false,
          kind: 'text',
        },
      ],
      secretsFields: [
        {
          section: 'secrets',
          name: 'password',
          label: 'Password',
          required: true,
          nullable: true,
          kind: 'text',
        },
      ],
      driverOptionFields: [],
    });

    expect(payload['labels']).toEqual({});
    expect(payload['metadata']).toEqual({});
    expect(payload['user_id']).toBeNull();
    expect(payload['organization_id']).toBeNull();
  });

  it('builds mssql named instance create payload without port', () => {
    const draft = {
      ...createDraftFromType(mssqlTypeInfo),
      name: 'MSSQL Named',
      properties: {
        host: 'sql-host\\SQLEXPRESS',
        port: 1433,
        instance_name: 'stale',
        username: 'reader',
        database: 'dwh',
      },
      labelsText: '',
      metadataText: '',
    };

    const fieldDescriptors = getEffectiveFieldDescriptorsForDraft(
      draft,
      getFieldDescriptorsByType(mssqlTypeInfo, 'pyodbc')
    );
    const payload = buildCreatePayload({
      draft,
      propertiesFields: fieldDescriptors.propertiesFields,
      secretsFields: fieldDescriptors.secretsFields,
      driverOptionFields: fieldDescriptors.driverOptionFields,
    });
    const properties = payload['properties'] as Record<string, unknown>;
    const driverOptions = payload['driver_options'] as Record<string, unknown>;

    expect(fieldDescriptors.propertiesFields.map(field => field.name)).toEqual([
      'host',
      'username',
      'database',
    ]);
    expect(properties['host']).toBe('sql-host');
    expect(properties['instance_name']).toBe('SQLEXPRESS');
    expect(properties['port']).toBeUndefined();
    expect(driverOptions['driver_name']).toBe('ODBC Driver 18 for SQL Server');
    expect(driverOptions['odbc_driver_name']).toBeUndefined();
  });

  it('builds mssql tcp update payload with port and without instance_name', () => {
    const draft = {
      ...createDraftFromType(mssqlTypeInfo),
      name: 'MSSQL TCP',
      properties: {
        host: 'sql-host',
        port: 1433,
        instance_name: 'stale',
        username: 'reader',
        database: 'dwh',
      },
      driverOptions: {
        odbc_driver_name: 'ODBC Driver 17 for SQL Server',
      },
      labelsText: '',
      metadataText: '',
    };

    const fieldDescriptors = getEffectiveFieldDescriptorsForDraft(
      draft,
      getFieldDescriptorsByType(mssqlTypeInfo, 'pyodbc')
    );
    const payload = buildUpdatePayload({
      draft,
      propertiesFields: fieldDescriptors.propertiesFields,
      secretsFields: fieldDescriptors.secretsFields,
      driverOptionFields: fieldDescriptors.driverOptionFields,
      touchedSecrets: {},
    });
    const properties = payload['properties'] as Record<string, unknown>;
    const driverOptions = payload['driver_options'] as Record<string, unknown>;

    expect(fieldDescriptors.propertiesFields.map(field => field.name)).toEqual([
      'host',
      'port',
      'username',
      'database',
    ]);
    expect(properties['host']).toBe('sql-host');
    expect(properties['port']).toBe(1433);
    expect(properties['instance_name']).toBeUndefined();
    expect(driverOptions['driver_name']).toBe('ODBC Driver 17 for SQL Server');
    expect(driverOptions['odbc_driver_name']).toBeUndefined();
  });

  it('validates malformed mssql named instance hosts', () => {
    ['sql-host\\', '\\SQLEXPRESS'].forEach(host => {
      const draft = {
        ...createDraftFromType(mssqlTypeInfo),
        name: 'MSSQL Broken',
        properties: {
          host,
          port: 1433,
          username: 'reader',
          database: 'dwh',
        },
        labelsText: '',
        metadataText: '',
      };
      const fieldDescriptors = getEffectiveFieldDescriptorsForDraft(draft, {
        propertiesFields: mssqlPropertiesFields,
        secretsFields: [],
        driverOptionFields: [],
      });

      expect(
        validateDraft({
          draft,
          propertiesFields: fieldDescriptors.propertiesFields,
          secretsFields: fieldDescriptors.secretsFields,
          driverOptionFields: fieldDescriptors.driverOptionFields,
          isEditing: false,
        })['properties.host']
      ).toBe('Укажите host в формате server\\instance');
    });
  });

  it('builds update payload and omits untouched secret fields', () => {
    const draft = {
      ...createDraftFromType(typeInfo, sourceConnection),
      metadataText: '{"owner":"team-c"}',
    };

    const payload = buildUpdatePayload({
      draft,
      propertiesFields: [
        {
          section: 'properties',
          name: 'server',
          label: 'Server',
          required: true,
          nullable: false,
          kind: 'text',
        },
        {
          section: 'properties',
          name: 'share',
          label: 'Share',
          required: true,
          nullable: false,
          kind: 'text',
        },
        {
          section: 'properties',
          name: 'username',
          label: 'Username',
          required: true,
          nullable: false,
          kind: 'text',
        },
      ],
      secretsFields: [
        {
          section: 'secrets',
          name: 'password',
          label: 'Password',
          required: true,
          nullable: true,
          kind: 'text',
        },
      ],
      driverOptionFields: [],
      touchedSecrets: {},
      userId: 'target-user',
      organizationId: 'target-org',
    });

    expect(payload['secrets']).toBeUndefined();
    expect(payload['user_id']).toBe('target-user');
    expect(payload['organization_id']).toBe('target-org');
  });

  it('parses labels and metadata text helpers', () => {
    expect(parseLabelsText('env=prod\nteam=etl')).toEqual({
      env: 'prod',
      team: 'etl',
    });
    expect(parseMetadataText('{"a":1}')).toEqual({ a: 1 });
  });
});
