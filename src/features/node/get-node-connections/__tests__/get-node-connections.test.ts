import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { fakeState } = vi.hoisted(() => ({
  fakeState: {
    __inputs: {
      'node-1': {
        inputA: { nodeID: 'parent-1', outputName: 'out' },
      },
    },
    __outputs: {
      'node-1': {
        outputA: { nodeID: 'child-1', inputName: 'in' },
      },
    },
    __inputValues: {
      'node-1': {
        threshold: { __dvt_type: 'const', value: 10 },
      },
    },
    __metadataByInputName: {
      inputA: { columns: [{ name: 'id' }] },
    },
  },
}));

vi.mock('@/app/providers/store', () => ({
  useAppSelector: (selector: (state: any) => unknown) => selector(fakeState),
  createAppAsyncThunk: vi.fn(),
}));

vi.mock('@/entities/project-editor/graph', () => ({
  makeConnectedInputsByNodeIDSelector: () => (state: any, nodeID: string) =>
    state.__inputs[nodeID] ?? null,
  makeConnectedOutputsByNodeIDSelector: () => (state: any, nodeID: string) =>
    state.__outputs[nodeID] ?? null,
  selectInputValues: (state: any, nodeID: string) =>
    state.__inputValues[nodeID] ?? null,
}));

vi.mock('@/entities/node/node-metadata', () => ({
  makeConnectedMetadataByInputNameSelector: () => (state: any) =>
    state.__metadataByInputName,
}));

import { useNodeConnections } from '@/features/node/get-node-connections';

describe('features/get-node-connections', () => {
  it('returns derived connections, metadata and helper accessors', () => {
    const { result } = renderHook(() => useNodeConnections('node-1'));

    expect(result.current.connectedInputs).toEqual({
      inputA: { nodeID: 'parent-1', outputName: 'out' },
    });
    expect(result.current.connectedOutputs).toEqual({
      outputA: { nodeID: 'child-1', inputName: 'in' },
    });
    expect(result.current.connectedParentNodeIDs).toEqual(['parent-1']);
    expect(result.current.inputValues).toEqual({
      threshold: { __dvt_type: 'const', value: 10 },
    });
    expect(result.current.getConnectedInputNodeID('inputA')).toBe('parent-1');
    expect(result.current.getConnectedInputMetadata('inputA')).toEqual({
      columns: [{ name: 'id' }],
    });
  });
});
