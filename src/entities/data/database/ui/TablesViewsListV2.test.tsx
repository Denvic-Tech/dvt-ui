import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TablesViewsListV2 } from './TablesViewsListV2';

const tableItems = [
  {
    name: 'orders',
    type: 'BASE_TABLE',
    database_name: 'warehouse',
    schema_name: 'public',
  },
  {
    name: 'customers',
    type: 'VIEW',
    database_name: 'warehouse',
    schema_name: 'public',
  },
];

describe('TablesViewsListV2', () => {
  it('renders lazy summaries without fake columns', () => {
    const onItemClick = vi.fn();
    render(
      <TablesViewsListV2
        tables={tableItems}
        selectedItem={tableItems[0]}
        onItemClick={onItemClick}
        showHierarchy={false}
      />
    );

    fireEvent.click(screen.getByText('customers'));
    expect(onItemClick).toHaveBeenCalledWith(tableItems[1]);
  });

  it('keeps local filtering for embedded data', () => {
    render(
      <TablesViewsListV2
        tables={tableItems}
        onItemClick={vi.fn()}
        showHierarchy={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Поиск таблиц...'), {
      target: { value: 'orders' },
    });
    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.queryByText('customers')).not.toBeInTheDocument();
  });

  it('filters controlled search locally and keeps cursor loading', () => {
    const onSearchQueryChange = vi.fn();
    const onLoadNextPage = vi.fn();
    const onRefresh = vi.fn();
    render(
      <TablesViewsListV2
        tables={tableItems}
        onItemClick={vi.fn()}
        showHierarchy={false}
        searchQuery='orders'
        onSearchQueryChange={onSearchQueryChange}
        hasNextPage
        onLoadNextPage={onLoadNextPage}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.queryByText('customers')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Поиск таблиц...'), {
      target: { value: 'next-query' },
    });
    expect(onSearchQueryChange).toHaveBeenCalledWith('next-query');

    const root = screen.getByTestId(
      'entities/data/database/database-tables-list'
    );
    const scrollContainer = root.lastElementChild as HTMLElement;
    Object.defineProperties(scrollContainer, {
      clientHeight: { value: 100 },
      scrollHeight: { value: 150 },
      scrollTop: { value: 40 },
    });
    fireEvent.scroll(scrollContainer);
    expect(onLoadNextPage).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Обновить каталог' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
