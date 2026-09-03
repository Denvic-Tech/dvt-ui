import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MetadataOptionList } from './MetadataOptionList';

const options = [
  { value: 'analytics', label: 'analytics', tableCount: 12 },
  { value: 'warehouse', label: 'warehouse' },
];

describe('MetadataOptionList', () => {
  it('fills the available workspace height', () => {
    render(
      <MetadataOptionList
        appearance='rows'
        fillAvailableHeight
        emptyText='empty'
        icon={<span />}
        options={options}
        searchPlaceholder='search'
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByTestId(
        'features/node/db-target-selector/metadata-option-list'
      )
    ).toHaveStyle({ height: '100%', minHeight: '0px' });
    expect(
      screen.getByTestId(
        'features/node/db-target-selector/metadata-option-list-items'
      )
    ).toHaveStyle({ maxHeight: 'none', minHeight: '0px' });
    expect(
      screen.getAllByTestId(
        'features/node/db-target-selector/metadata-option'
      )[0]
    ).toHaveStyle({ flex: '0 0 auto' });
  });

  it('keeps embedded search local and hides unavailable lazy totals', () => {
    render(
      <MetadataOptionList
        emptyText='empty'
        icon={<span />}
        options={options}
        searchPlaceholder='search'
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('12 таблиц')).toBeInTheDocument();
    expect(screen.queryByText('undefined таблиц')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('search'), {
      target: { value: 'ware' },
    });

    expect(screen.getByText('warehouse')).toBeInTheDocument();
    expect(screen.queryByText('analytics')).not.toBeInTheDocument();
  });

  it('filters controlled search locally and keeps cursor pagination', () => {
    const onQueryChange = vi.fn();
    const onLoadNextPage = vi.fn();
    const onRefresh = vi.fn();

    render(
      <MetadataOptionList
        emptyText='empty'
        icon={<span />}
        options={options}
        searchPlaceholder='search'
        query='ware'
        onQueryChange={onQueryChange}
        hasNextPage
        onLoadNextPage={onLoadNextPage}
        onRefresh={onRefresh}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('warehouse')).toBeInTheDocument();
    expect(screen.queryByText('analytics')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('search'), {
      target: { value: 'next-query' },
    });
    expect(onQueryChange).toHaveBeenCalledWith('next-query');

    const list = screen.getByTestId(
      'features/node/db-target-selector/metadata-option-list-items'
    );
    Object.defineProperties(list, {
      clientHeight: { value: 100 },
      scrollHeight: { value: 150 },
      scrollTop: { value: 40 },
    });
    fireEvent.scroll(list);
    expect(onLoadNextPage).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Обновить каталог' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('renders an inline retry for gateway errors', () => {
    const onRetry = vi.fn();

    render(
      <MetadataOptionList
        emptyText='empty'
        icon={<span />}
        options={[]}
        searchPlaceholder='search'
        state='gatewayTimeout'
        onRetry={onRetry}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText(/504/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows skeletons while a retry request is pending', async () => {
    let resolveRetry: (() => void) | undefined;
    const onRetry = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveRetry = resolve;
        })
    );
    const { container } = render(
      <MetadataOptionList
        appearance='rows'
        emptyText='empty'
        icon={<span />}
        options={[]}
        searchPlaceholder='search'
        state='error'
        onRetry={onRetry}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(10);
    expect(
      screen.queryByRole('button', { name: 'Повторить' })
    ).not.toBeInTheDocument();

    await act(async () => {
      resolveRetry?.();
    });

    expect(
      screen.getByRole('button', { name: 'Повторить' })
    ).toBeInTheDocument();
  });

  it('shows an inline error when manual refresh fails', async () => {
    const onRefresh = vi.fn().mockResolvedValue(false);

    render(
      <MetadataOptionList
        appearance='rows'
        emptyText='empty'
        icon={<span />}
        options={options}
        searchPlaceholder='search'
        onRefresh={onRefresh}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Обновить каталог' }));

    expect(
      await screen.findByText('Не удалось обновить каталог')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });
});
