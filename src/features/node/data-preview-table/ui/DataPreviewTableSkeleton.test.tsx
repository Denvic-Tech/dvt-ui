import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataPreviewTableSkeleton } from './DataPreviewTableSkeleton';

describe('DataPreviewTableSkeleton', () => {
  it('renders the preview table with known column names', () => {
    const { container } = render(
      <DataPreviewTableSkeleton
        columns={[
          { name: 'id', dtype: 'INT' },
          { name: 'comment', dtype: 'STRING' },
        ]}
      />
    );

    expect(
      screen.getByRole('status', { name: 'Загрузка данных' })
    ).toHaveAttribute('aria-busy', 'true');
    const headCells = container.querySelectorAll('thead th');
    expect([...headCells].map(cell => cell.textContent)).toEqual([
      '',
      'id',
      'comment',
    ]);
    expect(headCells[1]).toHaveAttribute('title', 'INT');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(18);
    expect(
      container.querySelectorAll('tbody tr:first-of-type td')
    ).toHaveLength(3);
  });

  it('renders a skeleton head when columns are unknown', () => {
    const { container } = render(<DataPreviewTableSkeleton />);

    const headCells = container.querySelectorAll('thead th');
    expect(headCells).toHaveLength(10);
    expect(headCells[1]?.querySelector('span')).toHaveStyle({ width: '52px' });
    expect(
      container.querySelectorAll('tbody tr:first-of-type td span')
    ).toHaveLength(10);
  });
});
