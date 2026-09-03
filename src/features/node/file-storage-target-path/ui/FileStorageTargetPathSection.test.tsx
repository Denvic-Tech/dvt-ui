import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileStorageTargetPathSection } from './FileStorageTargetPathSection';

const openPickerMock = vi.fn();

vi.mock('@/entities/node/file-storage-manager-viewer', () => ({
  useFileStorageManagerViewer: () => ({
    openPicker: openPickerMock,
  }),
}));

vi.mock('@/shared/ui/node-input', () => ({
  filterVariablesByTypes: (variables: unknown[]) => variables,
  HighlightedSingleLineFieldV2: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (nextValue: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid='expression-input'
      value={value}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
    />
  ),
}));

vi.mock('@/shared/ui/node-input/HighlightedSingleLineField.shared', () => ({
  CODE_FONT_FAMILY: 'monospace',
  buildExpressionAutocompleteCatalog: () => ({ itemsByKind: { global: [] } }),
  getInlineExpressionDiagnostics: () => [],
}));

vi.mock('@/shared/ui/node-input/useExpressionsConfigContext', () => ({
  useExpressionsConfigContext: () => ({
    expressionsConfig: null,
  }),
}));

const baseInputDefinition = {
  attr_name: 'path',
  allow_expressions: true,
  default: '',
  display_name: 'Path',
  display_type: 'STRING',
  expression_policy: 'default',
  force_handle_visible: false,
  is_hidden: false,
  is_list_type: false,
  is_literal_type: false,
  metadata_source_field: null,
  multiline: false,
  optional: true,
  options: null,
  schema: null,
  step: null,
  round_val: null,
  min_value: null,
  max_value: null,
  type: 'STRING',
} as const;

const basePickerState = {
  canBrowse: true,
  connectionContext: null,
  connectionID: 'conn-1',
  connectionRoot: 'bucket/root',
  connectionType: 's3',
  disabledReason: 'Picker is disabled',
  resolvedPathValue: 'reports/current.csv',
} as const;

describe('FileStorageTargetPathSection', () => {
  beforeEach(() => {
    openPickerMock.mockReset();
  });

  it('opens picker with provided config and maps the selected path', async () => {
    openPickerMock.mockResolvedValueOnce({
      path: 'reports/2026',
      nodeType: 'folder',
    });

    const onChange = vi.fn();

    render(
      <FileStorageTargetPathSection
        inputDefinition={baseInputDefinition}
        value='reports/current.csv'
        onChange={onChange}
        variables={[]}
        connectionMetadata={null}
        pickerState={basePickerState}
        extension='.csv'
        allowedFileExts={['csv']}
        title='CSV path'
        description='Choose path'
        pickerKind='generic'
        pickerSelectionMode='folder'
        pickerSelectedPath='reports'
        pickerTitle='Pick CSV folder'
        pickerDescription='Choose folder'
        pickerConfirmLabel='Use path'
        browseTooltip='Pick folder'
        mapPickerSelectionToValue={selection => `${selection.path}/*.csv`}
      />
    );

    expect(screen.getByText('Choose path')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Обзор' }));

    await waitFor(() =>
      expect(openPickerMock).toHaveBeenCalledWith({
        allowedFileExts: ['csv'],
        confirmLabel: 'Use path',
        connectionContext: null,
        connectionID: 'conn-1',
        description: 'Choose folder',
        extension: '.csv',
        kind: 'generic',
        selectedPath: 'reports',
        selectionMode: 'folder',
        title: 'Pick CSV folder',
      })
    );

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('reports/2026/*.csv')
    );
  });

  it('supports mode switching and expression mode toggling', () => {
    const onModeChange = vi.fn();

    const Wrapper = () => {
      const [value, setValue] = React.useState<unknown>('reports/file.csv');

      return (
        <FileStorageTargetPathSection
          inputDefinition={baseInputDefinition}
          value={value}
          onChange={setValue}
          variables={[]}
          connectionMetadata={null}
          pickerState={basePickerState}
          extension='.csv'
          allowedFileExts={['csv']}
          mode='single'
          modeOptions={[
            { value: 'single', label: 'Single' },
            { value: 'pattern', label: 'Pattern' },
          ]}
          onModeChange={onModeChange}
        />
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByRole('button', { name: 'Pattern' }));
    expect(onModeChange).toHaveBeenCalledWith('pattern');

    fireEvent.click(screen.getByRole('button', { name: 'Режим выражения' }));
    expect(screen.getByTestId('expression-input')).toHaveValue(
      '="reports/file.csv"'
    );
  });

  it('renders a disabled mode option with an explanation', () => {
    const onModeChange = vi.fn();

    render(
      <FileStorageTargetPathSection
        inputDefinition={baseInputDefinition}
        value='reports/file.csv'
        onChange={vi.fn()}
        variables={[]}
        connectionMetadata={null}
        pickerState={basePickerState}
        extension='.csv'
        allowedFileExts={['csv']}
        mode='advanced'
        modeOptions={[
          {
            value: 'simple',
            label: 'Simple',
            disabled: true,
            disabledReason: 'Simple unavailable',
          },
          { value: 'advanced', label: 'Advanced' },
        ]}
        onModeChange={onModeChange}
      />
    );

    const simpleButton = screen.getByRole('button', { name: 'Simple' });
    expect(simpleButton).toBeDisabled();
    fireEvent.click(simpleButton);
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('renders disabled browse state and footer text', () => {
    render(
      <FileStorageTargetPathSection
        inputDefinition={baseInputDefinition}
        value='reports/file.csv'
        onChange={vi.fn()}
        variables={[]}
        connectionMetadata={null}
        pickerState={{
          ...basePickerState,
          canBrowse: false,
          disabledReason: 'Connect storage first',
        }}
        extension='.csv'
        allowedFileExts={['csv']}
        footerText='Базовый путь подключения: bucket/root'
      />
    );

    expect(screen.getByRole('button', { name: 'Обзор' })).toBeDisabled();
    expect(
      screen.getByText('Базовый путь подключения: bucket/root')
    ).toBeInTheDocument();
  });
});
