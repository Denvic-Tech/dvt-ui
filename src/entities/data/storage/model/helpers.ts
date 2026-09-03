import FTPLogo from '@/shared/assets/FTP-icon.svg';
import S3Logo from '@/shared/assets/S3-icon.svg';
import SFTPLogo from '@/shared/assets/SFTP-icon.svg';
import SMBLogo from '@/shared/assets/SMB-icon.svg';
import type {
  FtpProperties,
  S3Properties,
  SftpProperties,
  SmbProtocolProperties,
} from '@/shared/gatewayClient';

import type {
  FileStorageConnection,
  FileStorageConnectionMeta,
  FileStorageConnectionProperties,
  FileStorageListContext,
} from '../model/types';

export const normalizePath = (path: string) =>
  path.replace(/^\/*/, '').replace(/\/*$/, '');
export const joinPath = (parent: string, name: string) =>
  normalizePath([parent, name].filter(Boolean).join('/'));
export const folderId = (path: string) => `dir:${path || '/'}`;
export const fileId = (path: string) => `file:${path}`;

const FILE_STORAGE_CONNECTION_TYPES = [
  's3',
  'ftp',
  'sftp',
  'smbprotocol',
] as const;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFileStorageConnectionType = (
  value: unknown
): value is FileStorageConnection['type'] =>
  typeof value === 'string' &&
  FILE_STORAGE_CONNECTION_TYPES.includes(
    value as (typeof FILE_STORAGE_CONNECTION_TYPES)[number]
  );

const isS3Properties = (value: unknown): value is S3Properties =>
  isObjectRecord(value) &&
  typeof value['bucket'] === 'string' &&
  (value['prefix'] == null || typeof value['prefix'] === 'string');

const isFtpProperties = (value: unknown): value is FtpProperties =>
  isObjectRecord(value) && typeof value['host'] === 'string';

const isSftpProperties = (value: unknown): value is SftpProperties =>
  isObjectRecord(value) &&
  typeof value['host'] === 'string' &&
  typeof value['username'] === 'string';

const isSmbProtocolProperties = (
  value: unknown
): value is SmbProtocolProperties =>
  isObjectRecord(value) &&
  typeof value['host'] === 'string' &&
  typeof value['username'] === 'string' &&
  typeof value['share'] === 'string';

const isConnectionPropertiesForType = (
  type: FileStorageConnection['type'],
  properties: unknown
): properties is FileStorageConnectionProperties => {
  switch (type) {
    case 's3':
      return isS3Properties(properties);
    case 'ftp':
      return isFtpProperties(properties);
    case 'sftp':
      return isSftpProperties(properties);
    default:
      return false;
  }
};

export const toFileStorageConnection = (
  connection: unknown
): FileStorageConnection | null => {
  if (!isObjectRecord(connection)) {
    return null;
  }

  if (
    (typeof connection['id'] !== 'string' &&
      typeof connection['id'] !== 'number') ||
    typeof connection['name'] !== 'string' ||
    !isFileStorageConnectionType(connection['type'])
  ) {
    return null;
  }

  switch (connection['type']) {
    case 's3': {
      const properties = connection['properties'];

      if (!isS3Properties(properties)) {
        return null;
      }

      return {
        id: connection['id'],
        kind: 'file',
        name: connection['name'],
        type: 's3',
        properties,
      };
    }
    case 'ftp': {
      const properties = connection['properties'];

      if (!isFtpProperties(properties)) {
        return null;
      }

      return {
        id: connection['id'],
        kind: 'file',
        name: connection['name'],
        type: 'ftp',
        properties,
      };
    }
    case 'sftp': {
      const properties = connection['properties'];

      if (!isSftpProperties(properties)) {
        return null;
      }

      return {
        id: connection['id'],
        kind: 'file',
        name: connection['name'],
        type: 'sftp',
        properties,
      };
    }
    case 'smbprotocol': {
      const properties = connection['properties'];

      if (!isSmbProtocolProperties(properties)) {
        return null;
      }

      return {
        id: connection['id'],
        kind: 'file',
        name: connection['name'],
        type: 'smbprotocol',
        properties,
      };
    }
    default:
      return null;
  }
};

export const isFileStorageConnection = (
  connection: unknown
): connection is FileStorageConnection =>
  toFileStorageConnection(connection) !== null;

export const getFileStorageConnectionMeta = (
  connection: FileStorageConnection
): FileStorageConnectionMeta => {
  const fallbackLabel = `Подключение #${String(connection.id)}`;

  if (connection.type === 's3') {
    const properties = connection.properties as S3Properties;
    const bucket = normalizePath(properties.bucket || '');
    const prefix = normalizePath(properties.prefix || '');
    const hint = [bucket, prefix].filter(Boolean).join('/');

    return {
      iconAlt: 'S3',
      iconSrc: S3Logo,
      label: connection.name?.trim() || fallbackLabel,
      hint: hint || null,
    };
  }

  if (connection.type === 'ftp') {
    const properties = connection.properties as FtpProperties;
    return {
      iconAlt: 'FTP',
      iconSrc: FTPLogo,
      label: connection.name?.trim() || fallbackLabel,
      hint: normalizePath(properties.initial_directory || '') || null,
    };
  }

  if (connection.type === 'sftp') {
    const properties = connection.properties as SftpProperties;
    return {
      iconAlt: 'SFTP',
      iconSrc: SFTPLogo,
      label: connection.name?.trim() || fallbackLabel,
      hint: normalizePath(properties.initial_directory || '') || null,
    };
  }

  if (connection.type === 'smbprotocol') {
    const properties = connection.properties as SmbProtocolProperties;
    return {
      iconAlt: 'SMB',
      iconSrc: SMBLogo,
      label: connection.name?.trim() || fallbackLabel,
      hint: normalizePath(properties.share) || null,
    };
  }

  throw new Error(
    `Unknown file storage connection: '${connection['type'] || 'unknown'}' (ID=${connection['id'] || 'unknown'})`
  );
};

export const applyFileStorageListContext = (
  connection: FileStorageConnection,
  context?: FileStorageListContext | null
): FileStorageConnection => {
  if (!context) {
    return connection;
  }

  if (connection.type === 's3') {
    return {
      ...connection,
      properties: {
        ...(connection.properties as S3Properties),
        ...(context.bucket?.trim() ? { bucket: context.bucket.trim() } : {}),
        ...(context.prefix !== undefined && context.prefix !== null
          ? { prefix: context.prefix }
          : {}),
      },
    };
  }

  if (connection.type === 'ftp') {
    return {
      ...connection,
      properties: {
        ...(connection.properties as FtpProperties),
        ...(context.initial_directory !== undefined
          ? { initial_directory: context.initial_directory }
          : {}),
      },
    };
  }

  if (connection.type === 'sftp') {
    return {
      ...connection,
      properties: {
        ...(connection.properties as SftpProperties),
        ...(context.initial_directory !== undefined
          ? { initial_directory: context.initial_directory }
          : {}),
      },
    };
  }

  return connection;
};
