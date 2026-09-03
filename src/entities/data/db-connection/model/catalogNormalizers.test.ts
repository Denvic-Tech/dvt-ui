import { describe, expect, it } from 'vitest';

import {
  classifyDbCatalogError,
  normalizeDbCatalogCapabilities,
  normalizeDbCatalogKinds,
  normalizeDbCatalogParentNames,
  normalizeDbCatalogSearch,
  normalizeTableDetail,
  normalizeTablePage,
  normalizeTablePreview,
  requireDbConnectionId,
  resolveDbCatalogMode,
} from './catalogNormalizers';

describe('DB catalog normalizers', () => {
  it('treats missing catalog_mode as embedded and accepts lazy explicitly', () => {
    expect(resolveDbCatalogMode({ dialect: 'postgresql' })).toBe('embedded');
    expect(
      resolveDbCatalogMode({ dialect: 'postgresql', catalog_mode: 'lazy' })
    ).toBe('lazy');
  });

  it('clamps page size and canonicalizes search and kinds', () => {
    expect(
      normalizeDbCatalogCapabilities({
        dialect: 'postgresql',
        catalog_capabilities: {
          supports_databases: true,
          supports_schemas: true,
          supports_tables: true,
          supports_views: true,
          supports_search: true,
          max_page_size: 1000,
        },
      }).maxPageSize
    ).toBe(200);
    expect(normalizeDbCatalogSearch(`  ${'a'.repeat(200)}  `)).toHaveLength(
      128
    );
    expect(normalizeDbCatalogKinds(['view', 'table', 'view'])).toEqual([
      'table',
      'view',
    ]);
  });

  it('drops parent names for unsupported catalog levels', () => {
    expect(
      normalizeDbCatalogParentNames(
        { supportsDatabases: false, supportsSchemas: true },
        'clickhouse_database',
        ' oracle_schema '
      )
    ).toEqual({
      databaseName: null,
      schemaName: 'oracle_schema',
    });

    expect(
      normalizeDbCatalogParentNames(
        { supportsDatabases: true, supportsSchemas: false },
        ' postgres_database ',
        'stale_schema'
      )
    ).toEqual({
      databaseName: 'postgres_database',
      schemaName: null,
    });
  });

  it('keeps table summaries column-free and normalizes detail columns', () => {
    const page = normalizeTablePage({
      items: [
        {
          name: 'orders',
          kind: 'table',
          database_name: 'analytics',
          schema_name: 'public',
        },
      ],
      next_cursor: 'next',
      meta: {
        catalog_version: 'v1',
        loaded_at: '2026-07-19T00:00:00Z',
        expires_at: '2026-07-19T00:01:00Z',
        cache_status: 'hit',
      },
    });
    expect(page.nextCursor).toBe('next');
    expect(page.items[0]).not.toHaveProperty('columns');

    const detail = normalizeTableDetail({
      item: {
        name: 'orders',
        kind: 'table',
        database_name: 'analytics',
        schema_name: 'public',
        columns: [
          {
            name: 'id',
            ordinal: 2,
            dtype: 'INT',
            nullable: false,
            indexed: true,
            primary_key: true,
            indexes: ['orders_pk'],
          },
          {
            name: 'created_at',
            ordinal: 1,
            dtype: 'DATETIME',
            nullable: null,
            indexed: false,
            primary_key: false,
            indexes: [],
          },
        ],
      },
      meta: page.meta
        ? {
            catalog_version: page.meta.catalogVersion,
            loaded_at: page.meta.loadedAt,
            expires_at: page.meta.expiresAt,
            cache_status: page.meta.cacheStatus,
          }
        : ({} as never),
    });
    expect(detail.item.columns.map(column => column.name)).toEqual([
      'created_at',
      'id',
    ]);
  });

  it('requires a non-empty connection_id and classifies gateway states', () => {
    expect(
      requireDbConnectionId({ dialect: 'postgresql', connection_id: ' db-1 ' })
    ).toBe('db-1');
    expect(() => requireDbConnectionId({ dialect: 'postgresql' })).toThrow(
      'connection_id'
    );
    expect(
      classifyDbCatalogError({ code: '404', message: '', status: 404 })
    ).toBe('notFound');
    expect(
      classifyDbCatalogError({ code: '502', message: '', status: 502 })
    ).toBe('badGateway');
    expect(
      classifyDbCatalogError({ code: '504', message: '', status: 504 })
    ).toBe('gatewayTimeout');
  });

  it('normalizes table preview rows and truncation state', () => {
    expect(
      normalizeTablePreview({
        columns: [
          { name: 'id', dtype: 'INT' },
          { name: 'active', dtype: 'BOOLEAN' },
        ],
        rows: [
          [1, true],
          [2, null],
        ],
        truncated: true,
      })
    ).toEqual({
      columns: [
        { name: 'id', dtype: 'INT' },
        { name: 'active', dtype: 'BOOLEAN' },
      ],
      rows: [
        [1, true],
        [2, null],
      ],
      truncated: true,
    });
  });
});
