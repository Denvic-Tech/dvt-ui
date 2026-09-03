import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReadTableMetadataPreview } from './ReadTableMetadataPreview';

describe('ReadTableMetadataPreview', () => {
  it('renders table identity and column metadata only', () => {
    render(
      <ReadTableMetadataPreview
        databaseName='analytics'
        schemaName='public'
        table={
          {
            name: 'orders',
            type: 'BASE_TABLE',
            database_name: 'analytics',
            schema_name: 'public',
            columns: [
              {
                name: 'id',
                dtype: 'INT64',
                nullable: false,
                index: true,
                primary_key: true,
                indexes: ['orders_pk'],
              },
              {
                name: 'amount',
                dtype: 'FLOAT64',
                nullable: true,
                index: false,
                primary_key: false,
                indexes: [],
              },
            ],
          } as any
        }
      />
    );

    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.getByText('analytics / public')).toBeInTheDocument();
    expect(screen.getByText('2 кол.')).toBeInTheDocument();
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('INT64')).toBeInTheDocument();
    expect(screen.getByText('amount')).toBeInTheDocument();
    expect(screen.queryByText(/строк/i)).not.toBeInTheDocument();
  });
});
