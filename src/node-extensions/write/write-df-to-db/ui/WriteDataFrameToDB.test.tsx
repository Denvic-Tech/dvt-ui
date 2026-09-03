import { type ReactNode, useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WriteDataFrameToDB } from './WriteDataFrameToDB';

const DATAFRAME_METADATA = {
  columns: [
    { name: 'id', dtype: 'int64', index: true },
    { name: 'name', dtype: 'string', index: false },
  ],
};

const CONNECTION_METADATA = {
  connection_id: 'connection-postgres',
  dialect: 'postgresql',
  tables: [
    {
      name: 'orders',
      database_name: null,
      schema_name: 'public',
      columns: [
        { name: 'id', dtype: 'BIGINT' },
        { name: 'name', dtype: 'TEXT' },
      ],
    },
  ],
};

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showNotification: vi.fn() }),
}));

vi.mock('@/entities/data/db-connection/model/hooks/useDbCatalog', () => ({
  useDbCatalogTable: () => ({ item: null }),
}));

vi.mock('@/shared/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
}));

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: (inputName: string) => {
      if (inputName === 'df') return DATAFRAME_METADATA;
      if (inputName === 'connection') return CONNECTION_METADATA;
      return null;
    },
    getConnectedInputNodeID: () => 'connection-node-1',
  }),
}));

vi.mock('@/entities/project/project-cache', () => ({
  useProjectCache: () => ({
    clearMetadataCache: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

vi.mock('@/entities/project/projects', () => ({
  useCurrentProject: () => ({ currentProject: null }),
}));

vi.mock('@/entities/data/database', () => ({
  TablesViewsList: () => <div data-testid='tables-views-list' />,
}));

vi.mock('@/entities/data/dataframe', () => ({
  ColumnDropdownSelect: () => <div data-testid='column-dropdown-select' />,
}));

vi.mock('@/shared/ui', () => ({
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/shared/icons', () => ({
  SchemaIcon: () => <span data-testid='schema-icon' />,
}));

type ValidationFn = () => Promise<boolean>;

const nodeDefinition = {
  input_definitions: {
    write_mode: {
      options: ['append', 'truncate'],
    },
    chunksize: {},
    min_batch_rows: {},
  },
};

const baseInputData = {
  database_name: null,
  schema_name: 'public',
  chunksize: 1000,
  min_batch_rows: 5000,
  index_col: 'id',
  write_mode: 'append',
  create_table_sql: '',
};

const renderEditor = (initialLocalInputData: Record<string, unknown>) => {
  let validationCallback: ValidationFn | undefined;
  const setValidationErrors = vi.fn();

  const Wrapper = () => {
    const [localInputData, setLocalInputData] = useState(initialLocalInputData);

    return (
      <WriteDataFrameToDB
        projectID='project-1'
        id='node-1'
        data={{} as never}
        nodeDefinition={nodeDefinition as never}
        isOpen
        localInputData={localInputData as never}
        setLocalInputData={setLocalInputData as never}
        setValidationCallback={(nextValue: unknown) => {
          validationCallback =
            typeof nextValue === 'function'
              ? (nextValue as () => ValidationFn)()
              : (nextValue as ValidationFn | undefined);
        }}
        setValidationErrors={setValidationErrors}
        variables={[]}
      />
    );
  };

  return {
    ...render(<Wrapper />),
    getValidationCallback: () => validationCallback,
    setValidationErrors,
  };
};

describe('WriteDataFrameToDB', () => {
  it('renders literal table values and keeps diff panel available', () => {
    renderEditor({
      ...baseInputData,
      table_name: 'orders',
    });

    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(
      screen.getByText('Сопоставление и валидация столбцов')
    ).toBeInTheDocument();
  });

  it('renders expression selector values without crashing and skips diff lookup', async () => {
    const { getValidationCallback } = renderEditor({
      ...baseInputData,
      table_name: {
        __dvt_type: 'expr',
        value: 'target_table',
        expression_kind: 'single',
      },
    });

    expect(screen.getByText('Expression')).toBeInTheDocument();
    expect(
      screen.queryByText('Сопоставление и валидация столбцов')
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getValidationCallback()).toBeTypeOf('function');
    });

    let isValid = false;
    await act(async () => {
      isValid = await getValidationCallback()!();
    });

    expect(isValid).toBe(true);
  });

  it('rejects empty expression selector values during validation', async () => {
    const { getValidationCallback, setValidationErrors } = renderEditor({
      ...baseInputData,
      table_name: {
        __dvt_type: 'expr',
        value: '   ',
        expression_kind: 'single',
      },
    });

    await waitFor(() => {
      expect(getValidationCallback()).toBeTypeOf('function');
    });

    let isValid = true;
    await act(async () => {
      isValid = await getValidationCallback()!();
    });

    expect(isValid).toBe(false);
    expect(setValidationErrors).toHaveBeenLastCalledWith(
      expect.objectContaining({
        table: ['Не выбрана таблица для записи.'],
      })
    );
  });
});
