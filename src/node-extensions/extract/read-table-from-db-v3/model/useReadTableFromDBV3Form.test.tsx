import { useState } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeExpressionValue } from '@/shared/lib/node-input-values';

import type { ReadTableFromDBV3Values } from '../lib/types';

import { useReadTableFromDBV3Form } from './useReadTableFromDBV3Form';

const { metadataRef, metadataActualityRef, tableDetailRef } = vi.hoisted(
  () => ({
    metadataRef: {
      current: null as any,
    },
    metadataActualityRef: {
      current: true,
    },
    tableDetailRef: {
      current: null as any,
    },
  })
);

vi.mock('@/features/node/get-node-metadata', () => ({
  useConnectedNodeMetadata: () => ({
    connectedNodeMetadataByInput: metadataRef.current,
    actualConnectedNodeMetadataByInput: metadataRef.current,
    connectedNodeMetadataActualityByInput: {
      connection: metadataActualityRef.current,
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
    metadataActualityRef.current = true;
    tableDetailRef.current = null;
  });

  it('starts on the parameters tab with advanced settings collapsed', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
    });

    expect(result.current.form.activeTab).toBe('params');
    expect(result.current.form.isAdvancedOpen).toBe(false);
    expect(result.current.form.isExpressionMode).toBe(false);
    expect(result.current.form.selectedTable?.name).toBe('orders');
  });

  it('writes database, schema and table fields on tree table selection', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['legacy'],
      partition_col: 'legacy',
      npartitions: 4,
    });

    act(() => {
      result.current.form.setActiveTab('columns');
    });
    act(() => {
      result.current.form.handleCatalogTableSelect({
        name: 'events',
        kind: 'table',
        databaseName: 'warehouse',
        schemaName: 'staging',
      });
    });

    expect(result.current.localInputData).toMatchObject({
      database_name: 'warehouse',
      schema_name: 'staging',
      table_name: 'events',
      columns: ['event_id'],
      partition_col: undefined,
      npartitions: undefined,
    });
    expect(result.current.form.activeTab).toBe('params');
  });

  it('switches selectors to expressions and back without losing values', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['id'],
    });

    act(() => {
      result.current.form.enterExpressionMode();
    });

    expect(result.current.form.isExpressionMode).toBe(true);
    expect(result.current.localInputData).toMatchObject({
      database_name: makeExpressionValue('"analytics"', 'single'),
      schema_name: makeExpressionValue('"public"', 'single'),
      table_name: makeExpressionValue('"orders"', 'single'),
      columns: null,
    });

    act(() => {
      result.current.form.handleSelectorExpressionChange(
        'table_name',
        makeExpressionValue('{{ table }}', 'template')
      );
    });
    act(() => {
      result.current.form.exitExpressionMode();
    });

    expect(result.current.form.isExpressionMode).toBe(false);
    expect(result.current.localInputData).toMatchObject({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['id'],
    });

    act(() => {
      result.current.form.enterExpressionMode();
    });

    expect(result.current.localInputData?.table_name).toEqual(
      makeExpressionValue('{{ table }}', 'template')
    );
  });

  it('opens expression mode for saved expression selectors', () => {
    metadataRef.current = { connection: baseMetadata };

    const { result } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: makeExpressionValue('{{ table }}', 'template'),
    });

    expect(result.current.form.isExpressionMode).toBe(true);
    expect(result.current.form.hasMetadataExpression).toBe(true);
  });

  it('opens the parameters tab and advanced block on validation errors', () => {
    metadataRef.current = { connection: baseMetadata };
    let validate: (() => boolean) | undefined;
    const setValidationCallback = (callback: () => () => boolean) => {
      validate = callback();
    };

    const { result } = renderHook(() => {
      const [localInputData, setLocalInputData] =
        useState<ReadTableFromDBV3Values>({
          database_name: 'analytics',
          schema_name: 'public',
          table_name: 'orders',
          npartitions: 4,
        });
      const form = useReadTableFromDBV3Form({
        nodeID: 'node-1',
        localInputData,
        setLocalInputData,
        setValidationCallback: setValidationCallback as never,
      });
      return { form };
    });

    act(() => {
      result.current.form.setActiveTab('columns');
    });
    let isValid = true;
    act(() => {
      isValid = validate?.() ?? true;
    });

    expect(isValid).toBe(false);
    expect(result.current.form.errors.partition_col).toBeTruthy();
    expect(result.current.form.activeTab).toBe('params');
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

  it('keeps saved partition settings while lazy table detail loads on reopen', async () => {
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
      item: null,
      state: 'loading',
      error: null,
      meta: null,
      isRefreshing: false,
      retry: vi.fn(),
    };

    const { result, rerender } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['amount'],
      partition_col: 'id',
      partition_grouping: { mode: 'range', size: 100 },
      npartitions: 4,
      max_rows_per_partition: 1000,
    });

    expect(result.current.form.selectedTable).toBeNull();
    expect(result.current.localInputData).toMatchObject({
      columns: ['amount'],
      partition_col: 'id',
      partition_grouping: { mode: 'range', size: 100 },
      npartitions: 4,
      max_rows_per_partition: 1000,
    });

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
            comment: 'Сумма заказа',
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
    rerender();

    await waitFor(() => {
      expect(result.current.form.selectedTable?.name).toBe('orders');
    });
    expect(result.current.localInputData).toMatchObject({
      columns: ['amount'],
      partition_col: 'id',
      partition_grouping: { mode: 'range', size: 100 },
      npartitions: 4,
      max_rows_per_partition: 1000,
    });
    expect(
      result.current.form.availableColumns.map(column => column.name)
    ).toEqual(['id', 'amount']);
    expect(
      result.current.form.availableColumns.map(column => column.comment)
    ).toEqual([null, 'Сумма заказа']);
  });

  it('keeps saved partition settings while connection metadata is stale', () => {
    metadataRef.current = { connection: baseMetadata };
    metadataActualityRef.current = false;

    const { result, rerender } = renderReadTableForm({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      columns: ['amount'],
      partition_col: 'id',
      partition_grouping: { mode: 'hash', buckets: 8 },
      npartitions: 8,
      max_rows_per_partition: 500,
    });

    expect(result.current.form.isConnectionMetadataLoading).toBe(true);
    expect(result.current.localInputData).toMatchObject({
      partition_col: 'id',
      partition_grouping: { mode: 'hash', buckets: 8 },
      npartitions: 8,
      max_rows_per_partition: 500,
    });

    metadataActualityRef.current = true;
    rerender();

    expect(result.current.form.isConnectionMetadataLoading).toBe(false);
    expect(result.current.form.selectedTable?.name).toBe('orders');
    expect(result.current.localInputData).toMatchObject({
      partition_col: 'id',
      partition_grouping: { mode: 'hash', buckets: 8 },
      npartitions: 8,
      max_rows_per_partition: 500,
    });
  });
});
