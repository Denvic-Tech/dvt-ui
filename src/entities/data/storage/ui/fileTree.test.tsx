import { describe, expect, it } from 'vitest';

import { FileStorageConnection } from '@/entities/data/storage';
import {
  applyFileStorageListContext,
  getFileStorageConnectionMeta,
  toFileStorageConnection,
} from '@/entities/data/storage/model/helpers';

import type {
  FtpProperties,
  S3Properties,
  SftpProperties,
} from '@/shared/gatewayClient';

describe('fileTree helpers', () => {
  it('maps S3 connection metadata to name-first label and bucket-prefixed hint', () => {
    const connection: FileStorageConnection = {
      id: '1',
      kind: 'file',
      name: 'Raw S3',
      type: 's3',
      properties: {
        bucket: 'bucket',
        prefix: 'landing/raw',
      } as S3Properties,
    };

    expect(getFileStorageConnectionMeta(connection)).toMatchObject({
      label: 'Raw S3',
      hint: 'bucket/landing/raw',
      iconAlt: 'S3',
    });
  });

  it('maps FTP and SFTP initial directories to root hints', () => {
    const ftp: FileStorageConnection = {
      id: '2',
      kind: 'file',
      name: 'FTP Uploads',
      type: 'ftp',
      properties: {
        host: 'ftp.local',
        initial_directory: '/incoming',
      } as FtpProperties,
    };
    const sftp: FileStorageConnection = {
      id: '3',
      kind: 'file',
      name: 'Secure Drop',
      type: 'sftp',
      properties: {
        host: 'sftp.local',
        username: 'user',
        initial_directory: '/dropzone',
      } as SftpProperties,
    };

    expect(getFileStorageConnectionMeta(ftp)).toMatchObject({
      label: 'FTP Uploads',
      hint: 'incoming',
      iconAlt: 'FTP',
    });
    expect(getFileStorageConnectionMeta(sftp)).toMatchObject({
      label: 'Secure Drop',
      hint: 'dropzone',
      iconAlt: 'SFTP',
    });
  });

  it('adapts generic connection records to file storage connections', () => {
    const connection = toFileStorageConnection({
      id: '4',
      kind: 'file',
      name: 'Warehouse',
      type: 's3',
      properties: {
        bucket: 'analytics',
        prefix: 'warehouse',
      } satisfies S3Properties,
    });

    expect(connection).toEqual({
      id: '4',
      kind: 'file',
      name: 'Warehouse',
      type: 's3',
      properties: {
        bucket: 'analytics',
        prefix: 'warehouse',
      },
    });
  });

  it('applies context fields to file storage connections for picker browsing', () => {
    const s3Connection: FileStorageConnection = {
      id: '6',
      kind: 'file',
      name: 'Warehouse',
      type: 's3',
      properties: {
        bucket: 'analytics',
        prefix: 'warehouse',
      } as S3Properties,
    };
    const sftpConnection: FileStorageConnection = {
      id: '7',
      kind: 'file',
      name: 'Secure Drop',
      type: 'sftp',
      properties: {
        host: 'sftp.local',
        username: 'user',
        initial_directory: '/dropzone',
      } as SftpProperties,
    };

    expect(
      applyFileStorageListContext(s3Connection, {
        bucket: 'raw-bucket',
        prefix: 'incoming',
      })
    ).toMatchObject({
      properties: {
        bucket: 'raw-bucket',
        prefix: 'incoming',
      },
    });
    expect(
      applyFileStorageListContext(sftpConnection, {
        initial_directory: '/landing',
      })
    ).toMatchObject({
      properties: {
        initial_directory: '/landing',
      },
    });
  });

  it('rejects legacy connection_properties records', () => {
    expect(
      toFileStorageConnection({
        id: '5',
        name: 'Legacy FTP',
        type: 'ftp',
        connection_properties: {
          host: 'legacy.local',
        },
      })
    ).toBeNull();
  });
});
