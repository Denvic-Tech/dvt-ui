import { useEffect, useState } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import ReadTableFromDBV3Extension from '../index';
import type { ReadTableFromDBV3Values } from '../lib/types';

import { ReadTableFromDBV3 } from './ReadTableFromDBV3';

const { previewCalls, partitioningAdvice } = vi.hoisted(() => ({
  previewCalls: [] as Array<{ table: string | null; enabled: boolean }>,
  partitioningAdvice: vi.fn(),
}));

const metadata = {
  connection_id: 'connection-postgres',
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
              type: 'BASE TABLE',
              columns: [
                { name: 'id', dtype: 'INT', primary_key: true },
                { name: 'created_at', dtype: 'DATETIME' },
              ],
            },
            {
              name: 'customers',
              type: 'BASE TABLE',
              columns: [
                { name: 'id', dtype: 'INT', primary_key: true },
                { name: 'email', dtype: 'VARCHAR' },
              ],
            },
          ],
        },
      ],
    },
  ],
} as any;

vi.mock(
  '@/entities/data/db-connection/api/dbConnectionsApi',
  async importOriginal => {
    const original =
      await importOriginal<
        typeof import('@/entities/data/db-connection/api/dbConnectionsApi')
      >();
    return {
      ...original,
      dbConnectionsApi: { ...original.dbConnectionsApi, partitioningAdvice },
    };
  }
);

const hashAdvice = {
  recommendations: [
    {
      rank: 1,
      partition_col: 'created_at',
      partition_grouping: { mode: 'hash', buckets: 32 },
    },
  ],
};

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
};

const listResult = (items: unknown[], enabled = true) => ({
  items: enabled ? items : [],
  state: enabled ? 'ready' : 'idle',
  error: null,
  meta: null,
  hasNextPage: false,
  isFetchingNextPage: false,
  isRefreshing: false,
  loadMoreError: null,
  loadNextPage: vi.fn(),
  retry: vi.fn(),
});

vi.mock('@/features/node/get-node-metadata', () => ({
  useConnectedNodeMetadata: () => ({
    connectedNodeMetadataByInput: { connection: metadata },
    actualConnectedNodeMetadataByInput: { connection: metadata },
    connectedNodeMetadataActualityByInput: { connection: true },
  }),
}));

vi.mock(
  '@/entities/data/db-connection/model/hooks/useDbCatalog',
  async importOriginal => {
    const original =
      await importOriginal<
        typeof import('@/entities/data/db-connection/model/hooks/useDbCatalog')
      >();
    return {
      ...original,
      useDbCatalogDatabases: (_metadata: unknown, options: any) =>
        listResult([{ name: 'analytics' }], options?.enabled !== false),
      useDbCatalogSchemas: (
        _metadata: unknown,
        database: string,
        options: any
      ) =>
        listResult(
          [{ name: 'public' }],
          options?.enabled !== false && database === 'analytics'
        ),
      useDbCatalogTables: (
        _metadata: unknown,
        _database: string,
        schema: string,
        options: any
      ) =>
        // 10 таблиц — больше порога, после которого у схемы есть поиск.
        listResult(
          [
            'orders',
            'customers',
            'payments',
            'refunds',
            'invoices',
            'products',
            'stores',
            'users',
            'visits',
            'events',
          ].map(name => ({
            name,
            kind: 'table',
            databaseName: 'analytics',
            schemaName: 'public',
          })),
          options?.enabled !== false && schema === 'public'
        ),
      useDbCatalogTable: () => ({
        item: null,
        state: 'idle',
        error: null,
        meta: null,
        isRefreshing: false,
        retry: vi.fn(),
      }),
      useDbCatalogTablePreview: (
        _metadata: unknown,
        _database: string,
        _schema: string,
        table: string | null,
        options: { enabled?: boolean }
      ) => {
        const enabled = options.enabled !== false;
        previewCalls.push({ table, enabled });
        return {
          data: enabled
            ? {
                columns: [
                  { name: 'id', dtype: 'INT' },
                  { name: 'created_at', dtype: 'DATETIME' },
                ],
                rows: [[1, null]],
                truncated: false,
                rowCount: 5_000_000,
                rowCountExact: false,
              }
            : null,
          state: enabled ? 'ready' : 'idle',
          error: null,
          isRefreshing: false,
          retry: vi.fn(),
        };
      },
      useRefreshDbCatalog: () => ({ refresh: vi.fn(), isLoading: false }),
    };
  }
);

const valuesRef: { current: ReadTableFromDBV3Values } = { current: {} };

const Harness = ({
  savedValues,
}: {
  savedValues?: ReadTableFromDBV3Values;
}) => {
  const [values, setValues] = useState<ReadTableFromDBV3Values>({});
  valuesRef.current = values;

  // Как в node-data-modal: сохранённые значения ноды подставляются
  // эффектом уже после первого рендера расширения.
  useEffect(() => {
    if (savedValues) setValues(savedValues);
  }, [savedValues]);

  return (
    <ReadTableFromDBV3
      id='node-1'
      projectID='project-1'
      data={{} as never}
      isOpen
      localInputData={values}
      setLocalInputData={setValues as never}
      setValidationCallback={vi.fn()}
      nodeDefinition={
        { name: 'ReadTableFromDBV3', input_definitions: {} } as never
      }
      variables={[]}
    />
  );
};

const treeItem = (name: string) =>
  screen.getByRole('treeitem', { name: new RegExp(name) });

describe('ReadTableFromDBV3', () => {
  beforeEach(() => {
    previewCalls.length = 0;
    valuesRef.current = {};
    partitioningAdvice.mockReset();
  });

  it('selects a table in the tree and loads the preview only on demand', async () => {
    render(<Harness />);

    expect(
      screen.getByText(
        'Выберите таблицу слева — здесь появятся колонки и настройки'
      )
    ).toBeInTheDocument();
    expect(ReadTableFromDBV3Extension.type).toBe('modal');
    expect(
      'isSaveDisabled' in ReadTableFromDBV3Extension &&
        ReadTableFromDBV3Extension.isSaveDisabled?.(valuesRef.current)
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Показать выбранное в дереве' })
    ).toBeDisabled();

    fireEvent.click(treeItem('analytics'));
    fireEvent.click(await screen.findByRole('treeitem', { name: /public/ }));
    await screen.findByRole('treeitem', { name: /orders/ });

    const search = screen.getByRole('textbox', { name: 'Поиск' });
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(
      screen.getByText('В раскрытых узлах совпадений нет')
    ).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'ord' } });
    expect(screen.getAllByRole('treeitem')).toHaveLength(3);

    fireEvent.click(treeItem('orders'));

    await waitFor(() => {
      expect(valuesRef.current).toMatchObject({
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'orders',
        columns: ['id', 'created_at'],
      });
    });
    // Выбор кликом не запускает авто-раскрытие и не сбрасывает поиск.
    expect(search).toHaveValue('ord');
    fireEvent.change(search, { target: { value: '' } });
    expect(
      'isSaveDisabled' in ReadTableFromDBV3Extension &&
        ReadTableFromDBV3Extension.isSaveDisabled?.(valuesRef.current)
    ).toBe(false);
    expect(treeItem('orders')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Параметры' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('button', { name: 'Режим группировки' })
    ).toBeDisabled();
    expect(
      screen.queryByRole('textbox', { name: 'Лимит строк, от 1 до 1 000 000' })
    ).toBeNull();
    expect(previewCalls.some(call => call.enabled)).toBe(false);

    fireEvent.click(
      screen.getByRole('button', { name: /Дополнительные настройки/ })
    );
    expect(
      screen.getByRole('textbox', { name: 'Лимит строк, от 1 до 1 000 000' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Колонки' }));
    expect(screen.getByText('Выбрано 2 из 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выбрать все' })).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: 'Поиск колонок' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /created_at/ }));
    expect(valuesRef.current.columns).toEqual(['id']);
    fireEvent.click(screen.getByRole('button', { name: 'Снять все' }));
    expect(valuesRef.current.columns).toBeNull();
    expect(screen.getByRole('button', { name: 'Снять все' })).toBeDisabled();

    fireEvent.click(screen.getByRole('tab', { name: 'Предпросмотр' }));
    expect(screen.queryByRole('textbox', { name: 'Поиск колонок' })).toBeNull();
    const table = await screen.findByRole('table', {
      name: 'Предпросмотр данных таблицы',
    });
    expect(within(table).getByTitle('NULL')).toHaveTextContent('—');
    const isRowCount = (_: string, element: Element | null) =>
      element?.tagName === 'SPAN' &&
      element.textContent === '1 из ~ 5 000 000 строк';
    expect(screen.getByText(isRowCount)).toBeInTheDocument();
    expect(previewCalls[previewCalls.length - 1]).toEqual({
      table: 'orders',
      enabled: true,
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Колонки' }));
    expect(screen.queryByText(isRowCount)).toBeNull();
  });

  it('reveals the saved table in the tree on open', async () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    onTestFinished(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    render(
      <Harness
        savedValues={{
          database_name: 'analytics',
          schema_name: 'public',
          table_name: 'orders',
        }}
      />
    );

    const orders = await screen.findByRole('treeitem', { name: /orders/ });
    expect(orders).toHaveAttribute('aria-selected', 'true');
    expect(treeItem('analytics')).toHaveAttribute('aria-expanded', 'true');
    expect(treeItem('public')).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    });
    expect(scrollIntoView.mock.contexts[0]).toBe(orders);

    // Шапки раскрытых узлов прилипают друг под другом: у базы нет поля
    // поиска (одна схема), у схемы есть (10 таблиц).
    const analyticsHeader = treeItem('analytics').parentElement;
    const publicHeader = treeItem('public').parentElement;
    expect(analyticsHeader).toHaveStyle({
      position: 'sticky',
      top: '0px',
      zIndex: '4',
    });
    expect(publicHeader).toHaveStyle({
      position: 'sticky',
      top: '30px',
      zIndex: '3',
    });
    expect(
      within(publicHeader as HTMLElement).getByRole('textbox', {
        name: 'Поиск таблиц',
      })
    ).toBeInTheDocument();
    // Строка таблицы не прилипает и не уходит под шапки при прокрутке.
    expect(orders.parentElement).toBe(publicHeader?.parentElement);
    expect(orders).toHaveStyle({ scrollMarginTop: '92px' });
    expect(orders).not.toHaveStyle({ position: 'sticky' });

    // Путь к выбранной таблице: название того же цвета, начертание прежнее.
    expect(within(treeItem('analytics')).getByText('analytics')).toHaveStyle({
      color: '#4343D6',
      fontWeight: '500',
    });
  });

  it('filters tables inside a schema and keeps the value per node', async () => {
    render(<Harness />);

    fireEvent.click(treeItem('analytics'));
    fireEvent.click(await screen.findByRole('treeitem', { name: /public/ }));
    const filter = await screen.findByRole('textbox', { name: 'Поиск таблиц' });
    // У базы одна схема — поиска схем нет.
    expect(screen.queryByRole('textbox', { name: 'Поиск схем' })).toBeNull();
    expect(treeItem('public')).toHaveTextContent('10');

    fireEvent.click(treeItem('orders'));
    await waitFor(() => expect(valuesRef.current.table_name).toBe('orders'));

    fireEvent.change(filter, { target: { value: 'PAY' } });
    expect(screen.queryByRole('treeitem', { name: /orders/ })).toBeNull();
    expect(treeItem('payments')).toBeInTheDocument();
    expect(treeItem('public')).toHaveTextContent('1 из 10');
    // Ввод не сворачивает узел и не сбрасывает выбор.
    expect(treeItem('public')).toHaveAttribute('aria-expanded', 'true');
    expect(valuesRef.current.table_name).toBe('orders');

    // Стрелки остаются в поле и не уходят дальше дерева.
    const onDocumentKeyDown = vi.fn();
    document.addEventListener('keydown', onDocumentKeyDown);
    onTestFinished(() =>
      document.removeEventListener('keydown', onDocumentKeyDown)
    );
    fireEvent.keyDown(filter, { key: 'ArrowDown' });
    expect(onDocumentKeyDown).not.toHaveBeenCalled();

    fireEvent.change(filter, { target: { value: 'zzz' } });
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(treeItem('public')).toHaveTextContent('0 из 10');

    // Значение переживает сворачивание и повторное раскрытие узла.
    fireEvent.click(treeItem('public'));
    expect(screen.queryByRole('textbox', { name: 'Поиск таблиц' })).toBeNull();
    fireEvent.click(treeItem('public'));
    expect(screen.getByRole('textbox', { name: 'Поиск таблиц' })).toHaveValue(
      'zzz'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Очистить' }));
    const cleared = screen.getByRole('textbox', { name: 'Поиск таблиц' });
    expect(cleared).toHaveValue('');
    expect(cleared).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Очистить' })).toBeNull();
    expect(treeItem('public')).not.toHaveTextContent('из');

    // «Показать выбранное» сбрасывает фильтр, который скрыл таблицу.
    fireEvent.change(cleared, { target: { value: 'pay' } });
    expect(screen.queryByRole('treeitem', { name: /orders/ })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Показать выбранное в дереве' })
    );
    expect(screen.getByRole('textbox', { name: 'Поиск таблиц' })).toHaveValue(
      ''
    );
    expect(treeItem('orders')).toHaveAttribute('aria-selected', 'true');
  });

  it('fills partitioning settings from the advice and undoes them', async () => {
    const response = deferred<typeof hashAdvice>();
    partitioningAdvice.mockReturnValue(response.promise);
    render(
      <Harness
        savedValues={{
          database_name: 'analytics',
          schema_name: 'public',
          table_name: 'orders',
          columns: ['id', 'created_at'],
        }}
      />
    );

    await screen.findByRole('button', { name: 'Подобрать настройки' });
    expect(
      screen.getByRole('button', { name: 'Что делает автоматический подбор' })
    ).toHaveAccessibleDescription(
      'Анализирует данные таблицы и подставляет колонку сегментации и режим группировки, при которых чтение делится на партиции равномерно.'
    );
    // Ссылка есть только на вкладке «Параметры».
    fireEvent.click(screen.getByRole('tab', { name: 'Колонки' }));
    expect(
      screen.queryByRole('button', { name: 'Подобрать настройки' })
    ).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Параметры' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Подобрать настройки' })
    );
    expect(screen.getByText('Анализируем таблицу…')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Подобрать настройки' })
    ).toBeNull();
    expect(partitioningAdvice).toHaveBeenCalledWith(
      'connection-postgres',
      {
        table_name: 'orders',
        database_name: 'analytics',
        schema_name: 'public',
        read_columns: ['id', 'created_at'],
      },
      expect.any(AbortSignal)
    );

    await act(async () => response.resolve(hashAdvice));
    expect(await screen.findByText('Настройки подобраны')).toBeInTheDocument();
    expect(valuesRef.current).toMatchObject({
      partition_col: 'created_at',
      partition_grouping: { mode: 'hash', buckets: 32 },
    });
    expect(
      screen.getByRole('button', { name: 'Колонка сегментации' })
    ).toHaveTextContent('created_at');
    expect(
      screen.getByRole('button', { name: 'Режим группировки' })
    ).toHaveTextContent('Hash');
    expect(
      screen.getByRole('textbox', { name: 'Количество бакетов' })
    ).toHaveValue('32');

    fireEvent.click(screen.getByRole('button', { name: 'Отменить' }));
    expect(valuesRef.current.partition_col).toBeUndefined();
    expect(valuesRef.current.partition_grouping).toBeUndefined();
    expect(
      screen.getByRole('button', { name: 'Подобрать настройки' })
    ).toBeInTheDocument();
  });

  it('keeps optimal settings and reports failed advice', async () => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout'],
    });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const saved: ReadTableFromDBV3Values = {
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
      partition_col: 'created_at',
      partition_grouping: { mode: 'hash', buckets: 32 },
    };
    partitioningAdvice.mockResolvedValue(hashAdvice);
    render(<Harness savedValues={saved} />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Подобрать настройки' })
    );
    expect(
      await screen.findByText('Текущие настройки уже оптимальны')
    ).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByText('Текущие настройки уже оптимальны')).toBeNull();

    partitioningAdvice.mockRejectedValue(new Error('network'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Подобрать настройки' })
    );
    expect(await screen.findByText('Не удалось подобрать')).toBeInTheDocument();

    // Колонки из ответа нет в таблице: это ошибка, поля не меняются.
    partitioningAdvice.mockResolvedValue({
      recommendations: [
        {
          rank: 1,
          partition_col: 'missing',
          partition_grouping: { mode: 'hash' },
        },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(screen.getByText('Анализируем таблицу…')).toBeInTheDocument();
    expect(await screen.findByText('Не удалось подобрать')).toBeInTheDocument();
    expect(partitioningAdvice).toHaveBeenCalledTimes(3);
    expect(valuesRef.current).toMatchObject(saved);
  });

  it('drops the advice for a table changed while it was requested', async () => {
    const response = deferred<typeof hashAdvice>();
    partitioningAdvice.mockReturnValue(response.promise);
    render(
      <Harness
        savedValues={{
          database_name: 'analytics',
          schema_name: 'public',
          table_name: 'orders',
        }}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Подобрать настройки' })
    );
    fireEvent.click(await screen.findByRole('treeitem', { name: /customers/ }));
    await waitFor(() => {
      expect(valuesRef.current.table_name).toBe('customers');
    });
    const signal = partitioningAdvice.mock.calls[0]?.[2] as AbortSignal;
    expect(signal.aborted).toBe(true);

    await act(async () => response.resolve(hashAdvice));
    expect(valuesRef.current.partition_col).toBeUndefined();
    expect(screen.queryByText('Настройки подобраны')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Подобрать настройки' })
    ).toBeInTheDocument();
  });
});
