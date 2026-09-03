import { describe, expect, it } from 'vitest';

import { pickFirstTableFullName } from './metadata';

describe('read-query metadata helpers', () => {
  it('uses schema-qualified reference for schema-based dialects', () => {
    expect(
      pickFirstTableFullName({
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
        ],
      } as any)
    ).toBe('public.orders');
  });

  it('uses database-qualified reference for database-only dialects', () => {
    expect(
      pickFirstTableFullName({
        dialect: 'clickhouse',
        databases: [
          {
            name: 'warehouse',
            tables: [
              {
                name: 'events',
                columns: [],
                type: 'BASE TABLE',
              },
            ],
          },
        ],
      } as any)
    ).toBe('warehouse.events');
  });

  it('uses bare table name for sqlite metadata', () => {
    expect(
      pickFirstTableFullName({
        dialect: 'sqlite',
        tables: [
          {
            name: 'local_events',
            columns: [],
            type: 'BASE TABLE',
          },
        ],
      } as any)
    ).toBe('local_events');
  });
});
