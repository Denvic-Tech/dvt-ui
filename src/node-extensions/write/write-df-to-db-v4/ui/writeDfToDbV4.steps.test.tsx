import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  DataFrameMetadata,
  DbMetadata,
  WriteColumnResolutionRow,
} from '@/shared/gatewayClient';

import {
  buildRequestedColumnMappingDraft,
  buildResolveWriteColumnsRequest,
  buildResolveWriteColumnsTriggerKey,
  type ColumnMappingItem,
  createTableBeforeFinish,
  type ExtensionState,
  type WriteDataFrameToDBValues,
} from '../lib/helpers';

import { SchemaStrategyStep } from './SchemaStrategyStep';
import { WriteModeStep } from './WriteModeStep';
import { WriteSettingsStep } from './WriteSettingsStep';

const {
  getConnectedInputMetadataMock,
  resolveWriteColumnsPostMock,
  recreateTablePostMock,
  generateTableDdlPostMock,
  createTablePostMock,
  confirmMock,
  dispatchMock,
} = vi.hoisted(() => ({
  getConnectedInputMetadataMock: vi.fn(),
  resolveWriteColumnsPostMock: vi.fn(),
  recreateTablePostMock: vi.fn(),
  generateTableDdlPostMock: vi.fn(),
  createTablePostMock: vi.fn(),
  confirmMock: vi.fn(),
  dispatchMock: vi.fn(),
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => dispatchMock,
}));

vi.mock('@/entities/data/db-connection/model/hooks/useDbCatalog', () => ({
  useDbCatalogTable: () => ({ item: null }),
}));

vi.mock('@/entities/node/node-metadata', () => ({
  setOutputMetadata: vi.fn(payload => ({
    type: 'nodeMetadata/setOutputMetadata',
    payload,
  })),
}));

vi.mock('@/features/node/get-node-connections', () => {
  const connectedInputs = {
    connection: {
      nodeID: 'connection-node',
      outputName: 'connection',
    },
  };

  return {
    useNodeConnections: () => ({
      getConnectedInputMetadata: getConnectedInputMetadataMock,
      connectedInputs,
    }),
  };
});

vi.mock('@/shared/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: confirmMock,
  }),
}));

vi.mock('@/shared/gatewayClient', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/gatewayClient')>();

  return {
    ...actual,
    client: {
      utils: {
        ddl: {
          resolveWriteColumns: {
            post: resolveWriteColumnsPostMock,
          },
          recreateTable: {
            post: recreateTablePostMock,
          },
          generateTableDdl: {
            post: generateTableDdlPostMock,
          },
          createTable: {
            post: createTablePostMock,
          },
        },
      },
    },
  };
});

vi.mock('@/features/node/table-create-spec-editor', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@/features/node/table-create-spec-editor')
    >();

  return {
    ...actual,
    TableCreateSpecEditor: ({ value }: { value: unknown }) => (
      <div data-testid='table-create-spec-editor'>{JSON.stringify(value)}</div>
    ),
  };
});

vi.mock('@/entities/data/dataframe', () => ({
  ColumnDropdownSelect: ({
    value,
    onChange,
    multiple = false,
  }: {
    value?: string | string[] | null;
    onChange: (value: string | string[]) => void;
    multiple?: boolean;
  }) => (
    <select
      aria-label='column-dropdown-select'
      multiple={multiple}
      value={value ?? (multiple ? [] : '')}
      onChange={event =>
        onChange(
          multiple
            ? Array.from(event.target.selectedOptions, option => option.value)
            : event.target.value
        )
      }
    >
      <option value=''>Select</option>
      <option value='client_id'>client_id</option>
      <option value='event_time'>event_time</option>
    </select>
  ),
}));

vi.mock('@/shared/ui', () => ({
  SingleOptionDropdownSelect: ({
    value,
    onChange,
    options,
  }: {
    value?: string | null;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <select
      aria-label='single-option-dropdown'
      value={value ?? ''}
      onChange={event => onChange(event.target.value)}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const dataframeMetadata: DataFrameMetadata = {
  columns: [
    { name: 'clientId', dtype: 'INT', nullable: false },
    { name: 'eventTime', dtype: 'DATETIME', nullable: false },
  ],
} as DataFrameMetadata;

const connectionMetadata: DbMetadata = {
  connection_id: 'connection-postgres',
  connection_revision: 'revision-1',
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
                { name: 'client_id', dtype: 'INT' },
                { name: 'event_time', dtype: 'DATETIME' },
              ],
            },
          ],
        },
      ],
    },
  ],
} as unknown as DbMetadata;

const nodeDefinition = {
  name: 'WriteDataFrameToDBV4',
  input_definitions: {
    write_mode: {
      options: ['append', 'truncate', 'upsert'],
    },
    chunksize: {},
    min_batch_rows: {},
  },
} as any;

const existingTableInputData: WriteDataFrameToDBValues = {
  database_name: 'analytics',
  schema_name: 'public',
  table_name: 'orders',
  write_mode: 'append',
  chunksize: 1000,
  min_batch_rows: 5000,
  column_mapping: [
    {
      source_name: 'clientId',
      target_name: 'client_id',
      dtype: 'INT',
      nullable: false,
    },
    {
      source_name: 'eventTime',
      target_name: 'event_time',
      dtype: 'DATETIME',
      nullable: false,
    },
  ],
};

const newTableInputData: WriteDataFrameToDBValues = {
  database_name: 'analytics',
  schema_name: 'public',
  table_name: 'orders_new',
  write_mode: 'append',
  chunksize: 1000,
  min_batch_rows: 5000,
};

const buildResolvedRows = (
  mapping: ColumnMappingItem[] = existingTableInputData.column_mapping ?? []
): WriteColumnResolutionRow[] => {
  const knownDbColumns = new Set(['client_id', 'event_time']);

  return mapping.map(item => {
    const targetName = item.target_name;
    const existsInDb = knownDbColumns.has(targetName);

    return {
      source_name: item.source_name,
      requested_target_name: targetName,
      effective_target_name: targetName,
      db_name: targetName,
      dtype: item.dtype,
      nullable: item.nullable,
      status: existsInDb ? 'explicit_mapping' : 'missing_in_db',
      reason: existsInDb ? null : `${targetName} missing in DB`,
    };
  });
};

const buildExistingTableSharedState = (
  overrides: Partial<ExtensionState> = {},
  inputData: WriteDataFrameToDBValues = existingTableInputData
): ExtensionState => {
  const requestedMapping = buildRequestedColumnMappingDraft({
    dataframeMetadata,
    existingMapping: inputData.column_mapping,
  });
  const request = buildResolveWriteColumnsRequest({
    connectionMetadata,
    dataframeMetadata,
    inputValues: inputData,
    isTableNew: false,
    creationMode: 'raw',
    requestedMapping,
  });

  return {
    isTableNew: false,
    requestedColumnMappingDraft: requestedMapping,
    resolvedColumnRows: buildResolvedRows(requestedMapping),
    resolvedDiagnostics: [],
    lastResolveColumnsKey: buildResolveWriteColumnsTriggerKey(request),
    ...overrides,
  };
};

const setupGatewayMocks = () => {
  resolveWriteColumnsPostMock.mockImplementation(
    async ({
      body,
    }: {
      body: { column_mapping?: ColumnMappingItem[] | null };
    }) => {
      const effectiveMapping =
        body.column_mapping ??
        buildRequestedColumnMappingDraft({
          dataframeMetadata,
          existingMapping: existingTableInputData.column_mapping,
        });

      return {
        data: {
          columns: buildResolvedRows(effectiveMapping),
          diagnostics: [],
          effective_column_mapping: effectiveMapping,
        },
      };
    }
  );

  generateTableDdlPostMock.mockResolvedValue({
    data: { sql: 'CREATE TABLE orders (...);' },
  });
  createTablePostMock.mockResolvedValue({
    data: { message: 'Table created.' },
  });
  recreateTablePostMock.mockResolvedValue({
    data: {
      message: 'Table recreated.',
      table_metadata:
        connectionMetadata.databases?.[0]?.schemas?.[0]?.tables?.[0],
    },
  });
  confirmMock.mockResolvedValue(true);
};

type StepKind = 'schema' | 'mode' | 'write';

const renderStepHarness = ({
  activeStep,
  initialInputData,
  initialSharedState,
  isOpen = true,
}: {
  activeStep: StepKind;
  initialInputData: WriteDataFrameToDBValues;
  initialSharedState: ExtensionState;
  isOpen?: boolean;
}) => {
  let validationCallback: undefined | (() => Promise<boolean>);
  const setValidationErrors = vi.fn();

  const Harness = ({ step, open }: { step: StepKind; open: boolean }) => {
    const [localInputData, setLocalInputData] =
      useState<WriteDataFrameToDBValues>(initialInputData);
    const [sharedState, setSharedState] =
      useState<ExtensionState>(initialSharedState);

    useEffect(() => {
      (window as typeof window & { __testState?: unknown }).__testState = {
        localInputData,
        setLocalInputData,
        sharedState,
      };
    }, [localInputData, sharedState]);

    const commonProps = {
      id: 'node-1',
      data: {} as never,
      nodeDefinition,
      isOpen: open,
      localInputData,
      setLocalInputData,
      sharedState,
      setSharedState,
      setValidationErrors,
      variables: [],
    } as any;

    const componentByStep: Record<StepKind, ReactNode> = {
      schema: <SchemaStrategyStep {...commonProps} />,
      mode: <WriteModeStep {...commonProps} />,
      write: (
        <WriteSettingsStep
          {...commonProps}
          setValidationCallback={(nextValue: unknown) => {
            validationCallback =
              typeof nextValue === 'function'
                ? (nextValue as () => () => Promise<boolean>)()
                : (nextValue as undefined | (() => Promise<boolean>));
          }}
        />
      ),
    };

    return componentByStep[step];
  };

  const utils = render(<Harness step={activeStep} open={isOpen} />);

  return {
    ...utils,
    rerenderHarness: (step: StepKind, open = true) =>
      utils.rerender(<Harness step={step} open={open} />),
    getState: () =>
      (
        window as typeof window & {
          __testState?: {
            localInputData: WriteDataFrameToDBValues;
            setLocalInputData: Dispatch<
              SetStateAction<WriteDataFrameToDBValues>
            >;
            sharedState: ExtensionState;
          };
        }
      ).__testState,
    getValidationCallback: () => validationCallback,
    setValidationErrors,
  };
};

describe('write-df-to-db-v4 step placement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setupGatewayMocks();

    getConnectedInputMetadataMock.mockImplementation((inputName: string) => {
      if (inputName === 'connection') {
        return connectionMetadata;
      }
      if (inputName === 'df') {
        return dataframeMetadata;
      }
      return null;
    });
  });

  it('renders DF/DB mapping on schema step for existing table and removes old info text', () => {
    renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    expect(screen.getByText('Сопоставление DF и DB')).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Выбрана существующая таблица. Шаг SCHEMA STRATEGY не требуется.'
      )
    ).not.toBeInTheDocument();

    const prioritizeButton = screen.getByRole('button', {
      name: 'Проблемные сверху',
    });
    expect(prioritizeButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(prioritizeButton);

    expect(
      screen.getByRole('button', { name: 'Исходный порядок' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps schema strategy controls for new table flow', () => {
    renderStepHarness({
      activeStep: 'schema',
      initialInputData: newTableInputData,
      initialSharedState: {
        isTableNew: true,
      },
    });

    expect(screen.getByText('SQL-скрипт')).toBeInTheDocument();
    const constructorButton = screen.getByRole('button', {
      name: 'Конструктор таблицы',
    });
    expect(constructorButton).toBeInTheDocument();

    fireEvent.click(constructorButton);

    expect(screen.getByText('Маппинг колонок')).toBeInTheDocument();
    expect(screen.getByText('Колонка в DataFrame')).toBeInTheDocument();
    expect(screen.queryByText('Настроить колонки')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps nullable and dtype edits in DDL preview and table creation', async () => {
    const initialMapping: ColumnMappingItem[] = [
      {
        source_name: 'clientId',
        target_name: 'client_id',
        dtype: 'INT',
        nullable: true,
      },
      {
        source_name: 'eventTime',
        target_name: 'event_time',
        dtype: 'DATETIME',
        nullable: true,
      },
    ];
    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: {
        ...newTableInputData,
        column_mapping: initialMapping,
      },
      initialSharedState: {
        isTableNew: true,
        selectedCreationMode: 'typed',
        requestedColumnMappingDraft: initialMapping,
        resolvedColumnRows: buildResolvedRows(initialMapping),
        resolvedDiagnostics: [],
      },
    });

    fireEvent.click(screen.getByLabelText('Nullable for client_id'));
    fireEvent.change(screen.getByDisplayValue('INT'), {
      target: { value: 'FLOAT' },
    });

    expect(
      harness.getState()?.localInputData.column_mapping?.[0]
    ).toMatchObject({
      target_name: 'client_id',
      dtype: 'FLOAT',
      nullable: false,
    });

    harness.rerenderHarness('write');
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(generateTableDdlPostMock).toHaveBeenCalledWith(
      {
        body: expect.objectContaining({
          connection_id: 'connection-postgres',
          columns: expect.arrayContaining([
            expect.objectContaining({
              name: 'client_id',
              dtype: 'FLOAT',
              nullable: false,
            }),
          ]),
        }),
      },
      { silent: true }
    );
    const recreateCalls = recreateTablePostMock.mock.calls;
    const recreateRequest = recreateCalls[recreateCalls.length - 1]?.[0];
    expect(JSON.stringify(recreateRequest)).not.toMatch(
      /connection_metadata|connection_string|connection_url/
    );

    const state = harness.getState();
    const createPromise = createTableBeforeFinish({
      nodeID: 'node-1',
      inputValues: state?.localInputData ?? {},
      nodeDefinition,
      data: {} as never,
      variables: [],
      sharedState: state?.sharedState ?? {},
      setSharedState: vi.fn(),
    });

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(2000);
    });
    await expect(createPromise).resolves.toBe(true);
    expect(createTablePostMock).toHaveBeenCalledWith(
      {
        body: expect.objectContaining({
          mode: 'from_schema',
          columns: expect.arrayContaining([
            expect.objectContaining({
              name: 'client_id',
              dtype: 'FLOAT',
              nullable: false,
            }),
          ]),
        }),
      },
      { silent: true }
    );
  });

  it('propagates a PostgreSQL upsert key into typed table settings', () => {
    const harness = renderStepHarness({
      activeStep: 'mode',
      initialInputData: {
        ...newTableInputData,
        write_mode: 'upsert',
        column_mapping: [
          {
            source_name: 'clientId',
            target_name: 'client_id',
            dtype: 'INT',
            nullable: true,
          },
          {
            source_name: 'eventTime',
            target_name: 'event_time',
            dtype: 'DATETIME',
            nullable: true,
          },
        ],
      },
      initialSharedState: {
        isTableNew: true,
        selectedCreationMode: 'typed',
      },
    });

    expect(
      screen.getByText(
        'При создании таблицы для выбранной колонки будет создан индекс, а сама колонка получит ограничение NOT NULL.'
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.change(screen.getByLabelText('column-dropdown-select'), {
        target: { value: 'client_id' },
      });
    });

    expect(harness.getState()?.localInputData).toMatchObject({
      upsert_config: { key_column: 'client_id' },
      column_mapping: [
        { target_name: 'client_id', nullable: false },
        { target_name: 'event_time', nullable: true },
      ],
      table_create_spec: {
        indexes: [{ columns: ['client_id'], unique: false }],
      },
    });

    harness.rerenderHarness('write');
    fireEvent.click(
      screen.getByRole('button', { name: 'Дополнительные параметры' })
    );

    expect(screen.getByTestId('table-create-spec-editor')).toHaveTextContent(
      '"columns":["client_id"]'
    );
  });

  it('does not show the upsert table creation hint for an existing table', () => {
    renderStepHarness({
      activeStep: 'mode',
      initialInputData: {
        ...existingTableInputData,
        write_mode: 'upsert',
        upsert_config: { key_column: 'client_id' },
      },
      initialSharedState: buildExistingTableSharedState(),
    });

    expect(
      screen.queryByText(/При создании таблицы выбранная колонка/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/При создании таблицы для выбранной колонки/)
    ).not.toBeInTheDocument();
  });

  it('does not render mapping section on write settings step for existing table', () => {
    renderStepHarness({
      activeStep: 'write',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    expect(screen.getByText('Настройки записи')).toBeInTheDocument();
    expect(screen.queryByText('Сопоставление DF и DB')).not.toBeInTheDocument();
  });

  it('publishes Typed Table spec errors through modal validation and clears only its own key', async () => {
    const clickhouseConnectionMetadata = {
      ...connectionMetadata,
      connection_id: 'connection-clickhouse',
      dialect: 'clickhouse',
    } as unknown as DbMetadata;
    getConnectedInputMetadataMock.mockImplementation((inputName: string) => {
      if (inputName === 'connection') {
        return clickhouseConnectionMetadata;
      }
      if (inputName === 'df') {
        return dataframeMetadata;
      }
      return null;
    });

    const harness = renderStepHarness({
      activeStep: 'write',
      initialInputData: {
        ...newTableInputData,
        column_mapping: buildRequestedColumnMappingDraft({
          dataframeMetadata,
        }),
      },
      initialSharedState: {
        isTableNew: true,
        selectedCreationMode: 'typed',
        inputConnectionMetadata: clickhouseConnectionMetadata,
        inputDataframeMetadata: dataframeMetadata,
      },
    });
    const errorMessage =
      'Для ClickHouse в Typed Table spec нужно заполнить Order by или Primary key.';

    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

    expect(
      harness.setValidationErrors.mock.calls.some(
        ([update]) => typeof update === 'function'
      )
    ).toBe(true);

    const invalidUpdate = [...harness.setValidationErrors.mock.calls]
      .reverse()
      .find(([update]) => typeof update === 'function')?.[0] as (
      previous: Record<string, string[]>
    ) => Record<string, string[]>;
    expect(invalidUpdate({ other: ['Сохранить'] })).toEqual({
      other: ['Сохранить'],
      table_create_spec: [errorMessage],
    });

    const callsBeforeFix = harness.setValidationErrors.mock.calls.length;
    act(() => {
      harness.getState()?.setLocalInputData(previous => ({
        ...previous,
        table_create_spec: {
          clickhouse: {
            engine_name: 'MergeTree',
            order_by: ['clientId'],
          },
        },
      }));
    });

    expect(harness.setValidationErrors.mock.calls.length).toBeGreaterThan(
      callsBeforeFix
    );

    const validUpdate = [...harness.setValidationErrors.mock.calls]
      .reverse()
      .find(([update]) => typeof update === 'function')?.[0] as (
      previous: Record<string, string[]>
    ) => Record<string, string[]>;
    expect(
      validUpdate({
        other: ['Сохранить'],
        table_create_spec: [errorMessage],
      })
    ).toEqual({ other: ['Сохранить'] });
  });

  it('persists existing-table mapping edits and does not expose the old validation toggle', async () => {
    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    const targetNameInput = screen.getByDisplayValue('client_id');
    fireEvent.change(targetNameInput, {
      target: { value: 'missing_column' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(resolveWriteColumnsPostMock).not.toHaveBeenCalled();

    fireEvent.blur(targetNameInput);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(resolveWriteColumnsPostMock).toHaveBeenCalledTimes(1);

    const state = harness.getState();
    expect(state?.localInputData.column_mapping?.[0]?.target_name).toBe(
      'missing_column'
    );
    expect(screen.queryByText('Учитывать в валидации')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Пересоздать таблицу' })
    ).toBeInTheDocument();

    harness.rerenderHarness('write');

    expect(harness.getValidationCallback()).toBeTypeOf('function');

    let isValid = true;
    await act(async () => {
      isValid = await harness.getValidationCallback()!();
    });

    expect(isValid).toBe(true);
  }, 10000);

  it('auto-resolves a dirty DB column after the 1200 ms pause', async () => {
    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    const targetNameInput = screen.getByDisplayValue('client_id');
    fireEvent.change(targetNameInput, {
      target: { value: 'client_id_debounced' },
    });

    expect(
      harness.getState()?.sharedState.columnResolveStates?.['clientid']
    ).toBe('dirty');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1199);
    });
    expect(resolveWriteColumnsPostMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(resolveWriteColumnsPostMock).toHaveBeenCalledTimes(1);
    expect(resolveWriteColumnsPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          column_mapping: expect.arrayContaining([
            expect.objectContaining({
              source_name: 'clientId',
              target_name: 'client_id_debounced',
            }),
          ]),
        }),
      }),
      { silent: true }
    );
    expect(
      harness.getState()?.sharedState.columnResolveStates?.['clientid']
    ).toBe('flash');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      harness.getState()?.sharedState.columnResolveStates?.['clientid']
    ).toBe('idle');
  }, 10000);

  it('commits immediately on Enter and rolls a draft back on Escape', async () => {
    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    const targetNameInput = screen.getByDisplayValue('client_id');
    fireEvent.focus(targetNameInput);
    fireEvent.change(targetNameInput, {
      target: { value: 'client_id_enter' },
    });
    fireEvent.keyDown(targetNameInput, { key: 'Enter' });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resolveWriteColumnsPostMock).toHaveBeenCalledTimes(1);

    fireEvent.focus(targetNameInput);
    fireEvent.change(targetNameInput, {
      target: { value: 'temporary_name' },
    });
    fireEvent.keyDown(targetNameInput, { key: 'Escape' });

    expect(targetNameInput).toHaveValue('client_id_enter');
    expect(
      harness.getState()?.sharedState.columnResolveStates?.['clientid']
    ).toBe('idle');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(resolveWriteColumnsPostMock).toHaveBeenCalledTimes(1);
  }, 10000);

  it('ignores an older resolve response after a newer column edit', async () => {
    let resolveFirstRequest:
      | ((value: { data: Record<string, unknown> }) => void)
      | undefined;
    let resolveSecondRequest:
      | ((value: { data: Record<string, unknown> }) => void)
      | undefined;

    resolveWriteColumnsPostMock
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirstRequest = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSecondRequest = resolve;
          })
      );

    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });
    const targetNameInput = screen.getByDisplayValue('client_id');

    fireEvent.change(targetNameInput, { target: { value: 'first_name' } });
    fireEvent.blur(targetNameInput);
    fireEvent.change(targetNameInput, { target: { value: 'second_name' } });
    fireEvent.blur(targetNameInput);

    expect(resolveWriteColumnsPostMock).toHaveBeenCalledTimes(2);
    const firstMapping = resolveWriteColumnsPostMock.mock.calls[0]?.[0].body
      .column_mapping as ColumnMappingItem[];
    const secondMapping = resolveWriteColumnsPostMock.mock.calls[1]?.[0].body
      .column_mapping as ColumnMappingItem[];

    await act(async () => {
      resolveSecondRequest?.({
        data: {
          columns: buildResolvedRows(secondMapping),
          diagnostics: [],
          effective_column_mapping: secondMapping,
        },
      });
      await Promise.resolve();
    });
    expect(
      harness.getState()?.localInputData.column_mapping?.[0]?.target_name
    ).toBe('second_name');

    await act(async () => {
      resolveFirstRequest?.({
        data: {
          columns: buildResolvedRows(firstMapping),
          diagnostics: [],
          effective_column_mapping: firstMapping,
        },
      });
      await Promise.resolve();
    });
    expect(
      harness.getState()?.localInputData.column_mapping?.[0]?.target_name
    ).toBe('second_name');
  }, 10000);

  it('marks an empty DB column name invalid and does not resolve it', async () => {
    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    const targetNameInput = screen.getByRole('textbox', {
      name: 'Колонка DB для clientId',
    });
    fireEvent.change(targetNameInput, { target: { value: '' } });

    expect(targetNameInput).toHaveAttribute('aria-invalid', 'true');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    fireEvent.blur(targetNameInput);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(resolveWriteColumnsPostMock).not.toHaveBeenCalled();

    harness.rerenderHarness('write');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(resolveWriteColumnsPostMock).not.toHaveBeenCalled();
  }, 10000);

  it('selects only add-column suggestions after resolving columns', async () => {
    resolveWriteColumnsPostMock.mockImplementationOnce(
      async ({
        body,
      }: {
        body: { column_mapping?: ColumnMappingItem[] | null };
      }) => {
        const effectiveMapping = body.column_mapping ?? [];
        const rows = buildResolvedRows(effectiveMapping).map(row =>
          row.source_name === 'clientId'
            ? {
                ...row,
                suggested_action: {
                  type: 'add_column' as const,
                  column_name: 'missing_column',
                  column: {
                    name: 'missing_column',
                    dtype: 'INT' as const,
                    nullable: false,
                  },
                },
              }
            : row
        );

        rows.push({
          source_name: null,
          requested_target_name: null,
          effective_target_name: null,
          db_name: 'legacy_column',
          dtype: 'INT',
          nullable: true,
          status: 'missing_in_dataframe',
          reason: 'legacy_column missing in DF',
          suggested_action: {
            type: 'drop_column',
            column_name: 'legacy_column',
            column: null,
          },
        });

        return {
          data: {
            columns: rows,
            diagnostics: [],
            effective_column_mapping: effectiveMapping,
          },
        };
      }
    );

    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    const targetNameInput = screen.getByDisplayValue('client_id');
    fireEvent.change(targetNameInput, {
      target: { value: 'missing_column' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(resolveWriteColumnsPostMock).not.toHaveBeenCalled();

    fireEvent.blur(targetNameInput);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(harness.getState()?.sharedState.selectedColumnActions).toEqual([
      {
        type: 'add_column',
        column_name: 'missing_column',
        column: {
          name: 'missing_column',
          dtype: 'INT',
          nullable: false,
        },
      },
    ]);

    expect(
      screen.getByRole('columnheader', { name: 'NULL' })
    ).toBeInTheDocument();
    const nullableCheckbox = screen.getByRole('checkbox', {
      name: 'Nullable for missing_column',
    });
    expect(nullableCheckbox).not.toBeChecked();
    expect(
      screen.queryByRole('checkbox', { name: 'Nullable for legacy_column' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Nullable for legacy_column: NULL')
    ).toBeInTheDocument();

    fireEvent.click(nullableCheckbox);

    expect(
      harness.getState()?.sharedState.selectedColumnActions?.[0]?.column
        ?.nullable
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Будет создана' }));

    expect(
      screen.queryByRole('checkbox', { name: 'Nullable for missing_column' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Nullable for missing_column: NOT NULL')
    ).toBeInTheDocument();
  }, 10000);

  it('confirms, recreates, updates metadata and resolves the refreshed table', async () => {
    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState({
        selectedColumnActions: [
          {
            type: 'add_column',
            column_name: 'new_column',
            column: null,
          },
        ],
      }),
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Пересоздать таблицу' })
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ confirmColor: 'error' })
    );
    expect(recreateTablePostMock).toHaveBeenCalledWith(
      {
        body: expect.objectContaining({
          table_name: 'orders',
          database_name: 'analytics',
          schema_name: 'public',
          table_create_spec: null,
          columns: [
            expect.objectContaining({
              name: 'client_id',
              dtype: 'INT',
              nullable: false,
            }),
            expect.objectContaining({
              name: 'event_time',
              dtype: 'DATETIME',
              nullable: false,
            }),
          ],
        }),
      },
      { silent: true }
    );
    expect(screen.getByText('Пересоздание таблицы...')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(resolveWriteColumnsPostMock).toHaveBeenCalled();
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'nodeMetadata/setOutputMetadata' })
    );
    expect(harness.getState()?.sharedState.selectedColumnActions).toEqual([]);
    expect(harness.getState()?.sharedState.isRecreatingTable).toBe(false);
  }, 10000);

  it('does not recreate the table when confirmation is cancelled', async () => {
    confirmMock.mockResolvedValueOnce(false);
    renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Пересоздать таблицу' })
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(recreateTablePostMock).not.toHaveBeenCalled();
  }, 10000);

  it('keeps current metadata and shows the recreate error', async () => {
    recreateTablePostMock.mockRejectedValueOnce(new Error('recreate failed'));
    renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Пересоздать таблицу' })
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('recreate failed')).toBeInTheDocument();
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(resolveWriteColumnsPostMock).not.toHaveBeenCalled();
  }, 10000);

  it('keeps refreshed metadata when resolve fails after recreate', async () => {
    resolveWriteColumnsPostMock.mockRejectedValueOnce(
      new Error('resolve failed')
    );
    const harness = renderStepHarness({
      activeStep: 'schema',
      initialInputData: existingTableInputData,
      initialSharedState: buildExistingTableSharedState(),
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Пересоздать таблицу' })
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'nodeMetadata/setOutputMetadata' })
    );
    expect(screen.getByText('resolve failed')).toBeInTheDocument();
    expect(harness.getState()?.sharedState.isRecreatingTable).toBe(false);
  }, 10000);
});
