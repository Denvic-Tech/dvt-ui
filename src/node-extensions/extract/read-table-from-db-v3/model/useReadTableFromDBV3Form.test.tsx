import React, { useState } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReadTableFromDBV3Values } from '../lib/types';

import { useReadTableFromDBV3Form } from './useReadTableFromDBV3Form';

const { metadataRef, tableDetailRef } = vi.hoisted(() => ({
  metadataRef: {
    current: null as any,
  },
  tableDetailRef: {
    current: null as any,
  },
}));

vi.mock('@/features/node/get-node-metadata', () => ({
  useConnectedNodeMetadata: () => ({
    connectedNodeMetadataByInput: metadataRef.current,
    actualConnectedNodeMetadataByInput: metadataRef.current,
    connectedNodeMetadataActualityByInput: {
      connection: true,
    },
  }),
}));

vi.mock(
  '@/entities/data/db-connection/model/hooks/useDbCatalog',
  async importOriginal => {
    const original =
      await importOriginal<
        typeof import('@/entities/data/db-connection/model/hooks/useDbCatalog')
      >();
    return {
      ...original,
      useDbCatalogDatabases: () => ({
        items: [],
        state: 'ready',
        error: null,
        meta: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        isRefreshing: false,
        loadMoreError: null,
        loadNextPage: vi.fn(),
        retry: vi.fn(),
      }),
      useDbCatalogSchemas: () => ({
        items: [],
        state: 'ready',
        error: null,
        meta: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        isRefreshing: false,
        loadMoreError: null,
        loadNextPage: vi.fn(),
        retry: vi.fn(),
      }),
      useDbCatalogTables: () => ({
        items: [],
        state: 'ready',
        error: null,
        meta: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        isRefreshing: false,
        loadMoreError: null,
        loadNextPage: vi.fn(),
        retry: vi.fn(),
      }),
      useDbCatalogTable: () =>
        tableDetailRef.current ?? {
          item: null,
          state: 'idle',
          error: null,
          meta: null,
          isRefreshing: false,
          retry: vi.fn(),
        },
      useRefreshDbCatalog: () => ({
        refresh: vi.fn(),
        isLoading: false,
      }),
    };
  }
);

const baseMetadata = {
  connection_id: 'connection-postgres',
  dialect: 'postgresql',
  databases: [
    {
      name: 'analytics',
      schemas: [
        {
          name: 'public',
          tables: [
            {
              name: 'orders',
              columns: [{ name: 'id' }, { name: 'amount' }],
              type: 'BASE TABLE',
            },
            {
              name: 'customers',
              columns: [{ name: 'id' }, { name: 'email' }],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    },
    {
      name: 'warehouse',
      schemas: [
        {
          name: 'staging',
          tables: [
            {
              name: 'events',
              columns: [{ name: 'event_id' }],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    },
  ],
} as any;

const renderReadTableForm = (initialValue: ReadTableFromDBV3Values) => {
  return renderHook(() => {
    const [localInputData, setLocalInputData] =
      useState<ReadTableFromDBV3Values>(initialValue);

    const form = useReadTableFromDBV3Form({
      nodeID: 'node-1',
      localInputData,
      setLocalInputData,
    });

    return {
      form,
      localInputData,
    };
  });
};

describe('useReadTableFromDBV3Form', () => {
  beforeEach(() => {
    tableDetailRef.current = null;
  });

  it('opens the first incomplete required section and falls back to table', () => {
    metadataRef.current = { connection: baseMetadata };

    const incomplete = renderReadTableForm({});
    expect(incomplete.result.current.form.activeSectionId).toBe('database');
    incomplete.unmount();

    const configured = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
    });
    expect(configured.result.current.form.activeSectionId).toBe('table');
  });

  it('resets downstream values when database changes', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['id'],
      partition_col: 'id',
      npartitions: 4,
      max_rows_per_partition: 100,
    });

    act(() => {
      result.current.form.handleDatabaseSelect('warehouse');
    });

    expect(result.current.localInputData).toMatchObject({
      database_name: 'warehouse',
      schema_name: undefined,
      table_name: undefined,
      columns: null,
      partition_col: undefined,
      npartitions: undefined,
      max_rows_per_partition: undefined,
    });
    expect(result.current.form.activeSectionId).toBe('schema');
  });

  it('resets downstream values when schema changes', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['id'],
      partition_col: 'id',
    });

    act(() => {
      result.current.form.handleSchemaSelect('archive');
    });

    expect(result.current.localInputData).toMatchObject({
      database_name: 'analytics',
      schema_name: 'archive',
      table_name: undefined,
      columns: null,
      partition_col: undefined,
    });
    expect(result.current.form.activeSectionId).toBe('table');
  });

  it('filters tables by selected database and schema', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
    });

    expect(result.current.form.filteredTables.map(table => table.name)).toEqual(
      ['orders', 'customers']
    );
  });

  it('writes database, schema and table fields on table selection', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: undefined,
      columns: ['legacy'],
      partition_col: 'legacy',
    });

    act(() => {
      result.current.form.handleTableSelect(
        result.current.form.filteredTables[1]
      );
    });

    expect(result.current.localInputData).toMatchObject({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'customers',
      columns: ['id', 'email'],
      partition_col: undefined,
    });
    expect(result.current.form.activeSectionId).toBe('columns');
  });

  it('disables schema flow for clickhouse connections', () => {
    metadataRef.current = {
      connection: {
        connection_id: 'connection-clickhouse',
        dialect: 'clickhouse',
        databases: [
          {
            name: 'warehouse',
            tables: [
              {
                name: 'events',
                columns: [{ name: 'event_id' }],
                type: 'BASE TABLE',
              },
            ],
          },
        ],
      },
    };

    const { result } = renderReadTableForm({});

    expect(result.current.form.isSchemaSupported).toBe(false);
  });

  it('disables database flow for schema-only metadata', () => {
    metadataRef.current = {
      connection: {
        connection_id: 'connection-mysql',
        dialect: 'mysql',
        schemas: [
          {
            name: 'sales',
            tables: [
              {
                name: 'orders',
                columns: [{ name: 'id' }],
                type: 'BASE TABLE',
              },
            ],
          },
        ],
      },
    };

    const { result } = renderReadTableForm({});

    expect(result.current.form.isDatabaseSelectionSupported).toBe(false);
    expect(result.current.form.isSchemaSupported).toBe(true);
  });

  it('keeps saved column selection when lazy table detail loads on reopen', async () => {
    metadataRef.current = {
      connection: {
        type: 'DATABASE',
        connection_id: 'connection-postgres',
        connection_revision: 'revision-1',
        catalog_mode: 'lazy',
        catalog_capabilities: {
          supports_databases: true,
          supports_schemas: true,
          supports_tables: true,
          supports_views: true,
          supports_search: true,
          max_page_size: 200,
        },
        dialect: 'postgresql',
        database_name: null,
        databases: [],
        schemas: [],
        tables: [],
      },
    };
    tableDetailRef.current = {
      item: {
        name: 'orders',
        kind: 'table',
        databaseName: 'analytics',
        schemaName: 'public',
        columns: [
          {
            name: 'id',
            ordinal: 0,
            dtype: 'INT',
            nullable: false,
            indexed: true,
            primaryKey: true,
            indexes: [],
          },
          {
            name: 'amount',
            ordinal: 1,
            dtype: 'FLOAT',
            nullable: true,
            indexed: false,
            primaryKey: false,
            indexes: [],
          },
        ],
      },
      state: 'ready',
      error: null,
      meta: null,
      isRefreshing: false,
      retry: vi.fn(),
    };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['id'],
      partition_col: 'id',
    });

    await waitFor(() => {
      expect(result.current.form.selectedTable?.name).toBe('orders');
    });
    expect(result.current.localInputData.columns).toEqual(['id']);
    expect(result.current.localInputData.partition_col).toBe('id');
  });
});
