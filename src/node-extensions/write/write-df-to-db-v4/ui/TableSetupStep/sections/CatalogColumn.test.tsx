import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InputDefinitionModel } from '@/shared/gatewayClient';

import { CatalogColumn, type CatalogColumnProps } from './CatalogColumn';

vi.mock('@/shared/ui/node-input/PrimitiveNodeInput', () => ({
  default: () => <div>Редактор выражения</div>,
}));
const props: CatalogColumnProps = {
  title: 'Таблица',
  attribute: 'table_name',
  icon: null,
  options: [
    { value: 'orders', label: 'orders' },
    { value: 'events', label: 'events' },
  ],
  value: 'orders',
  onChange: vi.fn(),
  onSelect: vi.fn(),
  inputDefinition: null,
  variables: [],
  emptyText: 'Таблиц пока нет',
};

describe('CatalogColumn', () => {
  it('shows skeletons instead of stale options during loading and refresh', () => {
    const { rerender } = render(<CatalogColumn {...props} state='loading' />);
    expect(
      screen.getByRole('status', { name: 'Загрузка: Таблица' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'orders' })
    ).not.toBeInTheDocument();
    rerender(<CatalogColumn {...props} state='ready' isRefreshing />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an error with a working retry', async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    render(<CatalogColumn {...props} state='gatewayTimeout' onRetry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Сервер не ответил вовремя'
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    );
    expect(retry).toHaveBeenCalledOnce();
  });

  it('keeps the list available after a next-page error', async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    render(
      <CatalogColumn
        {...props}
        state='ready'
        loadMoreError={{ message: 'failed' }}
        onRetry={retry}
      />
    );
    expect(screen.getByRole('button', { name: 'orders' })).toBeInTheDocument();
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    );
    expect(retry).toHaveBeenCalledOnce();
  });

  it('filters locally and requests server search after a debounce', async () => {
    vi.useFakeTimers();
    try {
      const search = vi.fn();
      render(<CatalogColumn {...props} query='' onQueryChange={search} />);
      fireEvent.change(
        screen.getByRole('textbox', { name: 'Поиск: Таблица' }),
        { target: { value: 'order' } }
      );
      expect(
        screen.queryByRole('button', { name: 'events' })
      ).not.toBeInTheDocument();
      expect(search).not.toHaveBeenCalled();
      await act(async () => vi.advanceTimersByTime(300));
      expect(search).toHaveBeenCalledWith('order');
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves the literal selection across expression mode', () => {
    function Harness() {
      const [value, setValue] = useState<unknown>('orders');
      return (
        <CatalogColumn
          {...props}
          value={value}
          onChange={setValue}
          inputDefinition={
            {
              type: 'STR',
              allow_expressions: true,
            } as unknown as InputDefinitionModel
          }
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Выражение: Таблица' }));
    expect(screen.getByText('Редактор выражения')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Выражение: Таблица' }));
    expect(screen.getByRole('button', { name: 'orders' })).toBeInTheDocument();
  });
});
