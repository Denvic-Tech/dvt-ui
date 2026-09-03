import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dispatchMock, fakeState } = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
  fakeState: {
    graph: {
      nodeDataByID: {
        'node-1': {
          name: 'reader',
          displayName: 'Reader',
          inputValues: {},
        },
      },
    },
  },
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: any) => unknown) => selector(fakeState),
  createAppAsyncThunk: vi.fn(),
}));

vi.mock('@/entities/project-editor/graph/model/selectors.ts', () => ({
  makeNodeDataByIDSelector:
    () => (state: any, nodeID: string | null | undefined) =>
      nodeID ? (state.graph.nodeDataByID[nodeID] ?? null) : null,
}));

vi.mock('@/entities/project-editor/graph', () => ({
  graphActions: {
    updateDisplayName: (payload: any) => ({
      type: 'graph/updateDisplayName',
      payload,
    }),
    updateComment: (payload: any) => ({
      type: 'graph/updateComment',
      payload,
    }),
    updateStoreEnabled: (payload: any) => ({
      type: 'graph/updateStoreEnabled',
      payload,
    }),
    updateShowSignalIo: (payload: any) => ({
      type: 'graph/updateShowSignalIo',
      payload,
    }),
    updateShowVariablesIo: (payload: any) => ({
      type: 'graph/updateShowVariablesIo',
      payload,
    }),
    updateInputValue: (payload: any) => ({
      type: 'graph/updateInputValue',
      payload,
    }),
    updateInputValues: (payload: any) => ({
      type: 'graph/updateInputValues',
      payload,
    }),
  },
}));

vi.mock('@/entities/node/node-metadata', () => ({
  nodeMetadataActions: {
    setNodeMetadataActuality: (payload: any) => ({
      type: 'node-metadata/setNodeMetadataActuality',
      payload,
    }),
  },
}));

import { useNodeData } from '@/features/node/manage-node-data';

describe('features/manage-node-data', () => {
  beforeEach(() => {
    dispatchMock.mockReset();
  });

  it('updates input value with const and variable wrappers', () => {
    const { result } = renderHook(() => useNodeData('node-1'));

    act(() => {
      result.current.updateShowSignalIo(true);
      result.current.updateShowVariablesIo(true);
      result.current.updateInputValueWithConstant('threshold', 5);
      result.current.updateInputValueWithVariable('table_name', 'orders');
    });

    expect(dispatchMock).toHaveBeenCalledTimes(6);

    const showSignalAction = dispatchMock.mock.calls[0][0];
    expect(showSignalAction.type).toBe('graph/updateShowSignalIo');
    expect(showSignalAction.payload).toEqual({
      nodeID: 'node-1',
      showSignalIo: true,
    });

    const showVariablesAction = dispatchMock.mock.calls[1][0];
    expect(showVariablesAction.type).toBe('graph/updateShowVariablesIo');
    expect(showVariablesAction.payload).toEqual({
      nodeID: 'node-1',
      showVariablesIo: true,
    });

    const constInputAction = dispatchMock.mock.calls[2][0];
    expect(constInputAction.type).toBe('graph/updateInputValue');
    expect(constInputAction.payload.value).toEqual({
      __dvt_type: 'const',
      value: 5,
    });

    const variableInputAction = dispatchMock.mock.calls[4][0];
    expect(variableInputAction.type).toBe('graph/updateInputValue');
    expect(variableInputAction.payload.value).toEqual({
      __dvt_type: 'expr',
      value: 'orders',
      expression_kind: 'single',
    });
  });
});
