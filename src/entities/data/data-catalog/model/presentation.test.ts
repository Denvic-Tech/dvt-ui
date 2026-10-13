import { describe, expect, it } from 'vitest';

import {
  applyDatasetDetailsToSummary,
  getDatasetDialect,
  getDatasetHostLabel,
  getDatasetLocatorParts,
  getDatasetName,
  getDatasetNamespace,
  getDatasetQualifiedName,
  normalizeDatasetDialect,
} from './presentation';
import type { DatasetDetails, DatasetLocator, DatasetSummary } from './types';

const locator: DatasetLocator = {
  kind: 'db_table',
  location: 'db.local:5432/analytics.orders',
  parts: {
    dialect: 'PostgreSQL',
    host: 'db.local',
    port: 5432,
    database: 'analytics',
    schema: null,
    table: 'orders',
  },
};

describe('data-catalog presentation', () => {
  it('normalizes dialect aliases to connection types', () => {
    expect(normalizeDatasetDialect('PostgreSQL')).toBe('postgres');
    expect(normalizeDatasetDialect(' clickhouse ')).toBe('clickhouse');
    expect(normalizeDatasetDialect(null)).toBe('');
  });

  it('reads db_table address parts from locator.parts', () => {
    expect(getDatasetLocatorParts(locator)).toEqual({
      dialect: 'PostgreSQL',
      host: 'db.local',
      port: 5432,
      database: 'analytics',
      schema: null,
      table: 'orders',
    });
    expect(getDatasetDialect(locator)).toBe('PostgreSQL');
    expect(getDatasetNamespace(locator)).toBe('analytics');
    expect(
      getDatasetLocatorParts({
        ...locator,
        parts: { ...locator.parts, port: '8443', schema: '  ' },
      })
    ).toMatchObject({ port: 8443, schema: null });
  });

  it('falls back to location when parts are missing', () => {
    const fileLocator: DatasetLocator = {
      kind: 'file',
      location: 's3://raw/exports/orders.csv',
    };

    expect(getDatasetDialect(fileLocator)).toBeNull();
    expect(getDatasetName(fileLocator)).toBe('s3://raw/exports/orders.csv');
    expect(getDatasetNamespace(fileLocator)).toBe('');
    expect(getDatasetHostLabel(fileLocator)).toBeNull();
  });

  it('builds qualified name and host label without empty segments', () => {
    expect(getDatasetQualifiedName(locator)).toBe('analytics.orders');
    expect(getDatasetHostLabel(locator)).toBe('db.local:5432');
    expect(
      getDatasetHostLabel({
        ...locator,
        parts: { ...locator.parts, port: null },
      })
    ).toBe('db.local');
  });

  it('applies details to summary but keeps summary-only counters', () => {
    const summary: DatasetSummary = {
      id: 'ds-1',
      organization_id: 'org-1',
      physical_key: 'key',
      locator,
      freshness: 'unverified',
      field_count: 3,
      reader_count: 2,
      writer_count: 1,
      updated_at: '2026-10-01T10:00:00Z',
    };
    const details: DatasetDetails = {
      id: 'ds-1',
      organization_id: 'org-1',
      physical_key: 'key',
      locator,
      freshness: 'fresh',
      effective_description: 'Заказы',
      fields: [],
      connection_ids: ['c-1'],
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-10-08T10:00:00Z',
    };

    const result = applyDatasetDetailsToSummary(summary, details);

    expect(result).toMatchObject({
      freshness: 'fresh',
      effective_description: 'Заказы',
      field_count: 3,
      reader_count: 2,
      writer_count: 1,
      updated_at: '2026-10-08T10:00:00Z',
    });
    expect(result).not.toHaveProperty('fields');
    expect(result).not.toHaveProperty('connection_ids');
  });
});
