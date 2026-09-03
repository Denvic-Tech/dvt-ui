import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ColumnDropdownSelect,
  ColumnListSelect,
} from '@/entities/data/dataframe';

import type { Column } from '@/shared/gatewayClient';

const columns: Column[] = [
  { name: 'customer_id', dtype: 'INT', index: true } as Column,
  { name: 'country', dtype: 'STRING', index: false } as Column,
  { name: 'revenue', dtype: 'FLOAT', index: false } as Column,
];

const openDropdown = () => {
  fireEvent.mouseDown(screen.getByRole('combobox'));
};

describe('ColumnDropdownSelect', () => {
  it('selects a single column', () => {
    const handleChange = vi.fn();

    render(
      <ColumnDropdownSelect
        columns={columns}
        value=''
        onChange={handleChange}
      />
    );

    openDropdown();
    fireEvent.click(screen.getByRole('option', { name: /country/i }));

    expect(handleChange).toHaveBeenCalledWith('country');
  });

  it('clears a single column to an empty string', () => {
    const handleChange = vi.fn();

    render(
      <ColumnDropdownSelect
        columns={columns}
        value='country'
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Clear'));

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('adds and removes multiple column values', () => {
    const Wrapper = () => {
      const [value, setValue] = useState<string[]>(['country']);

      return (
        <>
          <ColumnDropdownSelect
            multiple
            columns={columns}
            value={value}
            onChange={setValue}
          />
          <div data-testid='value'>{value.join(',')}</div>
        </>
      );
    };

    render(<Wrapper />);

    openDropdown();
    fireEvent.click(screen.getByRole('option', { name: /revenue/i }));
    expect(screen.getByTestId('value')).toHaveTextContent('country,revenue');

    fireEvent.click(screen.getByRole('option', { name: /country/i }));
    expect(screen.getByTestId('value')).toHaveTextContent('revenue');
  });

  it('filters and selects from a large column list', async () => {
    const handleChange = vi.fn();
    const largeColumns: Column[] = Array.from({ length: 160 }, (_, index) => ({
      name: `column_${index}`,
      dtype: index % 2 === 0 ? 'STRING' : 'INT',
      index: false,
    })) as Column[];

    render(
      <ColumnDropdownSelect
        columns={largeColumns}
        value=''
        onChange={handleChange}
      />
    );

    openDropdown();
    fireEvent.change(screen.getByPlaceholderText('Поиск колонки...'), {
      target: { value: 'column_119' },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /column_119/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('option', { name: /column_119/i }));
    expect(handleChange).toHaveBeenCalledWith('column_119');
  });

  it('renders custom no options text', () => {
    render(
      <ColumnDropdownSelect
        columns={[]}
        value=''
        onChange={() => undefined}
        noOptionText='No dataframe columns'
      />
    );

    openDropdown();

    expect(screen.getByText('No dataframe columns')).toBeInTheDocument();
  });
});

describe('ColumnListSelect', () => {
  it('filters visible columns by query', () => {
    render(
      <ColumnListSelect
        columns={columns}
        value={[]}
        onChange={() => undefined}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Поиск колонок...'), {
      target: { value: 'rev' },
    });

    expect(screen.getByText('revenue')).toBeInTheDocument();
    expect(screen.queryByText('country')).not.toBeInTheDocument();
  });

  it('toggles column selection', () => {
    const handleChange = vi.fn();

    render(
      <ColumnListSelect
        columns={columns}
        value={['country']}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /revenue FLOAT/i }));
    expect(handleChange).toHaveBeenCalledWith(['country', 'revenue']);

    fireEvent.click(screen.getByRole('button', { name: /country STRING/i }));
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('selects all columns and clears selection', () => {
    const Wrapper = () => {
      const [value, setValue] = useState<string[]>(['country']);

      return (
        <>
          <ColumnListSelect
            columns={columns}
            value={value}
            onChange={setValue}
          />
          <div data-testid='value'>{value.join(',')}</div>
        </>
      );
    };

    render(<Wrapper />);

    const selectAllButton = screen.getByRole('button', { name: 'All' });

    expect(selectAllButton).toHaveStyle({
      height: '36px',
      flexGrow: '0',
    });

    fireEvent.click(selectAllButton);
    expect(screen.getByTestId('value')).toHaveTextContent(
      'customer_id,country,revenue'
    );

    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(screen.getByTestId('value')).toBeEmptyDOMElement();
  });

  it('renders an empty state', () => {
    render(
      <ColumnListSelect
        columns={columns}
        value={[]}
        onChange={() => undefined}
        noOptionText='Nothing matched'
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Поиск колонок...'), {
      target: { value: 'missing' },
    });

    expect(screen.getByText('Nothing matched')).toBeInTheDocument();
  });

  it('renders selected count', () => {
    render(
      <ColumnListSelect
        columns={columns}
        value={['country', 'revenue']}
        onChange={() => undefined}
      />
    );

    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('renders dtype labels without the DataType prefix', () => {
    render(
      <ColumnListSelect
        columns={[
          {
            name: 'created_at',
            dtype: 'DataType.DATETIME' as any,
          },
        ]}
        value={[]}
        onChange={() => undefined}
      />
    );

    expect(screen.getByText('DateTime')).toBeInTheDocument();
    expect(screen.queryByText('DataType.DATETIME')).not.toBeInTheDocument();
  });
});
