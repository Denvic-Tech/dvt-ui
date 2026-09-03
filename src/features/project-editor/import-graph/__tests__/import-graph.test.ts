import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const {
  fitViewMock,
  showNotificationMock,
  generateShortEdgeIDMock,
  generateShortNodeIDMock,
  generateShortSubgraphIDMock,
  dispatchMock,
  createAppAsyncThunkMock,
  mockState,
} = vi.hoisted(() => ({
  fitViewMock: vi.fn(async () => undefined),
  showNotificationMock: vi.fn(),
  generateShortEdgeIDMock: vi.fn(),
  generateShortNodeIDMock: vi.fn(),
  generateShortSubgraphIDMock: vi.fn(),
  dispatchMock: vi.fn(),
  createAppAsyncThunkMock: vi.fn(() => {
    const thunk = vi.fn();
    (thunk as any).pending = { type: 'mock/pending' };
    (thunk as any).fulfilled = { type: 'mock/fulfilled' };
    (thunk as any).rejected = { type: 'mock/rejected' };
    return thunk;
  }),
  mockState: {
    graph: {
      nodesByID: {},
      edgesByID: {},
      subgraphsByID: {},
    },
  },
}));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    fitView: fitViewMock,
  }),
}));

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({
    showNotification: showNotificationMock,
  }),
}));

vi.mock('@/entities/project-editor/graph', async () => {
  const actual =
    await vi.importActual<typeof import('@/entities/project-editor/graph')>(
      '@/entities/project-editor/graph'
    );

  return {
    ...actual,
    generateShortEdgeID: generateShortEdgeIDMock,
    generateShortNodeID: generateShortNodeIDMock,
    generateShortSubgraphID: generateShortSubgraphIDMock,
  };
});

vi.mock('@/app/providers/store', () => ({
  useAppSelector: (selector: (state: any) => unknown) => selector(mockState),
  useAppDispatch: () => dispatchMock,
  createAppAsyncThunk: createAppAsyncThunkMock,
}));

vi.mock('@/features/project-editor/sync-graph', () => ({
  flushGraphOperations: () => ({ type: 'syncGraph/flushGraphOperations' }),
}));

import { useImportGraph } from '@/features/project-editor/import-graph';
import type { ImportGraphParams } from '@/features/project-editor/import-graph/model/hooks/useImportGraph.ts';

type OnCreate = ImportGraphParams['onCreate'];

describe('features/import-graph', () => {
  it('shows validation error for non-json files', async () => {
    const onCreate = vi.fn(
      async (_payload: Parameters<OnCreate>[0]) => undefined
    );
    const { result } = renderHook(() => useImportGraph({ onCreate }));

    const inputElement = {
      type: '',
      accept: '',
      onchange: null as null | ((event: Event) => void),
      click: vi.fn(),
    } as unknown as HTMLInputElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        if (tagName === 'input') {
          return inputElement;
        }
        return originalCreateElement(tagName);
      }) as typeof document.createElement);

    act(() => {
      result.current.handleImport();
    });

    expect(inputElement.click).toHaveBeenCalledTimes(1);

    const fakeEvent = {
      target: {
        files: [
          {
            name: 'graph.txt',
            type: 'text/plain',
          },
        ],
      },
    } as unknown as Event;

    await act(async () => {
      inputElement.onchange?.(fakeEvent);
    });

    expect(showNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      })
    );
    expect(onCreate).not.toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('regenerates colliding ids and remaps edges on import', async () => {
    mockState.graph.nodesByID = { node_existing: { id: 'node_existing' } };
    mockState.graph.edgesByID = { edge_existing: { id: 'edge_existing' } };
    mockState.graph.subgraphsByID = {};

    const onCreate = vi.fn(
      async (_payload: Parameters<OnCreate>[0]) => undefined
    );
    const { result } = renderHook(() => useImportGraph({ onCreate }));

    const inputElement = {
      type: '',
      accept: '',
      onchange: null as null | ((event: Event) => void),
      click: vi.fn(),
    } as unknown as HTMLInputElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        if (tagName === 'input') {
          return inputElement;
        }
        return originalCreateElement(tagName);
      }) as typeof document.createElement);

    const fileReaderMock = {
      onload: null as null | ((event: ProgressEvent<FileReader>) => void),
      readAsText: vi.fn(function (this: typeof fileReaderMock) {
        const payload = JSON.stringify({
          nodes: [
            {
              id: 'node_existing',
              type: 'custom',
              position: { x: 10, y: 20 },
              data: {
                name: 'NodeA',
                displayName: 'Node A',
                inputValues: {},
              },
            },
            {
              id: 'node_ok',
              type: 'custom',
              position: { x: 30, y: 40 },
              data: {
                name: 'NodeB',
                displayName: 'Node B',
                inputValues: {},
              },
            },
          ],
          edges: [
            {
              id: 'edge_existing',
              source: 'node_existing',
              target: 'node_ok',
              type: 'custom',
              sourceHandle: 'output-out',
              targetHandle: 'input-in',
            },
            {
              id: 'edge_bad',
              source: 'node_missing',
              target: 'node_ok',
              type: 'custom',
              sourceHandle: 'output-out',
              targetHandle: 'input-in',
            },
          ],
        });

        this.onload?.({
          target: { result: payload } as FileReader,
        } as ProgressEvent<FileReader>);
      }),
    };

    const fileReaderSpy = vi
      .spyOn(window, 'FileReader')
      .mockImplementation(function MockFileReader(this: FileReader) {
        return fileReaderMock as unknown as FileReader;
      } as unknown as typeof FileReader);

    generateShortNodeIDMock.mockReturnValueOnce('node_new');
    generateShortEdgeIDMock.mockReturnValueOnce('edge_new');

    act(() => {
      result.current.handleImport();
    });

    const fakeEvent = {
      target: {
        files: [
          {
            name: 'graph.json',
            type: 'application/json',
          },
        ],
      },
    } as unknown as Event;

    await act(async () => {
      inputElement.onchange?.(fakeEvent);
    });

    expect(onCreate).toHaveBeenCalledTimes(1);
    const payload =
      (onCreate.mock.calls[0]?.[0] as Parameters<OnCreate>[0] | undefined) ??
      undefined;
    if (!payload) {
      throw new Error('onCreate did not receive payload');
    }
    expect(payload.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'node_new' }),
        expect.objectContaining({ id: 'node_ok' }),
      ])
    );
    expect(payload.edges).toEqual([
      expect.objectContaining({
        id: 'edge_new',
        source: 'node_new',
        target: 'node_ok',
      }),
    ]);

    expect(fileReaderMock.readAsText).toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();

    mockState.graph.nodesByID = {};
    mockState.graph.edgesByID = {};
    mockState.graph.subgraphsByID = {};
    fileReaderSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('extracts legacy subgraphs from exported visible graph format', async () => {
    mockState.graph.nodesByID = {};
    mockState.graph.edgesByID = {};
    mockState.graph.subgraphsByID = {};

    const onCreate = vi.fn(
      async (_payload: Parameters<OnCreate>[0]) => undefined
    );
    const { result } = renderHook(() => useImportGraph({ onCreate }));

    const inputElement = {
      type: '',
      accept: '',
      onchange: null as null | ((event: Event) => void),
      click: vi.fn(),
    } as unknown as HTMLInputElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        if (tagName === 'input') {
          return inputElement;
        }
        return originalCreateElement(tagName);
      }) as typeof document.createElement);

    const fileReaderMock = {
      onload: null as null | ((event: ProgressEvent<FileReader>) => void),
      readAsText: vi.fn(function (this: typeof fileReaderMock) {
        const payload = JSON.stringify({
          nodes: [
            {
              id: 'node_external',
              type: 'custom',
              position: { x: 10, y: 20 },
              data: {
                name: 'ExternalNode',
                displayName: 'External Node',
                inputValues: {},
              },
            },
            {
              id: 'node_member',
              type: 'custom',
              subgraphId: 'subgraph_legacy',
              position: { x: 30, y: 40 },
              data: {
                name: 'MemberNode',
                displayName: 'Member Node',
                inputValues: {},
              },
            },
            {
              id: 'subgraph_legacy',
              type: 'subgraph',
              position: { x: 0, y: 0 },
              selected: false,
              data: {
                name: 'subgraph',
                displayName: 'Legacy Subgraph',
                color: '#123456',
                comment: 'legacy',
                inputValues: {},
                ports: [
                  {
                    id: 'sg-in:node_member:input-in',
                    side: 'input',
                    internalNodeId: 'node_member',
                    internalHandleId: 'input-in',
                  },
                ],
              },
            },
          ],
          edges: [
            {
              id: 'proxy:edge_real',
              source: 'node_external',
              target: 'subgraph_legacy',
              type: 'custom',
              sourceHandle: 'output-out',
              targetHandle: 'sg-in:node_member:input-in',
              data: {
                synthetic: true,
                realEdgeId: 'edge_real',
              },
            },
          ],
        });

        this.onload?.({
          target: { result: payload } as FileReader,
        } as ProgressEvent<FileReader>);
      }),
    };

    const fileReaderSpy = vi
      .spyOn(window, 'FileReader')
      .mockImplementation(function MockFileReader(this: FileReader) {
        return fileReaderMock as unknown as FileReader;
      } as unknown as typeof FileReader);

    act(() => {
      result.current.handleImport();
    });

    const fakeEvent = {
      target: {
        files: [
          {
            name: 'legacy-subgraph.json',
            type: 'application/json',
          },
        ],
      },
    } as unknown as Event;

    await act(async () => {
      inputElement.onchange?.(fakeEvent);
    });

    const payload =
      (onCreate.mock.calls[0]?.[0] as Parameters<OnCreate>[0] | undefined) ??
      undefined;
    if (!payload) {
      throw new Error('onCreate did not receive payload');
    }

    expect(payload.subgraphs).toEqual([
      expect.objectContaining({
        id: 'subgraph_legacy',
        type: 'subgraph',
        data: expect.objectContaining({
          displayName: 'Legacy Subgraph',
          color: '#123456',
          comment: 'legacy',
        }),
      }),
    ]);
    expect(payload.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'node_member',
          subgraphId: 'subgraph_legacy',
        }),
      ])
    );
    expect(payload.edges).toEqual([
      expect.objectContaining({
        id: 'edge_real',
        source: 'node_external',
        target: 'node_member',
        targetHandle: 'input-in',
      }),
    ]);

    fileReaderSpy.mockRestore();
    createElementSpy.mockRestore();
  });
});
