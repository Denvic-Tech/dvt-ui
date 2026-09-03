import {
  type FtpProperties,
  type S3Properties,
  type SftpProperties,
  SmbProtocolProperties,
  UserFileTreeSchema,
} from '@/shared/gatewayClient';

export type UserFileTreeWithConnectionID = UserFileTreeSchema & {
  connectionID: string;
};

export type FileStorageListContext = {
  bucket?: string | null;
  prefix?: string | null;
  initial_directory?: string | null;
};

export type FileStorageConnectionType = 's3' | 'ftp' | 'sftp' | 'smbprotocol';

export type FileStorageConnectionProperties =
  | S3Properties
  | FtpProperties
  | SftpProperties
  | SmbProtocolProperties;

export type S3FileStorageConnection = {
  id: string | number;
  kind: 'file';
  name: string;
  type: 's3';
  properties: S3Properties;
};

export type FtpFileStorageConnection = {
  id: string | number;
  kind: 'file';
  name: string;
  type: 'ftp';
  properties: FtpProperties;
};

export type SftpFileStorageConnection = {
  id: string | number;
  kind: 'file';
  name: string;
  type: 'sftp';
  properties: SftpProperties;
};

export type SmbFileStorageConnection = {
  id: string | number;
  kind: 'file';
  name: string;
  type: 'smbprotocol';
  properties: SmbProtocolProperties;
};

export type FileStorageConnection =
  | S3FileStorageConnection
  | FtpFileStorageConnection
  | SftpFileStorageConnection
  | SmbFileStorageConnection;

export type FileStorageNode = UserFileTreeSchema['nodes'][number];

export type FileStorageFileNode = Extract<FileStorageNode, { type: 'file' }>;

export type FileStorageFolderNode = Extract<
  FileStorageNode,
  {
    type: 'folder';
  }
>;

export type FileStorageConnectionMeta = {
  iconAlt: string;
  iconSrc: string;
  label: string;
  hint: string | null;
};
