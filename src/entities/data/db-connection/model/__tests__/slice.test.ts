import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import {
  checkDBConnection,
  checkDBConnectionSilent,
  clearSelectedDBConnection,
  createDBConnection,
  dbConnectionsReducer,
  deleteDBConnection,
  fetchDBConnections,
  fetchDBConnectionsCatalog,
  selectDBConnection,
  updateDBConnection,
} from '../slice';
import type { DBConnectionCatalog, DBConnectionRecord } from '../types';

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
}));

const makeConnection = (id: string, name = 'Conn'): DBConnectionRecord => ({
  id,
  name,
  kind: 'sql',
  type: 'postgres',
  driver: 'psycopg',
  driver_options: null,
  properties: {
    host: 'localhost',
    port: 5432,
    database: 'analytics',
    username: 'reader',
  },
  labels: null,
  metadata: null,
  created_at: null,
  updated_at: null,
  deleted_at: null,
  user_id: null,
  organization_id: null,
  issues: [],
  raw_properties: null,
  raw_driver_options: null,
  raw_secrets: null,
});

const makeCatalog = (): DBConnectionCatalog => ({
  kinds: [{ name: 'sql', description: '', capabilities: ['client'] }],
  kindsByName: {
    sql: { name: 'sql', description: '', capabilities: ['client'] },
  },
  types: [
    {
      name: 'postgres',
      kind: 'sql',
      default_driver: 'psycopg',
      drivers: [],
      supported_drivers: ['psycopg'],
      capabilities: ['client'],
      tags: [],
      properties_schema: {},
      secrets_schema: null,
      public_schema: {},
    },
  ],
  typesByName: {
    postgres: {
      name: 'postgres',
      kind: 'sql',
      default_driver: 'psycopg',
      drivers: [],
      supported_drivers: ['psycopg'],
      capabilities: ['client'],
      tags: [],
      properties_schema: {},
      secrets_schema: null,
      public_schema: {},
    },
  },
});

describe('db-connection-v1 slice', () => {
  it('stores catalog payload', () => {
    const pending = dbConnectionsReducer(
      undefined,
      fetchDBConnectionsCatalog.pending('req', undefined)
    );

    expect(pending.loading.isFetchingCatalog).toBe(true);

    const fulfilled = dbConnectionsReducer(
      pending,
      fetchDBConnectionsCatalog.fulfilled(makeCatalog(), 'req', undefined)
    );

    expect(fulfilled.loading.isFetchingCatalog).toBe(false);
    expect(fulfilled.catalog.isLoaded).toBe(true);
    expect(fulfilled.catalog.data?.typesByName['postgres']?.name).toBe(
      'postgres'
    );
  });

  it('handles fetch/create/update/delete lifecycle', () => {
    const fetched = dbConnectionsReducer(
      undefined,
      fetchDBConnections.fulfilled([makeConnection('c1')], 'req', undefined)
    );

    expect(fetched.ids).toEqual(['c1']);

    const created = dbConnectionsReducer(
      fetched,
      createDBConnection.fulfilled(makeConnection('c2', 'Created'), 'req2', {
        name: 'Created',
        kind: 'sql',
        type: 'postgres',
        properties: {
          host: 'localhost',
        },
      })
    );

    expect(created.entities['c2']?.name).toBe('Created');

    const updated = dbConnectionsReducer(
      created,
      updateDBConnection.fulfilled(makeConnection('c2', 'Updated'), 'req3', {
        id: 'c2',
        data: { name: 'Updated' },
      })
    );

    expect(updated.entities['c2']?.name).toBe('Updated');

    const deleted = dbConnectionsReducer(
      updated,
      deleteDBConnection.fulfilled('c2', 'req4', 'c2')
    );

    expect(deleted.entities['c2']).toBeUndefined();
  });

  it('stores check statuses and preserves status on aborted silent rejection', () => {
    const baseState = dbConnectionsReducer(
      undefined,
      fetchDBConnections.fulfilled([makeConnection('c1')], 'req', undefined)
    );

    const checked = dbConnectionsReducer(
      baseState,
      checkDBConnection.fulfilled(
        {
          id: 'c1',
          status: {
            id: 'c1',
            name: 'Conn',
            connected: true,
            message: 'ok',
            exception: null,
          },
        },
        'req-check',
        { id: 'c1' }
      )
    );

    expect(checked.statusesById['c1']?.connected).toBe(true);

    const abortedError = Object.assign(new Error('canceled'), {
      name: 'CanceledError',
    });

    const aborted = dbConnectionsReducer(
      checked,
      checkDBConnectionSilent.rejected(abortedError, 'req-abort', {
        id: 'c1',
      })
    );

    expect(aborted.statusesById['c1']?.connected).toBe(true);
  });

  it('stores selected connection id and clears it', () => {
    const withData = dbConnectionsReducer(
      undefined,
      fetchDBConnections.fulfilled([makeConnection('c1')], 'req', undefined)
    );

    const selected = dbConnectionsReducer(
      withData,
      selectDBConnection(makeConnection('c1'))
    );

    expect(selected.selectedConnectionId).toBe('c1');

    const cleared = dbConnectionsReducer(selected, clearSelectedDBConnection());

    expect(cleared.selectedConnectionId).toBeNull();
  });
});
