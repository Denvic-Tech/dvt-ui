import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JsonMetadata, NodeDefinition } from '@/shared/gatewayClient';

import type { JsonEditorValues } from './editorTypes';
import { JsonEditorEditor } from './JsonEditorEditor';

const { connectedMetadataByInputNameRef, getConnectedInputMetadataMock } =
  vi.hoisted(() => ({
    connectedMetadataByInputNameRef: {
      current: {} as Record<string, unknown>,
    },
    getConnectedInputMetadataMock: vi.fn(),
  }));

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    connectedMetadataByInputName: connectedMetadataByInputNameRef.current,
    getConnectedInputMetadata: getConnectedInputMetadataMock,
  }),
}));

vi.mock('@mui/x-tree-view/SimpleTreeView', () => ({
  SimpleTreeView: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='simple-tree-view'>{children}</div>
  ),
}));

vi.mock('@mui/x-tree-view/TreeItem', () => ({
  TreeItem: ({
    children,
    label,
  }: {
    children?: React.ReactNode;
    label: React.ReactNode;
  }) => (
    <div>
      {label}
      {children}
    </div>
  ),
}));

vi.mock('@/features/node/use-universal-node-data-input', () => ({
  NodeDataInput: ({
    currentValue,
    inputDefinition,
    onValueChange,
  }: {
    currentValue: unknown;
    inputDefinition: { attr_name: string };
    onValueChange: (value: unknown) => void;
  }) => (
    <input
      aria-label={inputDefinition.attr_name}
      value={String(currentValue ?? '')}
      onChange={event => onValueChange(event.target.value)}
    />
  ),
}));

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

const jsonMetadata: JsonMetadata = {
  type: 'JSON',
  response: {
    meta: {
      request_id: 'req-1',
    },
    items: [
      {
        payload: { id: 1 },
        tags: ['a'],
        debug: { raw: true },
      },
    ],
  },
  root: {
    name: '$',
    path: '$',
    display_path: '$',
    kind: 'OBJECT',
    occurrences: 1,
    children: [
      {
        name: 'meta',
        path: '$.meta',
        display_path: '$.meta',
        kind: 'OBJECT',
        required: true,
        nullable: false,
        occurrences: 1,
        children: [
          {
            name: 'request_id',
            path: '$.meta.request_id',
            display_path: '$.meta.request_id',
            kind: 'STRING',
            required: true,
            nullable: false,
            occurrences: 1,
            examples: ['req-1'],
          },
        ],
      },
      {
        name: 'items',
        path: '$.items',
        display_path: '$.items',
        kind: 'ARRAY',
        required: true,
        nullable: false,
        occurrences: 1,
        item_kind: 'OBJECT',
        array_min_items: 1,
        array_max_items: 3,
        sampled_items: 3,
        children: [
          {
            name: 'payload',
            path: '$.items[].payload',
            display_path: '$.items[].payload',
            kind: 'OBJECT',
            required: true,
            nullable: false,
            occurrences: 3,
            children: [],
          },
          {
            name: 'tags',
            path: '$.items[].tags',
            display_path: '$.items[].tags',
            kind: 'ARRAY',
            required: false,
            nullable: false,
            occurrences: 2,
            item_kind: 'STRING',
            children: [],
          },
          {
            name: 'debug',
            path: '$.items[].debug',
            display_path: '$.items[].debug',
            kind: 'OBJECT',
            required: false,
            nullable: true,
            occurrences: 1,
            children: [],
          },
        ],
      },
    ],
  },
  flatten_candidates: [
    {
      path: '$.items',
      display_path: '$.items',
      kind: 'RECORD_PATH',
      node_kind: 'ARRAY',
      confidence: 0.99,
      reason: 'Top-level collection',
    },
    {
      path: '$.meta.request_id',
      display_path: '$.meta.request_id',
      kind: 'META_PATH',
      node_kind: 'STRING',
      confidence: 0.77,
      reason: 'Scalar metadata',
    },
    {
      path: '$.items[].tags',
      display_path: '$.items[].tags',
      kind: 'EXPLODE_PATH',
      node_kind: 'ARRAY',
      confidence: 0.71,
      reason: 'Array suitable for explode',
    },
  ],
  stats: {
    total_nodes: 6,
    object_nodes: 3,
    array_nodes: 2,
    scalar_nodes: 1,
    union_nodes: 0,
    max_depth: 3,
  },
  inferred_schema: {
    type: 'object',
  },
  structure_truncated: false,
};

const nodeDefinition: NodeDefinition = {
  name: 'JSON Editor',
  input_definitions: {
    json: {
      attr_name: 'json',
      display_name: 'JSON',
      type: 'JSON',
    },
    separator: {
      attr_name: 'separator',
      display_name: 'Separator',
      type: 'STRING',
    },
    auto_detect_record_path: {
      attr_name: 'auto_detect_record_path',
      display_name: 'Auto detect',
      type: 'BOOLEAN',
    },
    max_rows: {
      attr_name: 'max_rows',
      display_name: 'Max rows',
      type: 'INT',
    },
  },
} as unknown as NodeDefinition;

const renderEditor = (initialLocalInputData: JsonEditorValues = {}) => {
  const Wrapper = () => {
    const [localInputData, setLocalInputData] = useState<JsonEditorValues>(
      initialLocalInputData
    );

    return (
      <>
        <JsonEditorEditor
          projectID='project-1'
          id='node-1'
          data={{
            name: 'JSONEditor',
            displayName: 'JSON Editor',
            inputValues: {},
          }}
          isOpen
          localInputData={localInputData}
          nodeDefinition={nodeDefinition}
          setLocalInputData={setLocalInputData}
          variables={[]}
        />
        <pre data-testid='local-input-data'>
          {JSON.stringify(localInputData)}
        </pre>
      </>
    );
  };

  return render(<Wrapper />);
};

const getSerializedInputData = (): JsonEditorValues =>
  JSON.parse(screen.getByTestId('local-input-data').textContent ?? '{}');

describe('JsonEditorEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectedMetadataByInputNameRef.current = {
      json: jsonMetadata,
    };
    getConnectedInputMetadataMock.mockImplementation((inputName: string) => {
      return inputName === 'json' ? jsonMetadata : null;
    });
  });

  it('shows schema mapping empty state without connected metadata', () => {
    connectedMetadataByInputNameRef.current = {};
    getConnectedInputMetadataMock.mockReturnValue(null);

    renderEditor();

    expect(screen.getByText('Schema mapping')).toBeInTheDocument();
    expect(
      screen.getByText(
        'JSON schema tree будет доступен после подключения metadata.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Источник строк')).toBeInTheDocument();
    expect(screen.getByText('Исключить')).toBeInTheDocument();
  });

  it('opens help dialog with node behavior description', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Как работает нода' }));

    expect(
      screen.getByRole('heading', { name: 'Как работает JSON Editor' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /JSON Editor подготавливает JSON к превращению в таблицу/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Что делает нода')).toBeInTheDocument();
    expect(screen.getByText('Важные правила')).toBeInTheDocument();
  });

  it('syncs path selections from candidates, tree actions and mapping panel remove buttons', async () => {
    renderEditor();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Сделать источником строк $.items',
      })
    );

    await waitFor(() => {
      expect(getSerializedInputData().record_path).toBe('$.items');
    });

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'request_id' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Добавить в каждую строку $.meta.request_id',
      })
    );

    await waitFor(() => {
      expect(getSerializedInputData().meta_paths).toEqual([
        '$.meta.request_id',
      ]);
    });

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'tags' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Размножить строки по массиву $.items[].tags',
      })
    );

    await waitFor(() => {
      expect(getSerializedInputData().explode_paths).toEqual([
        '$.items[].tags',
      ]);
    });

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'payload' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Оставить как JSON $.items[].payload',
      })
    );

    await waitFor(() => {
      expect(getSerializedInputData().keep_json_paths).toEqual([
        '$.items[].payload',
      ]);
    });

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'debug' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Исключить из результата $.items[].debug',
      })
    );

    await waitFor(() => {
      expect(getSerializedInputData().exclude_paths).toEqual([
        '$.items[].debug',
      ]);
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'remove Оставить как JSON $.items[].payload',
      })
    );

    await waitFor(() => {
      expect(getSerializedInputData().keep_json_paths).toEqual([]);
    });
  }, 15000);

  it('collapses and expands path mapping groups without losing entries', async () => {
    renderEditor({
      keep_json_paths: ['$.items[].payload'],
    });

    expect(
      screen.getByRole('button', {
        name: 'remove Оставить как JSON $.items[].payload',
      })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'collapse Оставить как JSON',
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('button', {
          name: 'remove Оставить как JSON $.items[].payload',
        })
      ).not.toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'expand Оставить как JSON',
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: 'remove Оставить как JSON $.items[].payload',
        })
      ).toBeInTheDocument();
    });
  });

  it('hides path mapping panel in tree only layout and clears all selections', async () => {
    renderEditor({
      record_path: '$.items',
      meta_paths: ['$.meta.request_id'],
    });

    fireEvent.click(screen.getByRole('button', { name: /Tree only/i }));

    expect(screen.queryByText('Path mapping')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Поиск по path...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Очистить всё' }));

    await waitFor(() => {
      expect(getSerializedInputData().record_path).toBe('');
      expect(getSerializedInputData().meta_paths).toEqual([]);
    });
  });

  it('clears only one mapping category from path mapping header action', async () => {
    renderEditor({
      keep_json_paths: ['$.items[].payload'],
      meta_paths: ['$.meta.request_id'],
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'clear Оставить как JSON',
      })
    );

    await waitFor(() => {
      expect(getSerializedInputData().keep_json_paths).toEqual([]);
      expect(getSerializedInputData().meta_paths).toEqual([
        '$.meta.request_id',
      ]);
    });
  });

  it('disables conflicting actions on the same path and blocks second record_path', () => {
    renderEditor({
      record_path: '$.items',
      meta_paths: ['$.meta.request_id'],
    });

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'request_id' },
    });

    expect(
      screen.getByRole('button', {
        name: 'Исключить из результата $.meta.request_id',
      })
    ).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'payload' },
    });

    expect(
      screen.getByRole('button', {
        name: 'Сделать источником строк $.items[].payload',
      })
    ).toBeDisabled();
  });

  it('blocks subtree actions for paths inside keep_json branch', () => {
    renderEditor({
      keep_json_paths: ['$.items'],
    });

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'payload' },
    });

    expect(
      screen.getByRole('button', {
        name: 'Добавить в каждую строку $.items[].payload',
      })
    ).toBeDisabled();
  });

  it('does not auto-replace action on the same path and keeps state unchanged', async () => {
    renderEditor({
      meta_paths: ['$.meta.request_id'],
    });

    fireEvent.change(screen.getByPlaceholderText('Поиск по path...'), {
      target: { value: 'request_id' },
    });

    const excludeButton = screen.getByRole('button', {
      name: 'Исключить из результата $.meta.request_id',
    });

    expect(excludeButton).toBeDisabled();
    fireEvent.click(excludeButton);

    await waitFor(() => {
      expect(getSerializedInputData().meta_paths).toEqual([
        '$.meta.request_id',
      ]);
      expect(getSerializedInputData().exclude_paths).toBeUndefined();
    });
  });
});
