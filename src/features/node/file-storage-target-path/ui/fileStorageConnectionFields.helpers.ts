import type { DBConnectionRecord } from '@/entities/data/db-connection';
import type {
  FileStorageConnectionType,
  FileStorageListContext,
} from '@/entities/data/storage';

import type {
  FtpMetadata,
  InputDefinitionModel,
  NodeDefinition,
  S3Metadata,
  SmbMetadata,
} from '@/shared/gatewayClient';
import {
  getSingleVariableNameFromValue,
  isConst,
  isExpressionValue,
} from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';

export type FileStorageConnectionMetadata =
  | S3Metadata
  | FtpMetadata
  | SmbMetadata
  | null;

export type FileStorageConnectionOverrideBranch = 's3' | 'ftp' | 'sftp';
export type FileStorageConnectionOverrideFieldName =
  | 'bucket'
  | 'prefix'
  | 'verify'
  | 'initial_directory';

export type FileStorageConnectionOverridesValue =
  | {
      type?: string | null;
      bucket?: unknown;
      prefix?: unknown;
      verify?: unknown;
      initial_directory?: unknown;
    }
  | null
  | undefined;

export type FileStorageConnectionOverrideField = {
  attrName: FileStorageConnectionOverrideFieldName;
  inputDefinition: InputDefinitionModel;
};

export type ResolvedFileStoragePickerState = {
  canBrowse: boolean;
  connectionContext: FileStorageListContext | null;
  connectionID: string | null;
  connectionRoot: string | null;
  connectionType: FileStorageConnectionType | null;
  disabledReason: string;
  resolvedPathValue: string | null;
};

const EMPTY_PICKER_STATE: ResolvedFileStoragePickerState = {
  canBrowse: false,
  connectionContext: null,
  connectionID: null,
  connectionRoot: null,
  connectionType: null,
  disabledReason: 'Подключите file-storage connection, чтобы выбрать путь',
  resolvedPathValue: null,
};

const FILE_STORAGE_CONNECTION_FIELD_ORDER: FileStorageConnectionOverrideFieldName[] =
  ['bucket', 'prefix', 'verify', 'initial_directory'];

const FILE_STORAGE_CONNECTION_FIELDS_BY_BRANCH: Record<
  FileStorageConnectionOverrideBranch,
  FileStorageConnectionOverrideFieldName[]
> = {
  s3: ['bucket', 'prefix', 'verify'],
  ftp: ['initial_directory'],
  sftp: ['initial_directory'],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toDisplayLabel = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((segment, index) =>
      index === 0
        ? segment.charAt(0).toUpperCase() + segment.slice(1)
        : segment.toLowerCase()
    )
    .join(' ');

const pickConnectionRecordType = (
  connectionRecord: DBConnectionRecord | null | undefined
): FileStorageConnectionType | null => {
  const rawType = connectionRecord?.type?.toLowerCase();

  if (
    rawType === 's3' ||
    rawType === 'ftp' ||
    rawType === 'sftp' ||
    rawType === 'smbprotocol'
  ) {
    return rawType;
  }

  return null;
};

const pickMetadataType = (
  connectionMetadata: FileStorageConnectionMetadata
): FileStorageConnectionType | null => {
  const rawType = connectionMetadata?.type?.toUpperCase();

  if (rawType === 'S3') {
    return 's3';
  }
  if (rawType === 'FTP') {
    return 'ftp';
  }
  if (rawType === 'SMB') {
    return 'smbprotocol';
  }

  return null;
};

const getActiveConnectionType = (args: {
  connectionMetadata: FileStorageConnectionMetadata;
  connectionRecord?: DBConnectionRecord | null | undefined;
}): FileStorageConnectionType | null => {
  const recordType = pickConnectionRecordType(args.connectionRecord);
  if (recordType) {
    return recordType;
  }

  return pickMetadataType(args.connectionMetadata);
};

export const getFileStorageOverrideBranch = (
  connectionType: FileStorageConnectionType | null
): FileStorageConnectionOverrideBranch | null => {
  if (connectionType === 's3') {
    return 's3';
  }
  if (connectionType === 'ftp') {
    return 'ftp';
  }
  if (connectionType === 'sftp') {
    return 'sftp';
  }

  return null;
};

const buildSyntheticInputDefinition = (args: {
  attrName: FileStorageConnectionOverrideFieldName;
  baseInputDefinition: InputDefinitionModel | null | undefined;
  propertySchema?: Record<string, unknown> | undefined;
}): InputDefinitionModel => {
  const { attrName, baseInputDefinition, propertySchema } = args;
  const propertyVariants = Array.isArray(propertySchema?.['anyOf'])
    ? propertySchema['anyOf'].filter(isRecord)
    : [];
  const isBoolean =
    propertySchema?.['type'] === 'boolean' ||
    propertyVariants.some(variant => variant['type'] === 'boolean');

  return {
    attr_name: attrName,
    display_name:
      typeof propertySchema?.['title'] === 'string' &&
      propertySchema['title'].trim()
        ? propertySchema['title'].trim()
        : toDisplayLabel(attrName),
    type: isBoolean ? 'BOOLEAN' : 'STRING',
    display_type: isBoolean ? 'BOOLEAN' : 'STRING',
    is_list_type: false,
    is_literal_type: false,
    options: null,
    optional: true,
    is_hidden: false,
    description:
      typeof propertySchema?.['description'] === 'string'
        ? propertySchema['description']
        : null,
    default: null,
    multiline: false,
    metadata_source_field: null,
    min_value: null,
    max_value: null,
    step: null,
    round_val: null,
    schema: null,
    allow_multiple_connections: false,
    allow_new: false,
    allow_expressions: baseInputDefinition?.allow_expressions ?? true,
    expression_policy: baseInputDefinition?.expression_policy ?? 'default',
    force_handle_visible: false,
    use_widget: null,
    use_connection: null,
  };
};

const getOverrideSchemaBranches = (
  nodeDefinition: NodeDefinition | null | undefined
) => {
  const schema =
    nodeDefinition?.input_definitions?.['connection_overrides']?.schema;
  const oneOf = isRecord(schema) ? schema['oneOf'] : null;

  if (!Array.isArray(oneOf)) {
    return [];
  }

  return oneOf.filter(isRecord);
};

export const getFileStorageOverrideFields = (args: {
  nodeDefinition: NodeDefinition | null | undefined;
  branch: FileStorageConnectionOverrideBranch | null;
}): FileStorageConnectionOverrideField[] => {
  const { nodeDefinition, branch } = args;
  if (!branch) {
    return [];
  }

  const baseInputDefinition =
    nodeDefinition?.input_definitions?.['connection_overrides'];
  const branchFields = FILE_STORAGE_CONNECTION_FIELDS_BY_BRANCH[branch];
  const matchingBranch = getOverrideSchemaBranches(nodeDefinition).find(
    branchSchema => {
      const properties = isRecord(branchSchema['properties'])
        ? branchSchema['properties']
        : null;
      const typeSchema =
        properties && isRecord(properties['type']) ? properties['type'] : null;

      return typeSchema?.['const'] === branch;
    }
  );

  const propertyMap = isRecord(matchingBranch?.['properties'])
    ? matchingBranch['properties']
    : null;

  return branchFields
    .map(attrName => {
      const propertySchema = isRecord(propertyMap?.[attrName])
        ? propertyMap?.[attrName]
        : undefined;

      return {
        attrName,
        inputDefinition: buildSyntheticInputDefinition({
          attrName,
          baseInputDefinition,
          propertySchema,
        }),
      };
    })
    .sort(
      (left, right) =>
        FILE_STORAGE_CONNECTION_FIELD_ORDER.indexOf(left.attrName) -
        FILE_STORAGE_CONNECTION_FIELD_ORDER.indexOf(right.attrName)
    );
};

const normalizeStoredOverrideValue = (value: unknown) => {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim() ? value : undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (isExpressionValue(value) || isConst(value)) {
    return value;
  }

  return undefined;
};

export const getNormalizedConnectionOverridesValue = (args: {
  branch: FileStorageConnectionOverrideBranch | null;
  fields: FileStorageConnectionOverrideField[];
  value: FileStorageConnectionOverridesValue;
}): FileStorageConnectionOverridesValue => {
  const { branch, fields, value } = args;

  if (!branch || fields.length === 0 || !isRecord(value)) {
    return null;
  }

  const next: Record<string, unknown> = {
    type: branch,
  };

  fields.forEach(field => {
    const normalizedValue = normalizeStoredOverrideValue(value[field.attrName]);
    if (normalizedValue !== undefined) {
      next[field.attrName] = normalizedValue;
    }
  });

  return Object.keys(next).length > 1 ? next : null;
};

export const getConnectionOverrideFieldValue = (args: {
  branch: FileStorageConnectionOverrideBranch | null;
  fieldName: FileStorageConnectionOverrideFieldName;
  value: FileStorageConnectionOverridesValue;
}) => {
  const { branch, fieldName, value } = args;

  if (!branch || !isRecord(value) || value.type !== branch) {
    return '';
  }

  return value[fieldName] ?? '';
};

export const setConnectionOverrideFieldValue = (args: {
  branch: FileStorageConnectionOverrideBranch | null;
  fieldName: FileStorageConnectionOverrideFieldName;
  fieldValue: unknown;
  fields: FileStorageConnectionOverrideField[];
  value: FileStorageConnectionOverridesValue;
}): FileStorageConnectionOverridesValue => {
  const { branch, fieldName, fieldValue, fields, value } = args;
  if (!branch) {
    return null;
  }

  const currentValue =
    isRecord(value) && value.type === branch ? { ...value } : { type: branch };

  if (
    fieldValue == null ||
    (typeof fieldValue === 'string' && fieldValue.trim().length === 0)
  ) {
    delete currentValue[fieldName];
  } else {
    currentValue[fieldName] = fieldValue;
  }

  return getNormalizedConnectionOverridesValue({
    branch,
    fields,
    value: currentValue,
  });
};

export const isSameConnectionOverridesValue = (
  left: FileStorageConnectionOverridesValue,
  right: FileStorageConnectionOverridesValue
) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

type ResolvedPickerStringValue =
  | { kind: 'empty'; value: null }
  | { kind: 'resolved'; value: string }
  | { kind: 'blocked'; reason: string };

const buildBlockedExpressionReason = (
  label: string,
  variant: 'empty' | 'complex' | 'missing' | 'type'
) => {
  if (variant === 'empty') {
    return `File picker недоступен: поле "${label}" задано пустым выражением.`;
  }
  if (variant === 'complex') {
    return `File picker недоступен: поле "${label}" задано сложным выражением. Используйте literal или прямую ссылку на строковую переменную.`;
  }
  if (variant === 'type') {
    return `File picker недоступен: поле "${label}" должно разрешиться в строку.`;
  }

  return `File picker недоступен: значение для поля "${label}" ещё не определено.`;
};

export const resolvePickerStringValue = (args: {
  label: string;
  value: unknown;
  variables: VariableOutput[];
}): ResolvedPickerStringValue => {
  const { label, value, variables } = args;

  if (value == null) {
    return { kind: 'empty', value: null };
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue
      ? { kind: 'resolved', value: trimmedValue }
      : { kind: 'empty', value: null };
  }

  if (!isExpressionValue(value)) {
    return {
      kind: 'blocked',
      reason: buildBlockedExpressionReason(label, 'type'),
    };
  }

  if (!value.value.trim()) {
    return {
      kind: 'blocked',
      reason: buildBlockedExpressionReason(label, 'empty'),
    };
  }

  const variableName = getSingleVariableNameFromValue(value);
  if (!variableName) {
    return {
      kind: 'blocked',
      reason: buildBlockedExpressionReason(label, 'complex'),
    };
  }

  const variable = variables.find(candidate => candidate.name === variableName);
  if (!variable || variable.value == null) {
    return {
      kind: 'blocked',
      reason: buildBlockedExpressionReason(label, 'missing'),
    };
  }

  if (typeof variable.value !== 'string') {
    return {
      kind: 'blocked',
      reason: buildBlockedExpressionReason(label, 'type'),
    };
  }

  const trimmedValue = variable.value.trim();
  return trimmedValue
    ? { kind: 'resolved', value: trimmedValue }
    : { kind: 'empty', value: null };
};

const buildConnectionRoot = (args: {
  connectionMetadata: FileStorageConnectionMetadata;
  connectionRecord?: DBConnectionRecord | null | undefined;
  connectionType: FileStorageConnectionType | null;
  connectionContext: FileStorageListContext | null;
}) => {
  const {
    connectionContext,
    connectionMetadata,
    connectionRecord,
    connectionType,
  } = args;

  if (!connectionType) {
    return null;
  }

  if (connectionType === 's3') {
    const recordProperties = isRecord(connectionRecord?.properties)
      ? connectionRecord.properties
      : null;
    const s3Metadata =
      connectionMetadata?.type === 'S3' ? connectionMetadata : null;
    const bucket =
      connectionContext?.bucket?.trim() ||
      (typeof s3Metadata?.bucket?.name === 'string'
        ? s3Metadata.bucket.name.trim()
        : '') ||
      (typeof recordProperties?.['bucket'] === 'string'
        ? recordProperties['bucket'].trim()
        : '');
    const prefix =
      connectionContext?.prefix?.trim() ||
      connectionMetadata?.connection_prefix?.trim() ||
      (typeof recordProperties?.['prefix'] === 'string'
        ? recordProperties['prefix'].trim()
        : '');

    const rootPath = [bucket, prefix].filter(Boolean).join('/');
    return rootPath ? `s3://${rootPath}` : 's3://';
  }

  if (connectionType === 'ftp' || connectionType === 'sftp') {
    const recordProperties = isRecord(connectionRecord?.properties)
      ? connectionRecord.properties
      : null;
    const initialDirectory =
      connectionContext?.initial_directory?.trim() ||
      connectionMetadata?.connection_prefix?.trim() ||
      (typeof recordProperties?.['initial_directory'] === 'string'
        ? recordProperties['initial_directory'].trim()
        : '');
    const protocol = connectionType === 'sftp' ? 'sftp://' : 'ftp://';
    return initialDirectory
      ? `${protocol}${initialDirectory.replace(/^\/+/, '')}`
      : protocol;
  }

  if (connectionType === 'smbprotocol') {
    const share =
      isRecord(connectionRecord?.properties) &&
      typeof connectionRecord.properties['share'] === 'string'
        ? connectionRecord.properties['share'].trim()
        : '';

    return share ? `smb://${share}` : 'smb://';
  }

  return null;
};

export const buildResolvedFileStoragePickerState = (args: {
  connectionMetadata: FileStorageConnectionMetadata;
  connectionOverrides: FileStorageConnectionOverridesValue;
  connectionRecord?: DBConnectionRecord | null | undefined;
  nodeDefinition: NodeDefinition | null | undefined;
  pathLabel?: string | undefined;
  pathValue?: unknown;
  variables: VariableOutput[];
}): ResolvedFileStoragePickerState => {
  const {
    connectionMetadata,
    connectionOverrides,
    connectionRecord,
    nodeDefinition,
    pathLabel = 'Path',
    pathValue,
    variables,
  } = args;

  const connectionID = connectionMetadata?.connection_id?.trim() ?? null;
  const connectionType = getActiveConnectionType({
    connectionMetadata,
    connectionRecord,
  });
  const branch = getFileStorageOverrideBranch(connectionType);
  const fields = getFileStorageOverrideFields({
    nodeDefinition,
    branch,
  });
  const normalizedOverrides = getNormalizedConnectionOverridesValue({
    branch,
    fields,
    value: connectionOverrides,
  });

  if (!connectionID) {
    return {
      ...EMPTY_PICKER_STATE,
      connectionType,
    };
  }

  for (const field of fields) {
    if (field.attrName === 'verify') {
      continue;
    }

    const fieldLabel =
      field.inputDefinition.display_name || toDisplayLabel(field.attrName);
    const resolution = resolvePickerStringValue({
      label: fieldLabel,
      value: getConnectionOverrideFieldValue({
        branch,
        fieldName: field.attrName,
        value: normalizedOverrides,
      }),
      variables,
    });

    if (resolution.kind === 'blocked') {
      return {
        canBrowse: false,
        connectionContext: null,
        connectionID,
        connectionRoot: buildConnectionRoot({
          connectionMetadata,
          connectionRecord,
          connectionType,
          connectionContext: null,
        }),
        connectionType,
        disabledReason: resolution.reason,
        resolvedPathValue: null,
      };
    }
  }

  const pathResolution =
    pathValue === undefined
      ? ({ kind: 'empty', value: null } satisfies ResolvedPickerStringValue)
      : resolvePickerStringValue({
          label: pathLabel,
          value: pathValue,
          variables,
        });

  if (pathResolution.kind === 'blocked') {
    return {
      canBrowse: false,
      connectionContext: null,
      connectionID,
      connectionRoot: buildConnectionRoot({
        connectionMetadata,
        connectionRecord,
        connectionType,
        connectionContext: null,
      }),
      connectionType,
      disabledReason: pathResolution.reason,
      resolvedPathValue: null,
    };
  }

  const connectionContext: FileStorageListContext = {};

  fields.forEach(field => {
    if (field.attrName === 'verify') {
      return;
    }

    const fieldLabel =
      field.inputDefinition.display_name || toDisplayLabel(field.attrName);
    const resolution = resolvePickerStringValue({
      label: fieldLabel,
      value: getConnectionOverrideFieldValue({
        branch,
        fieldName: field.attrName,
        value: normalizedOverrides,
      }),
      variables,
    });

    if (resolution.kind === 'resolved') {
      connectionContext[field.attrName] = resolution.value;
    }
  });

  const normalizedContext =
    Object.keys(connectionContext).length > 0 ? connectionContext : null;

  return {
    canBrowse: true,
    connectionContext: normalizedContext,
    connectionID,
    connectionRoot: buildConnectionRoot({
      connectionMetadata,
      connectionRecord,
      connectionType,
      connectionContext: normalizedContext,
    }),
    connectionType,
    disabledReason: 'Открыть file picker',
    resolvedPathValue:
      pathResolution.kind === 'resolved' ? pathResolution.value : null,
  };
};

export const resolveConnectedFileStorageType = getActiveConnectionType;

export const getConnectionOverrideFieldDefaultValue = (args: {
  connectionMetadata: FileStorageConnectionMetadata;
  connectionRecord?: DBConnectionRecord | null | undefined;
  fieldName: FileStorageConnectionOverrideFieldName;
}): string => {
  const { connectionMetadata, connectionRecord, fieldName } = args;
  const recordProperties = isRecord(connectionRecord?.properties)
    ? connectionRecord.properties
    : null;
  const s3Metadata =
    connectionMetadata?.type === 'S3' ? connectionMetadata : null;

  if (fieldName === 'bucket') {
    if (typeof s3Metadata?.bucket?.name === 'string') {
      return s3Metadata.bucket.name.trim();
    }

    if (typeof recordProperties?.['bucket'] === 'string') {
      return recordProperties['bucket'].trim();
    }

    return '';
  }

  if (fieldName === 'prefix') {
    if (typeof connectionMetadata?.connection_prefix === 'string') {
      return connectionMetadata.connection_prefix.trim();
    }

    if (typeof recordProperties?.['prefix'] === 'string') {
      return recordProperties['prefix'].trim();
    }

    return '';
  }

  if (fieldName === 'verify') {
    if (typeof recordProperties?.['verify'] === 'boolean') {
      return String(recordProperties['verify']);
    }

    return '';
  }

  if (fieldName === 'initial_directory') {
    if (typeof connectionMetadata?.connection_prefix === 'string') {
      return connectionMetadata.connection_prefix.trim();
    }

    if (typeof recordProperties?.['initial_directory'] === 'string') {
      return recordProperties['initial_directory'].trim();
    }
  }

  return '';
};
