import { describe, expect, it } from 'vitest';

import {
  buildWriteTargetAfterDatabaseChange,
  buildWriteTargetAfterTableModeChange,
  findWriteTargetTable,
  getTypedSpecValidationError,
  isPrepareStepValid,
  type WriteDataFrameToDBValues,
} from './helpers';

const metadata = {
  connection_id: 'connection-postgres',
  connection_revision: 'revision-1',
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
              columns: [],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    },
    {
      name: 'archive',
      schemas: [
        {
          name: 'public',
          tables: [
            {
              name: 'orders',
              columns: [],
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
              columns: [],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    },
  ],
} as any;

describe('writeDataFrameToDBV3 helpers', () => {
  it('preserves selected database and schema when table mode changes', () => {
    const current: WriteDataFrameToDBValues = {
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders_draft',
      write_mode: 'truncate',
      create_table_sql: 'CREATE TABLE orders_draft (id int);',
    };

    expect(buildWriteTargetAfterTableModeChange(current)).toEqual({
      ...current,
      table_name: null,
    });
  });

  it('preserves a new table name when database changes in create mode', () => {
    const current: WriteDataFrameToDBValues = {
      database_name: null,
      schema_name: 'public',
      table_name: 'orders_draft',
      write_mode: 'truncate',
      create_table_sql: 'CREATE TABLE orders_draft (id int);',
    };

    expect(
      buildWriteTargetAfterDatabaseChange(current, 'analytics', true)
    ).toMatchObject({
      database_name: 'analytics',
      schema_name: null,
      table_name: 'orders_draft',
    });
  });

  it('clears table name when database changes outside create mode', () => {
    const current: WriteDataFrameToDBValues = {
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
    };

    expect(
      buildWriteTargetAfterDatabaseChange(current, 'warehouse', false)
    ).toMatchObject({
      database_name: 'warehouse',
      schema_name: null,
      table_name: null,
    });
  });

  it('does not match a same-name table from another selected database', () => {
    expect(
      findWriteTargetTable(metadata, {
        database_name: 'warehouse',
        schema_name: 'public',
        table_name: 'orders',
      })
    ).toBeNull();
  });

  it('keeps legacy table-only fallback when database is not configured', () => {
    expect(
      findWriteTargetTable(metadata, {
        table_name: 'orders',
      })?.database_name
    ).toBe('analytics');
  });

  it('requires database selection before prepare step can continue', () => {
    expect(
      isPrepareStepValid(
        {
          table_name: 'orders',
          schema_name: 'public',
          write_mode: 'truncate',
        },
        {
          inputConnectionMetadata: metadata,
        }
      )
    ).toBe(false);
  });

  it('does not require database selection for schema-only metadata', () => {
    expect(
      isPrepareStepValid(
        {
          table_name: 'orders',
          schema_name: 'sales',
          write_mode: 'truncate',
        },
        {
          inputConnectionMetadata: {
            connection_id: 'connection-mysql',
            dialect: 'mysql',
            schemas: [{ name: 'sales', tables: [] }],
          } as any,
        }
      )
    ).toBe(true);
  });

  it('requires clickhouse order by or primary key in typed mode', () => {
    expect(
      getTypedSpecValidationError({
        connectionMetadata: {
          connection_id: 'connection-clickhouse',
          dialect: 'clickhouse',
          tables: [],
        } as any,
        draft: {
          primaryKeyColumns: [],
          indexes: [],
          foreignKeys: [],
          clickhouse: {
            engineName: 'MergeTree',
            orderBy: [],
            partitionBy: [],
            primaryKey: [],
            settings: [],
          },
        },
      })
    ).toBe(
      'Для ClickHouse в Typed Table spec нужно заполнить Order by или Primary key.'
    );
  });

  it('accepts clickhouse typed spec when order by is configured', () => {
    expect(
      getTypedSpecValidationError({
        connectionMetadata: {
          connection_id: 'connection-clickhouse',
          dialect: 'clickhouse',
          tables: [],
        } as any,
        draft: {
          primaryKeyColumns: [],
          indexes: [],
          foreignKeys: [],
          clickhouse: {
            engineName: 'MergeTree',
            orderBy: ['event_time'],
            partitionBy: [],
            primaryKey: [],
            settings: [],
          },
        },
      })
    ).toBeNull();
  });

  it('accepts clickhouse typed spec when primary key is configured', () => {
    expect(
      getTypedSpecValidationError({
        connectionMetadata: {
          connection_id: 'connection-clickhouse',
          dialect: 'clickhouse',
          tables: [],
        } as any,
        draft: {
          primaryKeyColumns: [],
          indexes: [],
          foreignKeys: [],
          clickhouse: {
            engineName: 'MergeTree',
            orderBy: [],
            partitionBy: [],
            primaryKey: ['event_id'],
            settings: [],
          },
        },
      })
    ).toBeNull();
  });
});
