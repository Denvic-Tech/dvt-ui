import { zVariableDescriptorMetadata } from '@/shared/gatewayClient';

const VARIABLE_DESCRIPTOR_KEYS = new Set([
  'type',
  'name',
  'var_type',
  'value_state',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isVariableDescriptor = (value: unknown): boolean => {
  return zVariableDescriptorMetadata.safeParse(value).success;
};

const normalizeDTypeMetadata = (dtypeMetadata: unknown) => {
  if (!isRecord(dtypeMetadata)) {
    return;
  }

  if (
    typeof dtypeMetadata['class'] !== 'string' ||
    dtypeMetadata['class'].trim().length === 0
  ) {
    const fallbackClass =
      [
        dtypeMetadata['name'],
        dtypeMetadata['repr'],
        dtypeMetadata['scalar_type'],
        dtypeMetadata['module'],
      ].find(
        candidate =>
          typeof candidate === 'string' && candidate.trim().length > 0
      ) ?? 'unknown';

    dtypeMetadata['class'] = fallbackClass;
  }
};

const normalizeColumnMetadata = (column: unknown) => {
  if (!isRecord(column)) {
    return;
  }

  normalizeDTypeMetadata(column['dtype_metadata']);
};

const toVariableDescriptor = (
  entryKey: string,
  value: unknown
): Record<string, unknown> | null => {
  if (typeof value === 'string') {
    const candidate = { name: entryKey, type: value };
    return isVariableDescriptor(candidate) ? candidate : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const candidate = {
    ...value,
    name: typeof value['name'] === 'string' ? value['name'] : entryKey,
  };

  return isVariableDescriptor(candidate) ? candidate : null;
};

const extractVariableDescriptors = (
  metadata: Record<string, unknown>
): Record<string, unknown>[] | null => {
  if (Array.isArray(metadata['variables'])) {
    const variables = metadata['variables'].filter(isRecord);
    return variables.length > 0 ? variables : [];
  }

  if (Array.isArray(metadata['items'])) {
    const items = metadata['items'].filter(isRecord);
    if (items.length === metadata['items'].length) {
      return items;
    }
  }

  if (isVariableDescriptor(metadata)) {
    return [metadata];
  }

  const entries = Object.entries(metadata).filter(
    ([key]) => !VARIABLE_DESCRIPTOR_KEYS.has(key)
  );

  if (entries.length === 0) {
    return null;
  }

  const descriptors = entries
    .map(([key, value]) => toVariableDescriptor(key, value))
    .filter((value): value is Record<string, unknown> => value !== null);

  return descriptors.length === entries.length ? descriptors : null;
};

const normalizeVariableMapMetadata = (metadata: Record<string, unknown>) => {
  metadata['type'] = 'VARIABLE_MAP';

  const descriptors = extractVariableDescriptors(metadata);
  if (descriptors !== null) {
    metadata['variables'] = descriptors;
  }
};

const inferMetadataType = (
  outputName: string,
  metadata: Record<string, unknown>
): string | null => {
  if (typeof metadata['type'] === 'string' && metadata['type'].trim().length) {
    return metadata['type'];
  }

  if (Array.isArray(metadata['columns'])) {
    return 'DATAFRAME';
  }

  if (Array.isArray(metadata['tables'])) {
    return 'DATABASE';
  }

  if (
    isRecord(metadata['cluster']) ||
    Array.isArray(metadata['topics']) ||
    Array.isArray(metadata['bootstrap_servers'])
  ) {
    return 'KAFKA';
  }

  if (
    typeof metadata['name'] === 'string' &&
    isRecord(metadata['column_data'])
  ) {
    return 'SERIES';
  }

  if (
    typeof metadata['connection_id'] === 'string' &&
    (isRecord(metadata['bucket']) ||
      typeof metadata['endpoint_url'] === 'string' ||
      typeof metadata['region'] === 'string')
  ) {
    return 'S3';
  }

  if (
    typeof metadata['connection_id'] === 'string' &&
    (typeof metadata['host'] === 'string' ||
      isRecord(metadata['directory']) ||
      typeof metadata['initial_directory'] === 'string')
  ) {
    return 'FTP';
  }

  if (
    outputName === 'output_variables' ||
    Array.isArray(metadata['variables']) ||
    Array.isArray(metadata['items']) ||
    isVariableDescriptor(metadata)
  ) {
    return 'VARIABLE_MAP';
  }

  const descriptors = extractVariableDescriptors(metadata);
  if (descriptors !== null) {
    return 'VARIABLE_MAP';
  }

  return null;
};

const normalizeOutputMetadata = (outputName: string, metadata: unknown) => {
  if (!isRecord(metadata)) {
    return;
  }

  const inferredType = inferMetadataType(outputName, metadata);
  if (inferredType !== null) {
    metadata['type'] = inferredType;
  }

  if (metadata['type'] === 'DATAFRAME' && Array.isArray(metadata['columns'])) {
    metadata['columns'].forEach(normalizeColumnMetadata);
    return;
  }

  if (metadata['type'] === 'DATABASE' && Array.isArray(metadata['tables'])) {
    metadata['tables'].forEach(table => {
      if (isRecord(table) && Array.isArray(table['columns'])) {
        table['columns'].forEach(normalizeColumnMetadata);
      }
    });
    return;
  }

  if (metadata['type'] === 'SERIES') {
    normalizeColumnMetadata(metadata['column_data']);
    return;
  }

  if (metadata['type'] === 'VARIABLE_MAP') {
    normalizeVariableMapMetadata(metadata);
  }
};

export const normalizeIncomingWebSocketMessage = (message: unknown) => {
  if (
    !isRecord(message) ||
    message['type'] !== 'NODE_METADATA' ||
    !isRecord(message['metadata'])
  ) {
    return message;
  }

  Object.entries(message['metadata']).forEach(
    ([outputName, outputMetadata]) => {
      normalizeOutputMetadata(outputName, outputMetadata);
    }
  );

  return message;
};
