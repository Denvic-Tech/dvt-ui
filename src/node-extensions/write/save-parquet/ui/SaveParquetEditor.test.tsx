import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeExpressionValue } from '@/shared/lib/node-input-values';

import { SaveParquetEditor } from './SaveParquetEditor';
import type { SaveParquetValues } from './SaveParquetEditor.helpers';

vi.mock('@/features/node/file-storage-target-path', () => ({
  FileStorageConnectionFields: () => <div data-testid='connection-fields' />,
  FileStorageTargetPathSection: ({
    mode,
    modeOptions,
    onModeChange,
    footerText,
  }: {
    mode?: string;
    modeOptions?: ReadonlyArray<{
      value: string;
      label: string;
      disabled?: boolean;
      disabledReason?: string;
    }>;
    onModeChange?: (nextMode: string) => void;
    footerText?: React.ReactNode;
  }) => (
    <div>
      <div data-testid='path-layout'>{mode}</div>
      {modeOptions?.map(option => (
        <button
          key={option.value}
          type='button'
          disabled={option.disabled}
          title={option.disabledReason}
          onClick={() => onModeChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
      <div data-testid='path-footer'>{footerText}</div>
    </div>
  ),
}));

vi.mock(
  '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers',
  () => ({
    buildResolvedFileStoragePickerState: () => ({ resolvedPathValue: null }),
  })
);

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({ getConnectedInputMetadata: () => null }),
}));

vi.mock('@/entities/data/db-connection', () => ({
  useConnections: () => ({ getConnectionById: () => null }),
}));

vi.mock('@/entities/data/dataframe', () => ({
  ColumnDropdownSelect: () => <div data-testid='column-dropdown' />,
}));

const nodeDefinition = {
  name: 'SaveParquet',
  input_definitions: {
    path: { attr_name: 'path', type: 'STRING' },
    mode: {
      attr_name: 'mode',
      type: 'STRING',
      default: 'create',
      options: ['create', 'overwrite', 'append'],
      allow_expressions: true,
    },
    compression: {
      attr_name: 'compression',
      type: 'STRING',
      default: 'snappy',
      options: ['snappy', 'zstd'],
      allow_expressions: true,
    },
    filename_template: {
      attr_name: 'filename_template',
      type: 'STRING',
      allow_expressions: true,
    },
    row_cap: { attr_name: 'row_cap', type: 'INT', allow_expressions: true },
    partition_on: {
      attr_name: 'partition_on',
      type: 'COLUMN_NAME',
      is_list_type: true,
      allow_expressions: true,
    },
    write_index: {
      attr_name: 'write_index',
      type: 'BOOLEAN',
      allow_expressions: true,
    },
  },
};

const renderEditor = (initialValues: SaveParquetValues) => {
  const Wrapper = () => {
    const [values, setValues] = useState<SaveParquetValues>(initialValues);
    return (
      <>
        <SaveParquetEditor
          projectID='project-1'
          id='node-1'
          data={{} as any}
          nodeDefinition={nodeDefinition as any}
          isOpen
          localInputData={values}
          setLocalInputData={setValues}
          setValidationCallback={vi.fn()}
          variables={[]}
        />
        <output data-testid='values'>{JSON.stringify(values)}</output>
      </>
    );
  };
  return render(<Wrapper />);
};

describe('SaveParquetEditor', () => {
  it.each([
    ['legacy', true],
    ['new', false],
    [undefined, false],
  ] as const)(
    'normalizes compatibility_mode=%s to new and warns only for persisted legacy',
    async (compatibilityMode, warningExpected) => {
      const initialValues: SaveParquetValues = {
        path: 'reports/orders.parquet',
        mode: 'create',
        filename_template: null,
      };
      if (compatibilityMode !== undefined) {
        initialValues.compatibility_mode = compatibilityMode;
      }
      renderEditor(initialValues);

      await waitFor(() => {
        expect(screen.getByTestId('values')).toHaveTextContent(
          '"compatibility_mode":"new"'
        );
      });

      const warning = screen.queryByText(/legacy-механизм записи Parquet/);
      expect(Boolean(warning)).toBe(warningExpected);
    }
  );

  it('hydrates legacy row_cap as new Advanced with a materialized filename template and warning', async () => {
    renderEditor({
      compatibility_mode: 'legacy',
      path: 'reports/orders.parquet',
      row_cap: 100,
    });

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"compatibility_mode":"new"'
      );
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"filename_template":"<increment>.parquet"'
      );
      expect(screen.getByTestId('path-layout')).toHaveTextContent('advanced');
    });
    expect(screen.getByText(/legacy-механизм записи Parquet/)).toBeVisible();
  });

  it.each([
    [{ mode: 'append' as const }, 'append'],
    [{ mode: makeExpressionValue('runtime_mode', 'single') }, 'expression'],
  ])(
    'materializes the Advanced filename template for %s configuration',
    async (advancedValues, _label) => {
      renderEditor({
        path: 'reports/orders',
        compatibility_mode: 'new',
        ...advancedValues,
      });

      await waitFor(() => {
        expect(screen.getByTestId('path-layout')).toHaveTextContent('advanced');
        expect(screen.getByTestId('values')).toHaveTextContent(
          '"filename_template":"<increment>.parquet"'
        );
      });
    }
  );

  it('keeps the exact Simple contract Simple during hydration', async () => {
    renderEditor({
      path: 'reports/orders.parquet',
      mode: 'create',
      row_cap: null,
      partition_on: null,
      filename_template: null,
      compatibility_mode: 'new',
    });

    await waitFor(() => {
      expect(screen.getByTestId('path-layout')).toHaveTextContent('simple');
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"filename_template":null'
      );
    });
  });

  it('switches Simple configuration to Advanced when mode enters expression mode', async () => {
    renderEditor({
      path: 'reports/orders.parquet',
      mode: 'create',
      filename_template: null,
      compatibility_mode: 'new',
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Режим выражения: Режим записи (mode)',
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId('path-layout')).toHaveTextContent('advanced');
      const values = screen.getByTestId('values').textContent ?? '';
      expect(values).toContain('"path":"reports/orders"');
      expect(values).toContain('"filename_template":"<increment>.parquet"');
      expect(values).toContain('"expression_kind":"single"');
    });
  });

  it('disables Simple for expression mode and preserves advanced settings', async () => {
    const mode = makeExpressionValue('runtime_mode', 'single');
    renderEditor({
      path: 'reports/orders',
      mode,
      filename_template: '<increment>.parquet',
      row_cap: 100,
      partition_on: ['country'],
      compatibility_mode: 'new',
    });

    const simpleButton = screen.getByRole('button', { name: 'Simple' });
    expect(simpleButton).toBeDisabled();
    expect(simpleButton).toHaveAttribute(
      'title',
      expect.stringContaining('expression может разрешиться в append')
    );

    fireEvent.click(simpleButton);

    await waitFor(() => {
      expect(screen.getByTestId('path-layout')).toHaveTextContent('advanced');
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"filename_template":"<increment>.parquet"'
      );
      expect(screen.getByTestId('values')).toHaveTextContent('"row_cap":100');
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"partition_on":["country"]'
      );
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"expression_kind":"single"'
      );
    });
  });

  it('shows Advanced path semantics when path is an expression', () => {
    renderEditor({
      path: makeExpressionValue('runtime_path', 'single'),
      mode: 'overwrite',
      filename_template: '<increment>.parquet',
      compatibility_mode: 'new',
    });

    expect(screen.getByTestId('path-footer')).toHaveTextContent(
      'Expression должен вернуть путь к каталогу dataset без суффикса .parquet.'
    );
    expect(screen.getByTestId('path-footer')).toHaveTextContent(
      'reports/orders, а не reports/orders.parquet'
    );
  });
});
