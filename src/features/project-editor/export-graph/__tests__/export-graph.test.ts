import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import { exportGraphThunk } from '@/features/project-editor/export-graph';

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
}));

describe('features/export-graph', () => {
  it('exports merged graph JSON and triggers browser download', async () => {
    const dispatch = vi.fn();
    const getState = () =>
      ({
        projects: {
          selectedProject: { id: 'project-1', name: 'Alpha' },
        },
        graph: {
          nodeDataByID: {
            'node-b': {
              name: 'writer',
              displayName: 'Writer Node',
              inputValues: { x: { __dvt_type: 'const', value: 123 } },
            },
            'node-a': {
              name: 'reader',
              displayName: 'Reader Node',
              inputValues: { y: { __dvt_type: 'const', value: 456 } },
            },
          },
          nodesByID: {
            'node-b': {
              id: 'node-b',
              position: { x: 1, y: 2 },
              data: {
                name: 'writer',
                displayName: 'Writer Draft',
                inputValues: {},
              },
              measured: { width: 10, height: 10 },
            },
            'node-a': {
              id: 'node-a',
              position: { x: 0, y: 0 },
              data: {
                name: 'reader',
                displayName: 'Reader Draft',
                inputValues: {},
              },
            },
          },
          edgesByID: {
            'edge-b': {
              id: 'edge-b',
              source: 'node-b',
              target: 'node-a',
              sourceHandle: 'output-main',
              targetHandle: 'input-main',
            },
            'edge-a': {
              id: 'edge-a',
              source: 'node-a',
              target: 'node-b',
              sourceHandle: 'output-main',
              targetHandle: 'input-main',
            },
          },
          subgraphsByID: {
            'subgraph-b': {
              id: 'subgraph-b',
              type: 'subgraph',
              position: { x: 10, y: 10 },
              data: { name: 'Subgraph B', displayName: 'Subgraph B' },
            },
            'subgraph-a': {
              id: 'subgraph-a',
              type: 'subgraph',
              position: { x: 0, y: 0 },
              data: { name: 'Subgraph A', displayName: 'Subgraph A' },
            },
          },
        },
      }) as any;

    const createObjectURL = vi.fn(() => 'blob:test-url');
    const revokeObjectURL = vi.fn();
    class MockBlob {
      parts: unknown[];
      options: Record<string, unknown> | undefined;

      constructor(parts: unknown[], options?: Record<string, unknown>) {
        this.parts = parts;
        this.options = options;
      }
    }
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    vi.stubGlobal('Blob', MockBlob as unknown as typeof Blob);

    const originalCreateElement = document.createElement.bind(document);
    const clickMock = vi.fn();
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          (element as HTMLAnchorElement).click = clickMock;
        }
        return element;
      }) as typeof document.createElement);

    const result = await exportGraphThunk()(
      dispatch,
      getState,
      undefined as never
    );

    expect(result.type).toBe('graph/export/fulfilled');
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');

    const firstCreateObjectURLCall = createObjectURL.mock.calls[0] as
      | unknown[]
      | undefined;
    expect(firstCreateObjectURLCall).toBeDefined();

    const blob = firstCreateObjectURLCall?.[0] as {
      parts: unknown[];
      options?: Record<string, unknown>;
    };
    const payload = JSON.parse(String(blob.parts[0]));

    expect(payload.projectId).toBe('project-1');
    expect(payload.projectName).toBe('Alpha');
    expect(payload.nodes.map((node: { id: string }) => node.id)).toEqual([
      'node-a',
      'node-b',
    ]);
    expect(payload.edges.map((edge: { id: string }) => edge.id)).toEqual([
      'edge-a',
      'edge-b',
    ]);
    expect(
      payload.subgraphs.map((subgraph: { id: string }) => subgraph.id)
    ).toEqual(['subgraph-a', 'subgraph-b']);

    createElementSpy.mockRestore();
  });
});
