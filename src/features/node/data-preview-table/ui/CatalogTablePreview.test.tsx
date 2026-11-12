import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CatalogTablePreview } from './CatalogTablePreview';

describe('CatalogTablePreview', () => {
  it('renders values, column types in titles and NULL as a dash', () => {
    render(
      <CatalogTablePreview
        preview={{
          columns: [
            { name: 'id', dtype: 'INT' },
            { name: 'active', dtype: 'BOOLEAN' },
            { name: 'comment', dtype: 'STRING' },
          ],
          rows: [[42, true, null]],
          truncated: true,
          rowCount: null,
          rowCountExact: false,
        }}
      />
    );

    const table = screen.getByRole('table', {
      name: 'Предпросмотр данных таблицы',
    });
    expect(
      within(table).getByRole('columnheader', { name: 'active' })
    ).toHaveAttribute('title', 'BOOLEAN');
    expect(within(table).getByText('42')).toBeInTheDocument();
    expect(within(table).getByText('true')).toBeInTheDocument();
    expect(within(table).getByTitle('NULL')).toHaveTextContent('—');
    expect(within(table).getByText('1')).toBeInTheDocument();
  });
});
