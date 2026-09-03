import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { host } from './exposeExtensionHost';

const openPickerMock = vi.fn();
const getConnectionByIdMock = vi.fn();

vi.mock('@/entities/data/db-connection', () => ({
  useConnections: () => ({
    getConnectionById: getConnectionByIdMock,
  }),
}));

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

const nodeDefinition = {
  input_definitions: {
    connection_overrides: {
      allow_expressions: true,
      expression_policy: 'default',
      schema: {
        oneOf: [
          {
            properties: {
              type: { const: 's3' },
              bucket: { title: 'Bucket' },
              prefix: { title: 'Prefix' },
            },
          },
        ],
      },
    },
    source_pattern: {
      attr_name: 'source_pattern',
      allow_expressions: true,
      default: '',
      display_name: 'source_pattern',
      display_type: 'STRING',
      expression_policy: 'default',
      force_handle_visible: false,
      is_hidden: false,
      is_list_type: false,
      is_literal_type: false,
      metadata_source_field: null,
      multiline: false,
      optional: false,
      options: null,
      schema: null,
      step: null,
      round_val: null,
      min_value: null,
      max_value: null,
      type: 'STRING',
    },
    target_path: {
      attr_name: 'target_path',
      allow_expressions: true,
      default: '',
      display_name: 'target_path',
      display_type: 'STRING',
      expression_policy: 'default',
      force_handle_visible: false,
      is_hidden: false,
      is_list_type: false,
      is_literal_type: false,
      metadata_source_field: null,
      multiline: false,
      optional: false,
      options: null,
      schema: null,
      step: null,
      round_val: null,
      min_value: null,
      max_value: null,
      type: 'STRING',
    },
  },
} as const;

const connectionMetadata = {
  type: 'S3',
  connection_id: 'conn-1',
  connection_prefix: 'landing',
  bucket: {
    name: 'raw-bucket',
  },
} as const;

const connectionRecord = {
  id: 'conn-1',
  name: 'Raw S3',
  kind: 'file',
  type: 's3',
  driver: null,
  driver_options: null,
  properties: {
    bucket: 'raw-bucket',
    prefix: 'landing',
  },
  labels: null,
  metadata: null,
  created_at: null,
  updated_at: null,
  deleted_at: null,
  user_id: null,
  organization_id: null,
  issues: [] as Array<never>,
  raw_properties: null,
  raw_driver_options: null,
  raw_secrets: null,
} as const;

const isPatternPath = (path: string) =>
  Array.from(path).some(char => '*?['.includes(char));

const register = (extensionHost: typeof host) => {
  const fileStorage = extensionHost.capabilities?.fileStorage;
  const repackNode = extensionHost.capabilities?.nodes?.repackS3Parquet;

  if (!fileStorage || !repackNode) {
    throw new Error('Required host capabilities are missing');
  }

  const Editor = ({
    nodeDefinition,
    localInputData,
    setLocalInputData,
    variables,
    getConnectedInputMetadata,
  }: any) => {
    const [sourcePatternMode, setSourcePatternMode] = React.useState<
      'directory' | 'pattern'
    >(() =>
      isPatternPath(
        typeof localInputData.source_pattern === 'string'
          ? localInputData.source_pattern
          : ''
      )
        ? 'pattern'
        : 'directory'
    );

    const { connectionMetadata, connectionRecord } =
      fileStorage.hooks.useConnectionContext({
        getConnectedInputMetadata,
        inputName: 'connection',
      });

    const update = React.useCallback(
      (patch: Record<string, unknown>) =>
        setLocalInputData((prev: Record<string, unknown>) => ({
          ...prev,
          ...patch,
        })),
      [setLocalInputData]
    );

    React.useEffect(() => {
      const nextMode = isPatternPath(
        typeof localInputData.source_pattern === 'string'
          ? localInputData.source_pattern
          : ''
      )
        ? 'pattern'
        : 'directory';
      setSourcePatternMode(nextMode);
    }, [localInputData.source_pattern]);

    const sourcePatternPickerState = React.useMemo(
      () =>
        fileStorage.helpers.buildResolvedPickerState({
          connectionMetadata,
          connectionOverrides: localInputData.connection_overrides,
          connectionRecord,
          nodeDefinition,
          pathLabel: 'Source pattern',
          pathValue: localInputData.source_pattern,
          variables,
        }),
      [
        connectionMetadata,
        connectionRecord,
        localInputData.connection_overrides,
        localInputData.source_pattern,
        nodeDefinition,
        variables,
      ]
    );

    return (
      <>
        <fileStorage.components.FileStorageConnectionFields
          connectionMetadata={connectionMetadata}
          connectionRecord={connectionRecord}
          nodeDefinition={nodeDefinition}
          value={localInputData.connection_overrides}
          onChange={(nextValue: unknown) =>
            update({ connection_overrides: nextValue })
          }
          variables={variables}
        />

        <fileStorage.components.FileStorageTargetPathSection
          inputDefinition={nodeDefinition.input_definitions.source_pattern}
          value={localInputData.source_pattern ?? ''}
          onChange={(nextValue: unknown) =>
            update({ source_pattern: nextValue })
          }
          variables={variables}
          connectionMetadata={connectionMetadata}
          pickerState={sourcePatternPickerState}
          extension='.parquet'
          pickerExtension={null}
          allowedFileExts={['parquet']}
          title={
            sourcePatternMode === 'directory'
              ? 'Source directory'
              : 'Source pattern'
          }
          pickerKind='generic'
          pickerSelectionMode='folder'
          pickerSelectedPath={
            sourcePatternMode === 'directory'
              ? sourcePatternPickerState.resolvedPathValue
              : repackNode.helpers.getSourcePatternPickerSelectedPath(
                  sourcePatternPickerState.resolvedPathValue
                )
          }
          pickerTitle={
            sourcePatternMode === 'directory'
              ? 'Pick source directory'
              : 'Pick pattern folder'
          }
          browseTooltip='Pick path'
          mode={sourcePatternMode}
          modeOptions={[
            { value: 'directory', label: 'Directory' },
            { value: 'pattern', label: 'Pattern' },
          ]}
          onModeChange={(nextMode: string) =>
            setSourcePatternMode(nextMode as 'directory' | 'pattern')
          }
          mapPickerSelectionToValue={(selection: { path?: string | null }) => {
            if (sourcePatternMode === 'directory') {
              return selection.path;
            }

            return repackNode.helpers.buildParquetPatternFromFolder(
              selection.path || ''
            );
          }}
        />
      </>
    );
  };

  return {
    editors: {
      RepackS3Parquet: Editor,
    },
  };
};

describe('exposeExtensionHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnectionByIdMock.mockReturnValue(connectionRecord);
  });

  it('exposes structured file-storage and RepackS3Parquet capabilities', () => {
    const fileStorage = host.capabilities?.fileStorage;
    const repackNode = host.capabilities?.nodes?.repackS3Parquet;

    expect(fileStorage).toBeDefined();
    expect(repackNode).toBeDefined();

    const metadata = fileStorage?.helpers.getConnectedInputMetadata({
      getConnectedInputMetadata: inputName =>
        inputName === 'connection' ? (connectionMetadata as any) : null,
    });

    expect(metadata).toEqual(connectionMetadata);

    const pickerState = fileStorage?.helpers.buildResolvedPickerState({
      connectionMetadata: metadata ?? null,
      connectionOverrides: {
        type: 's3',
        bucket: 'custom-bucket',
        prefix: 'daily',
      },
      connectionRecord,
      nodeDefinition: nodeDefinition as any,
      pathValue: 'incoming/2026/*.parquet',
      variables: [],
    });

    expect(pickerState?.canBrowse).toBe(true);
    expect(pickerState?.connectionRoot).toBe('s3://custom-bucket/daily');
    expect(
      repackNode?.helpers.buildParquetPatternFromFolder('incoming/2026')
    ).toBe('incoming/2026/*.parquet');
  });

  it('supports external register(host) editor flow with browse UX', async () => {
    openPickerMock.mockResolvedValueOnce({
      path: 'incoming/2026',
      nodeType: 'folder',
    });

    const registry = register(host);
    const Editor = registry.editors.RepackS3Parquet;

    const Wrapper = () => {
      const [localInputData, setLocalInputData] = React.useState({
        connection_overrides: null,
        source_pattern: 'incoming/current/*.parquet',
      });

      return (
        <Editor
          id='node-1'
          data={{} as any}
          isOpen
          nodeDefinition={nodeDefinition as any}
          localInputData={localInputData}
          setLocalInputData={setLocalInputData}
          variables={[]}
          getConnectedInputMetadata={(inputName: string) =>
            inputName === 'connection' ? (connectionMetadata as any) : null
          }
        />
      );
    };

    render(<Wrapper />);

    fireEvent.click(
      screen
        .getByLabelText('Pick path')
        .querySelector('button') as HTMLButtonElement
    );

    await waitFor(() =>
      expect(openPickerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionID: 'conn-1',
          selectionMode: 'folder',
          title: 'Pick pattern folder',
        })
      )
    );

    await waitFor(() =>
      expect(
        screen.getByDisplayValue('incoming/2026/*.parquet')
      ).toBeInTheDocument()
    );
  });
});
