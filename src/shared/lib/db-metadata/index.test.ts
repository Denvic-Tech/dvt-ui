import { describe, expect, it } from 'vitest';

import {
  findDbMetadataTable,
  flattenDbMetadataTables,
  getDbMetadataDatabaseOptions,
  getDbMetadataFilteredTables,
  getDbMetadataSchemaOptions,
  getDbMetadataSqlReference,
  upsertDbMetadataTable,
} from './index';

describe('db-metadata helpers', () => {
  it('flattens postgres databases -> schemas -> tables', () => {
    const metadata = {
      dialect: 'postgresql',
      databases: [
        {
          name: 'analytics',
          schemas: [
            {
              name: 'public',
              tables: [{ name: 'orders', columns: [], type: 'BASE TABLE' }],
            },
          ],
        },
      ],
    } as any;

    expect(flattenDbMetadataTables(metadata)).toMatchObject([
      {
        name: 'orders',
        database_name: 'analytics',
        schema_name: 'public',
      },
    ]);
  });

  it('flattens mysql root schemas -> tables', () => {
    const metadata = {
      dialect: 'mysql',
      schemas: [
        {
          name: 'sales',
          tables: [{ name: 'orders', columns: [], type: 'BASE TABLE' }],
        },
      ],
    } as any;

    expect(flattenDbMetadataTables(metadata)).toMatchObject([
      {
        name: 'orders',
        schema_name: 'sales',
      },
    ]);
  });

  it('flattens clickhouse root databases -> tables', () => {
    const metadata = {
      dialect: 'clickhouse',
      databases: [
        {
          name: 'warehouse',
          tables: [{ name: 'events', columns: [], type: 'BASE TABLE' }],
        },
      ],
    } as any;

    expect(flattenDbMetadataTables(metadata)).toMatchObject([
      {
        name: 'events',
        database_name: 'warehouse',
      },
    ]);
  });

  it('flattens sqlite root tables', () => {
    const metadata = {
      dialect: 'sqlite',
      tables: [{ name: 'events', columns: [], type: 'BASE TABLE' }],
    } as any;

    expect(flattenDbMetadataTables(metadata)).toMatchObject([
      {
        name: 'events',
        database_name: null,
        schema_name: null,
      },
    ]);
  });

  it('flattens oracle root schemas -> tables', () => {
    const metadata = {
      dialect: 'oracle',
      schemas: [
        {
          name: 'HR',
          tables: [{ name: 'EMPLOYEES', columns: [], type: 'BASE TABLE' }],
        },
      ],
    } as any;

    expect(flattenDbMetadataTables(metadata)).toMatchObject([
      {
        name: 'EMPLOYEES',
        schema_name: 'HR',
      },
    ]);
  });

  it('keeps legacy flat tables and derived options working', () => {
    const metadata = {
      dialect: 'postgresql',
      tables: [
        {
          name: 'orders',
          database_name: 'analytics',
          schema_name: 'public',
          columns: [],
          type: 'BASE TABLE',
        },
        {
          name: 'events',
          database_name: 'warehouse',
          schema_name: 'staging',
          columns: [],
          type: 'BASE TABLE',
        },
      ],
    } as any;

    expect(getDbMetadataDatabaseOptions(metadata)).toEqual([
      { label: 'analytics', tableCount: 1, value: 'analytics' },
      { label: 'warehouse', tableCount: 1, value: 'warehouse' },
    ]);
    expect(getDbMetadataSchemaOptions(metadata, 'analytics')).toEqual([
      { label: 'public', tableCount: 1, value: 'public' },
    ]);
    expect(
      getDbMetadataFilteredTables(metadata, {
        databaseName: 'analytics',
        schemaName: 'public',
      }).map(table => table.name)
    ).toEqual(['orders']);
    expect(
      findDbMetadataTable(metadata, {
        databaseName: 'analytics',
        schemaName: 'public',
        tableName: 'orders',
      })?.name
    ).toBe('orders');
  });

  it('replaces a table in-place inside postgres databases -> schemas', () => {
    const metadata = {
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
                  columns: [{ name: 'id' }, { name: 'total' }],
                  type: 'BASE TABLE',
                },
              ],
            },
          ],
        },
      ],
    } as any;

    const updatedTable = {
      name: 'orders',
      database_name: 'analytics',
      schema_name: 'public',
      columns: [{ name: 'id' }, { name: 'total' }, { name: 'created_at' }],
      type: 'BASE TABLE',
    } as any;

    const next = upsertDbMetadataTable(metadata, updatedTable, {
      databaseName: 'analytics',
      schemaName: 'public',
      tableName: 'orders',
    });

    expect(next).not.toBe(metadata);
    const flattened = flattenDbMetadataTables(next);
    expect(flattened).toHaveLength(1);
    expect(flattened[0].columns).toHaveLength(3);
  });

  it('replaces a table matched via selector even if fresh metadata has null db/schema', () => {
    const metadata = {
      dialect: 'clickhouse',
      databases: [
        {
          name: 'warehouse',
          tables: [
            {
              name: 'events',
              database_name: 'warehouse',
              columns: [{ name: 'a' }],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    } as any;

    // Свежие метаданные с бэкенда без database_name/schema_name.
    const updatedTable = {
      name: 'events',
      columns: [{ name: 'a' }, { name: 'b' }],
      type: 'BASE TABLE',
    } as any;

    const next = upsertDbMetadataTable(metadata, updatedTable, {
      databaseName: 'warehouse',
      tableName: 'events',
    });

    const flattened = flattenDbMetadataTables(next);
    expect(flattened).toHaveLength(1);
    expect(flattened[0].columns).toHaveLength(2);
  });

  it('keeps the fresh table after drop_column (fewer columns) via replace', () => {
    const metadata = {
      dialect: 'clickhouse',
      databases: [
        {
          name: 'warehouse',
          tables: [
            {
              name: 'events',
              database_name: 'warehouse',
              columns: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    } as any;

    const shrunkTable = {
      name: 'events',
      database_name: 'warehouse',
      columns: [{ name: 'a' }, { name: 'b' }],
      type: 'BASE TABLE',
    } as any;

    const next = upsertDbMetadataTable(metadata, shrunkTable, {
      databaseName: 'warehouse',
      tableName: 'events',
    });
    const flattened = flattenDbMetadataTables(next);

    expect(flattened).toHaveLength(1);
    // Замена на месте: старая версия с 3 колонками не должна «победить».
    expect(flattened[0].columns).toHaveLength(2);
  });

  it('appends the table to top-level tables when no match is found', () => {
    const metadata = {
      dialect: 'sqlite',
      tables: [{ name: 'events', columns: [], type: 'BASE TABLE' }],
    } as any;

    const newTable = {
      name: 'new_events',
      columns: [{ name: 'id' }],
      type: 'BASE TABLE',
    } as any;

    const next = upsertDbMetadataTable(metadata, newTable, {
      tableName: 'new_events',
    });

    expect(next.tables).toHaveLength(2);
    expect(flattenDbMetadataTables(next).map(table => table.name)).toContain(
      'new_events'
    );
  });

  it('builds minimal sql reference for each hierarchy level', () => {
    expect(
      getDbMetadataSqlReference({
        name: 'orders',
        database_name: 'analytics',
        schema_name: 'public',
        columns: [],
        type: 'BASE TABLE',
      } as any)
    ).toBe('public.orders');
    expect(
      getDbMetadataSqlReference({
        name: 'events',
        database_name: 'warehouse',
        columns: [],
        type: 'BASE TABLE',
      } as any)
    ).toBe('warehouse.events');
    expect(
      getDbMetadataSqlReference({
        name: 'sqlite_table',
        columns: [],
        type: 'BASE TABLE',
      } as any)
    ).toBe('sqlite_table');
  });
});
