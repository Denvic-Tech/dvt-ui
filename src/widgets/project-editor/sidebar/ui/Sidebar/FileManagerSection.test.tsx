import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileManagerSection } from './FileManagerSection';

const {
  clearErrorsMock,
  connectionsRef,
  fetchConnectionsMock,
  onOpenFileManagerMock,
} = vi.hoisted(() => ({
  clearErrorsMock: vi.fn(),
  connectionsRef: {
    current: {
      connections: [],
      error: null,
      loading: false,
    } as {
      connections: any[];
      error: string | null;
      loading: boolean;
    },
  },
  fetchConnectionsMock: vi.fn(() => Promise.resolve()),
  onOpenFileManagerMock: vi.fn(),
}));

vi.mock('@/entities/data/db-connection', () => ({
  ConnectionLogo: () => <div data-testid='connection-logo' />,
  isFileConnectionType: (type: string) =>
    ['s3', 'ftp', 'sftp', 'smbprotocol'].includes(type),
  useConnections: () => ({
    clearErrors: clearErrorsMock,
    connections: connectionsRef.current.connections,
    error: connectionsRef.current.error,
    fetchConnections: fetchConnectionsMock,
    loading: connectionsRef.current.loading,
  }),
}));

vi.mock('@/entities/data/storage', () => ({
  getFileStorageConnectionMeta: (connection: {
    properties: Record<string, unknown>;
    type: string;
  }) => ({
    hint:
      typeof connection.properties['bucket'] === 'string'
        ? String(connection.properties['bucket'])
        : typeof connection.properties['host'] === 'string'
          ? String(connection.properties['host'])
          : null,
  }),
  toFileStorageConnection: (connection: {
    kind: string;
    properties: Record<string, unknown>;
    type: string;
  }) => {
    if (connection.kind !== 'file') {
      return null;
    }

    if (
      connection.type === 's3' &&
      typeof connection.properties['bucket'] === 'string'
    ) {
      return connection;
    }

    if (
      connection.type === 'ftp' &&
      typeof connection.properties['host'] === 'string'
    ) {
      return connection;
    }

    return null;
  },
}));

describe('FileManagerSection', () => {
  beforeEach(() => {
    clearErrorsMock.mockReset();
    fetchConnectionsMock.mockClear();
    onOpenFileManagerMock.mockReset();
    connectionsRef.current = {
      connections: [
        {
          id: 's3-1',
          name: 'Artifacts S3',
          kind: 'file',
          type: 's3',
          driver: null,
          properties: {
            bucket: 'project-bucket',
            prefix: 'artifacts',
          },
        },
        {
          id: 'ftp-1',
          name: 'FTP Shared',
          kind: 'file',
          type: 'ftp',
          driver: null,
          properties: {
            host: 'ftp.example.com',
          },
        },
        {
          id: 'pg-1',
          name: 'Analytics PG',
          kind: 'sql',
          type: 'postgres',
          driver: null,
          properties: {
            host: 'db.example.com',
          },
        },
      ],
      error: null,
      loading: false,
    };
  });

  it('fetches connections and renders only file connections', () => {
    render(<FileManagerSection onOpenFileManager={onOpenFileManagerMock} />);

    expect(fetchConnectionsMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Artifacts S3')).toBeInTheDocument();
    expect(screen.getByText('FTP Shared')).toBeInTheDocument();
    expect(screen.queryByText('Analytics PG')).not.toBeInTheDocument();
  });

  it('filters file connections by search term and opens viewer on click', () => {
    render(
      <FileManagerSection
        onOpenFileManager={onOpenFileManagerMock}
        searchTerm='ftp'
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /FTP Shared/i }));

    expect(screen.queryByText('Artifacts S3')).not.toBeInTheDocument();
    expect(onOpenFileManagerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ftp-1',
        kind: 'file',
        type: 'ftp',
      })
    );
  });

  it('shows an empty state when no file connections match the search', () => {
    render(
      <FileManagerSection
        onOpenFileManager={onOpenFileManagerMock}
        searchTerm='missing'
      />
    );

    expect(
      screen.getByText('Файловые подключения не найдены')
    ).toBeInTheDocument();
  });
});
