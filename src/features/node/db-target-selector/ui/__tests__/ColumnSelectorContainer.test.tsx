import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ColumnListSelect } from '@/entities/data/dataframe';

import type { Column } from '@/shared/gatewayClient';

import { ColumnSelectorContainer } from '../styles';

vi.mock('react-virtuoso', () => ({
  Virtuoso: () => <div data-testid='virtualized-column-list' />,
}));

describe('ColumnSelectorContainer', () => {
  it('provides a measurable viewport for a virtualized column list', () => {
    const columns = Array.from({ length: 262 }, (_, index) => ({
      name: `column_${index}`,
      dtype: 'STRING',
      index: false,
    })) as Column[];

    render(
      <ColumnSelectorContainer data-testid='column-selector-container'>
        <ColumnListSelect
          columns={columns}
          value={[]}
          onChange={() => undefined}
        />
      </ColumnSelectorContainer>
    );

    expect(screen.getByText('0/262')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-column-list')).toBeInTheDocument();
    expect(screen.getByTestId('column-selector-container')).toHaveStyle({
      height: '55vh',
      minHeight: '400px',
      maxHeight: '600px',
    });
  });
});
