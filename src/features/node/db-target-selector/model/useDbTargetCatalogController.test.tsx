import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DbMetadata } from '@/shared/gatewayClient';

import { useDbTargetCatalogController } from './useDbTargetCatalogController';

const { databasesHook } = vi.hoisted(() => ({
  databasesHook: vi.fn(),
}));

vi.mock('@/entities/data/db-connection/model/hooks/useDbCatalog', () => {
  const emptyListResult = {
    items: [],
    state: 'ready' as const,
    error: null,
    meta: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    isRefreshing: false,
    loadMoreError: null,
    loadNextPage: vi.fn(),
    retry: vi.fn(),
  };

  return {
    getDbCatalogCapabilities: () => ({
      supportsDatabases: true,
      supportsSchemas: true,
      supportsTables: true,
      supportsViews: true,
      supportsSearch: true,
      maxPageSize: 200,
    }),
    useDbCatalogDatabases: (
      metadata: DbMetadata,
      options: { enabled?: boolean; search?: string | null }
    ) => {
      databasesHook(metadata, options);
      return emptyListResult;
    },
    useDbCatalogSchemas: () => emptyListResult,
    useDbCatalogTables: () => emptyListResult,
    useDbCatalogTable: () => ({
      item: null,
      state: 'idle',
      error: null,
      meta: null,
      isRefreshing: false,
      retry: vi.fn(),
    }),
    useRefreshDbCatalog: () => ({
      refresh: vi.fn(),
      isLoading: false,
    }),
  };
});

const metadata = {
  type: 'DATABASE',
  connection_id: 'connection-1',
  connection_revision: 'revision-1',
  catalog_mode: 'lazy',
  dialect: 'postgresql',
  database_name: null,
  databases: [],
  schemas: [],
  tables: [],
} as DbMetadata;

describe('useDbTargetCatalogController', () => {
  it('keeps an opened catalog level subscribed after accordion collapse', async () => {
    const { rerender } = renderHook(
      ({ enabled }) =>
        useDbTargetCatalogController(metadata, {
          databasesEnabled: enabled,
          schemasEnabled: false,
          tablesEnabled: false,
          detailEnabled: false,
        }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => {
      expect(databasesHook).toHaveBeenLastCalledWith(
        metadata,
        expect.objectContaining({ enabled: true })
      );
    });

    rerender({ enabled: false });

    await waitFor(() => {
      expect(databasesHook).toHaveBeenLastCalledWith(
        metadata,
        expect.objectContaining({ enabled: true })
      );
    });
  });
});
