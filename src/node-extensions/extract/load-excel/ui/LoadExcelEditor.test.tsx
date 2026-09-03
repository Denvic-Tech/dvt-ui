import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoadExcelEditor, type LoadExcelValues } from './LoadExcelEditor';

const { setValidationCallbackMock } = vi.hoisted(() => ({
  setValidationCallbackMock: vi.fn(),
}));

vi.mock('@/features/node/file-storage-target-path', () => ({
  FileStorageConnectionFields: () => <div data-testid='connection-fields' />,
  FileStorageTargetPathSection: ({ errorText }: { errorText?: string }) => (
    <div data-testid='path-error'>{errorText}</div>
  ),
}));

vi.mock(
  '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers',
  () => ({
    buildResolvedFileStoragePickerState: () => ({
      resolvedPathValue: null,
    }),
  })
);

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: () => null,
  }),
}));

vi.mock('@/features/node/node-file-input', () => ({
  formatNodeFileSize: () => '',
  getNodeFileInputErrorMessage: () => 'Ошибка загрузки',
  getUploadedFileDisplayName: () => null,
  hasNodeFileInputSource: () => false,
  isAcceptedNodeFile: () => true,
  NodeFileUploadField: () => <div data-testid='upload-field' />,
  useNodeFileInput: () => ({ uploadNodeFileInput: vi.fn() }),
}));

vi.mock('@/entities/data/db-connection', () => ({
  useConnections: () => ({ getConnectionById: () => null }),
}));

const nodeDefinition = {
  name: 'LoadExcel',
  input_definitions: {
    path: { attr_name: 'path' },
    sheet_name: { attr_name: 'sheet_name', default: '0' },
    header_row: { attr_name: 'header_row', default: 0 },
    decimal: { attr_name: 'decimal', default: '.' },
  },
};

const renderEditor = (
  initialValues: LoadExcelValues = { path: 'data.xlsx' }
) => {
  const Wrapper = () => {
    const [values, setValues] = useState<LoadExcelValues>(initialValues);

    return (
      <>
        <LoadExcelEditor
          projectID='project-1'
          id='node-1'
          data={{} as any}
          nodeDefinition={nodeDefinition as any}
          isOpen
          localInputData={values}
          setLocalInputData={setValues}
          setValidationCallback={setValidationCallbackMock}
          variables={[]}
        />
        <output data-testid='values'>{JSON.stringify(values)}</output>
      </>
    );
  };

  return render(<Wrapper />);
};

const getValidationCallback = (): (() => boolean) => {
  const lastCall =
    setValidationCallbackMock.mock.calls[
      setValidationCallbackMock.mock.calls.length - 1
    ];
  const callbackFactory = lastCall?.[0] as (() => () => boolean) | undefined;

  if (!callbackFactory) {
    throw new Error('Validation callback was not registered');
  }

  return callbackFactory();
};

describe('LoadExcelEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes numeric defaults without replacing existing node values', async () => {
    renderEditor({ path: 'data.xlsx', sheet_name: 'Отчёт' });

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent(
        JSON.stringify({
          path: 'data.xlsx',
          sheet_name: 'Отчёт',
          dtypes: null,
          thousands: null,
          decimal: '.',
        })
      );
    });

    expect(screen.getByLabelText('Имя листа')).toHaveValue('Отчёт');
    expect(screen.getByLabelText('Строка заголовка')).toHaveValue(0);
  });

  it('preserves exact dtype names and blocks exact duplicates', async () => {
    renderEditor();

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent('"decimal":"."');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Добавить тип' }));
    fireEvent.change(screen.getByLabelText('Имя колонки 1'), {
      target: { value: 'Amount' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"dtypes":{"Amount":"string"}'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Добавить тип' }));
    fireEvent.change(screen.getByLabelText('Имя колонки 2'), {
      target: { value: 'Amount' },
    });

    expect(screen.getAllByText('Имя колонки уже используется')).toHaveLength(2);
    expect(getValidationCallback()()).toBe(false);

    fireEvent.change(screen.getByLabelText('Имя колонки 2'), {
      target: { value: 'amount' },
    });

    await waitFor(() => {
      expect(getValidationCallback()()).toBe(true);
    });
  });

  it('writes separator values and blocks equal separators', async () => {
    renderEditor();

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent('"decimal":"."');
    });

    fireEvent.mouseDown(screen.getByLabelText('Разделитель тысяч'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Запятая ( , )' })
    );
    fireEvent.mouseDown(screen.getByLabelText('Десятичный разделитель'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Запятая ( , )' })
    );

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"thousands":",","decimal":","'
      );
    });
    expect(getValidationCallback()()).toBe(false);
    expect(
      screen.getAllByText('Разделители тысяч и дробной части должны отличаться')
    ).toHaveLength(2);

    fireEvent.mouseDown(screen.getByLabelText('Разделитель тысяч'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Не использовать' })
    );

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"thousands":null,"decimal":","'
      );
      expect(getValidationCallback()()).toBe(true);
    });
  });

  it('keeps path, usecols, header, and timeout validation active', async () => {
    renderEditor({
      path: 'data.txt',
      usecols: ['amount'],
      usecols_range: 'A:D',
      header_row: -1,
      read_timeout_sec: 0,
    });

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent('"decimal":"."');
    });

    expect(getValidationCallback()()).toBe(false);

    await waitFor(() => {
      expect(screen.getByTestId('path-error')).toHaveTextContent(
        'Путь должен заканчиваться на .xlsx, .xls или .xlsm'
      );
      expect(
        screen.getByText(
          'Нельзя указывать и список колонок, и диапазон одновременно'
        )
      ).toBeVisible();
      expect(screen.getByText('Должно быть целым числом ≥ 0')).toBeVisible();
      expect(screen.getByText('Должно быть целым числом ≥ 1')).toBeVisible();
    });
  });
});
