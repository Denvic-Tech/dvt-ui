import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileStorageTreePicker } from './index';

vi.mock('@mui/x-tree-view/SimpleTreeView', () => ({
  SimpleTreeView: ({ children }: { children: ReactNode }) => (
    <div data-testid='simple-tree-view'>{children}</div>
  ),
}));

vi.mock('@mui/x-tree-view/TreeItem', () => ({
  TreeItem: ({
    children,
    label,
  }: {
    children?: ReactNode;
    label: ReactNode;
  }) => (
    <div>
      {label}
      {children}
    </div>
  ),
}));

const listMock = vi.fn();

vi.mock('@/entities/data/storage/api.ts', () => ({
  storageApi: {
    list: (...args: unknown[]) => listMock(...args),
  },
}));

describe('FileStorageTreePicker', () => {
  beforeEach(() => {
    listMock.mockReset();
    listMock.mockResolvedValue({
      path: '',
      nodes: [
        { type: 'folder', name: 'archive', path: 'archive' },
        { type: 'file', name: 'report.csv', path: 'report.csv', size: 10 },
        { type: 'file', name: 'notes.txt', path: 'notes.txt', size: 5 },
      ],
      is_truncated: false,
    });
  });

  it('renders mixed storage nodes and root metadata', async () => {
    render(
      <FileStorageTreePicker
        connectionID='ftp-1'
        connectionName='FTP Storage'
        connectionType='ftp'
        rootHint='incoming'
        mode='file_or_folder'
      />
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith('ftp-1', '/', undefined, undefined);
    });

    expect(screen.getByText('FTP Storage')).toBeInTheDocument();
    expect(screen.getByText('incoming')).toBeInTheDocument();
    expect(screen.getByText('archive')).toBeInTheDocument();
    expect(screen.getByText('report.csv')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  it('filters files and folders by search term', async () => {
    render(
      <FileStorageTreePicker
        connectionID='ftp-2'
        connectionName='Filtered Storage'
        connectionType='sftp'
        rootHint='dropzone'
        mode='file_or_folder'
        searchTerm='csv'
      />
    );

    await waitFor(() => {
      expect(screen.getByText('report.csv')).toBeInTheDocument();
    });

    expect(screen.queryByText('archive')).not.toBeInTheDocument();
    expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
  });
});
